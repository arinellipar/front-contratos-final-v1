import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { contractsApi } from "@/lib/api/contracts";
import {
  ContractCategory,
  ContractCreateDto,
  TipoPagamento,
  FormaPagamento,
  Filial,
} from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { FileUp, Save, X } from "lucide-react";
import { SubmitHandler } from "react-hook-form";

// Funções helper para formatação de valores
const formatCurrency = (value: string | number): string => {
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
      : value;
  if (isNaN(numValue)) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
};

const formatNumberWithSeparators = (value: string | number): string => {
  const numValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", "."))
      : value;
  if (isNaN(numValue)) return "";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

// Função para formatar valor como calculadora (digitação da direita para esquerda)
const formatCalculatorValue = (value: string): string => {
  // Remove tudo exceto números
  const numbersOnly = value.replace(/\D/g, "");

  if (numbersOnly === "") return "";

  // Se tem menos de 3 dígitos, adiciona zeros à esquerda
  let paddedValue = numbersOnly.padStart(3, "0");

  // Se tem 3 ou mais dígitos, insere o ponto decimal
  if (paddedValue.length >= 3) {
    const integerPart = paddedValue.slice(0, -2);
    const decimalPart = paddedValue.slice(-2);

    // Formata com separadores de milhares
    const formattedInteger = new Intl.NumberFormat("pt-BR").format(
      parseInt(integerPart)
    );

    return `${formattedInteger},${decimalPart}`;
  }

  return paddedValue;
};

// Função para converter valor formatado em número
const parseCalculatorValue = (value: string): number => {
  // Remove separadores de milhares e converte vírgula em ponto
  const cleanValue = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleanValue) || 0;
};

// Função para converter valor bruto (somente dígitos) em número com 2 casas decimais
const parseRawCents = (raw: string): number => {
  const numbersOnly = raw.replace(/\D/g, "");
  if (!numbersOnly) return 0;
  return parseInt(numbersOnly, 10) / 100;
};

const contractSchema = z.object({
  contrato: z.string().min(1, "Contrato é obrigatório").max(2000),
  contratante: z.string().min(1, "Contratante é obrigatório").max(500),
  contratada: z.string().min(1, "Contratada é obrigatória").max(500),
  objeto: z.string().min(1, "Objeto é obrigatório").max(1000),
  dataContrato: z.string().min(1, "Data do contrato é obrigatória"),
  prazo: z
    .string()
    .min(1, "Prazo é obrigatório")
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 36500,
      {
        message: "O prazo deve ser entre 1 e 36500 dias",
      }
    ),
  rescisao: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 3650),
      {
        message: "A rescisão deve ser entre 0 e 3650 dias",
      }
    ),
  multa: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "A multa deve ser um valor válido",
    }),
  avisoPrevia: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 365),
      {
        message: "O aviso prévio deve ser entre 0 e 365 dias",
      }
    ),
  observacoes: z.string().max(2000).optional(),
  filial: z.any().transform((val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const num = parseInt(val, 10);
      return !isNaN(num) ? num : 1;
    }
    return 1;
  }),
  categoriaContrato: z
    .string()
    .min(1, "Categoria do contrato é obrigatória")
    .max(50),
  setorResponsavel: z
    .string()
    .min(1, "Setor responsável é obrigatório")
    .max(200),
  valorTotalContrato: z
    .string()
    .min(1, "Valor total do contrato é obrigatório")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "O valor total deve ser maior que zero",
    }),
  tipoPagamento: z.any().transform((val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const num = parseInt(val, 10);
      return !isNaN(num) ? num : 1;
    }
    return 1;
  }),
  quantidadeParcelas: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 60),
      {
        message: "A quantidade de parcelas deve ser entre 1 e 60",
      }
    ),
  formaPagamento: z.any().transform((val) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const num = parseInt(val, 10);
      return !isNaN(num) ? num : 1;
    }
    return 1;
  }),
  dataFinal: z.string().min(1, "Data final é obrigatória"),
});

type ContractFormData = {
  contrato: string;
  contratante: string;
  contratada: string;
  objeto: string;
  dataContrato: string;
  prazo: string;
  rescisao?: string;
  multa?: string;
  avisoPrevia?: string;
  observacoes?: string;
  filial: Filial | number;
  categoriaContrato: string;
  setorResponsavel: string;
  valorTotalContrato: string;
  tipoPagamento: TipoPagamento | number;
  quantidadeParcelas?: string;
  formaPagamento: FormaPagamento | number;
  dataFinal: string;
  arquivoPdf?: File;
};

interface ContractFormProps {
  initialData?: Partial<ContractFormData>;
  contractId?: number;
}

export function ContractForm({ initialData, contractId }: ContractFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [originalData, setOriginalData] =
    useState<Partial<ContractFormData> | null>(null);
  const [valorPorParcela, setValorPorParcela] = useState<string>("");
  const [valorTotalFormatado, setValorTotalFormatado] = useState<string>("");
  const [valorTotalRaw, setValorTotalRaw] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] =
    useState<boolean>(!!contractId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      prazo: "30",
      dataContrato: new Date().toISOString().split("T")[0],
      dataFinal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      categoriaContrato: "Outros",
      filial: Filial.RioDeJaneiro,
      tipoPagamento: TipoPagamento.AVista,
      formaPagamento: FormaPagamento.Pix,
      ...initialData,
    },
  });

  // Atualizar formulário quando initialData mudar
  useEffect(() => {
    if (initialData) {
      console.log("🔄 Atualizando formulário com initialData:", initialData);

      // Usar reset para garantir que todos os valores sejam definidos corretamente
      const formData = {
        prazo: "30",
        dataContrato: new Date().toISOString().split("T")[0],
        dataFinal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        categoriaContrato: "Outros",
        filial: Filial.RioDeJaneiro,
        tipoPagamento: TipoPagamento.AVista,
        formaPagamento: FormaPagamento.Pix,
        ...initialData, // Sobrescreve com dados reais
      };

      console.log("🔄 Form data para reset:", formData);
      reset(formData);

      // Inicializar o estado formatado para exibição do valor
      if (initialData.valorTotalContrato) {
        const valorEmCentavos = parseRawCents(initialData.valorTotalContrato);
        if (valorEmCentavos > 0) {
          const formattedValue = formatCurrency(valorEmCentavos);
          setValorTotalFormatado(formattedValue);
          setValorTotalRaw(initialData.valorTotalContrato);
        }

        console.log(
          "💰 Valor total definido:",
          initialData.valorTotalContrato,
          "-> R$",
          valorEmCentavos
        );
      }

      console.log("💳 Tipo pagamento final:", formData.tipoPagamento);
      console.log("🏦 Forma pagamento final:", formData.formaPagamento);

      // Salvar dados originais para comparação
      if (!originalData) {
        setOriginalData(initialData);
        console.log("📝 Dados originais salvos:", initialData);
      }

      // Sinalizar que o carregamento inicial terminou
      setIsInitialLoading(false);
    }
  }, [initialData, reset, originalData]);

  // Função para rastrear modificações nos campos usando useCallback
  const trackFieldChange = useCallback(
    (fieldName: string, newValue: any) => {
      if (!originalData) return;

      const originalValue = originalData[fieldName as keyof ContractFormData];
      const isModified = newValue !== originalValue;

      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        if (isModified) {
          newSet.add(fieldName);
        } else {
          newSet.delete(fieldName);
        }
        return newSet;
      });
    },
    [originalData]
  );

  // Observar mudanças no valor total e quantidade de parcelas para calcular valor por parcela
  const valorTotal = watch("valorTotalContrato");
  const quantidadeParcelas = watch("quantidadeParcelas");
  const tipoPagamento = watch("tipoPagamento");

  // Remover o watch global que causava loop infinito
  // Vamos rastrear mudanças apenas nos campos principais individualmente

  // Rastreamento manual será feito nos handlers específicos quando necessário

  useEffect(() => {
    if (valorTotal && quantidadeParcelas) {
      const valorNumerico = parseRawCents(valorTotal);
      const parcelas = parseInt(quantidadeParcelas);

      if (valorNumerico > 0 && parcelas > 0) {
        const valorParcela = valorNumerico / parcelas;
        setValorPorParcela(formatCurrency(valorParcela));
      } else {
        setValorPorParcela("");
      }
    } else {
      setValorPorParcela("");
    }
  }, [valorTotal, quantidadeParcelas, tipoPagamento]);

  // Formatar valor total automaticamente
  useEffect(() => {
    if (valorTotal) {
      setValorTotalFormatado(formatCalculatorValue(valorTotal));
    } else {
      setValorTotalFormatado("");
    }
  }, [valorTotal]);

  // LÓGICA SIMPLES: À vista = 1 parcela, Parcelado = > 1 parcela
  useEffect(() => {
    // Não interferir durante o carregamento inicial
    if (isInitialLoading) return;

    if (tipoPagamento === TipoPagamento.AVista) {
      // SEMPRE forçar "1" para pagamento à vista
      if (quantidadeParcelas !== "1") {
        console.log(
          "🔒 Forçando quantidade de parcelas para '1' (pagamento à vista)"
        );
        setValue("quantidadeParcelas", "1");
      }
    } else if (
      tipoPagamento === TipoPagamento.Parcelado &&
      (!quantidadeParcelas || parseInt(quantidadeParcelas) <= 1)
    ) {
      setValue("quantidadeParcelas", "2");
    }
  }, [tipoPagamento, quantidadeParcelas, setValue, isInitialLoading]);

  // Controlar forma de pagamento baseado no tipo de pagamento
  useEffect(() => {
    // Não interferir durante o carregamento inicial
    if (isInitialLoading) return;

    const formaPagamentoAtual = watch("formaPagamento");

    if (formaPagamentoAtual === FormaPagamento.Pix) {
      // Se escolher PIX, força pagamento à vista
      if (tipoPagamento !== TipoPagamento.AVista) {
        setValue("tipoPagamento", TipoPagamento.AVista);
        setValue("quantidadeParcelas", "1");
        toast.success(
          "PIX selecionado. Tipo de pagamento alterado para 'À Vista' automaticamente."
        );
      }
      // Garantir que quantidade de parcelas seja sempre "1" quando PIX for selecionado
      if (quantidadeParcelas !== "1") {
        setValue("quantidadeParcelas", "1");
      }
    }
  }, [tipoPagamento, setValue, watch, quantidadeParcelas, isInitialLoading]);

  // Monitorar mudanças na forma de pagamento para bloquear parcelas quando PIX for selecionado
  useEffect(() => {
    // Não interferir durante o carregamento inicial
    if (isInitialLoading) return;

    const formaPagamentoAtual = watch("formaPagamento");

    if (formaPagamentoAtual === FormaPagamento.Pix) {
      // Se PIX for selecionado, garantir que seja à vista com 1 parcela
      setValue("tipoPagamento", TipoPagamento.AVista);
      setValue("quantidadeParcelas", "1");
    }
  }, [watch("formaPagamento"), setValue, isInitialLoading]);

  // Monitorar mudanças no tipo de pagamento para bloquear/desbloquear campo de parcelas
  useEffect(() => {
    // Não interferir durante o carregamento inicial
    if (isInitialLoading) return;

    if (tipoPagamento === TipoPagamento.AVista) {
      // Quando mudar para à vista, sempre definir como "1" e bloquear
      setValue("quantidadeParcelas", "1");
    }
  }, [tipoPagamento, setValue, isInitialLoading]);

  const createMutation = useMutation({
    mutationFn: contractsApi.create,
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      // Invalidação imediata e agressiva do cache
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      router.push("/dashboard");
    },
    onError: (error: any) => {
      console.error("Erro ao criar contrato:", error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao criar contrato. Tente novamente."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContractCreateDto }) =>
      contractsApi.update(id, data),
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      // Invalidação imediata e agressiva do cache
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      router.push("/dashboard");
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar contrato:", error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao atualizar contrato. Tente novamente."
      );
    },
  });

  const onSubmit: SubmitHandler<ContractFormData> = async (
    data: ContractFormData
  ) => {
    console.log("🔍 Form data before submission:", data);
    console.log("🔍 Form values from watch:", {
      filial: watch("filial"),
      tipoPagamento: watch("tipoPagamento"),
      formaPagamento: watch("formaPagamento"),
      valorTotalContrato: watch("valorTotalContrato"),
    });
    console.log("🔍 Valores brutos dos campos problemáticos:");
    console.log("  - data.filial:", data.filial, "type:", typeof data.filial);
    console.log(
      "  - data.tipoPagamento:",
      data.tipoPagamento,
      "type:",
      typeof data.tipoPagamento
    );
    console.log(
      "  - data.formaPagamento:",
      data.formaPagamento,
      "type:",
      typeof data.formaPagamento
    );
    console.log("Arquivo PDF no submit:", selectedFile);

    // Validação dos campos obrigatórios
    if (!data.contrato?.trim()) {
      toast.error("Contrato é obrigatório");
      return;
    }
    if (!data.contratante?.trim()) {
      toast.error("Contratante é obrigatório");
      return;
    }
    if (!data.contratada?.trim()) {
      toast.error("Contratada é obrigatória");
      return;
    }
    if (!data.objeto?.trim()) {
      toast.error("Objeto é obrigatório");
      return;
    }
    if (!data.dataContrato) {
      toast.error("Data do contrato é obrigatória");
      return;
    }
    if (!data.prazo || Number(data.prazo) <= 0) {
      toast.error("Prazo é obrigatório e deve ser maior que zero");
      return;
    }
    if (!data.filial) {
      toast.error("Filial é obrigatória");
      return;
    }
    if (!data.categoriaContrato?.trim()) {
      toast.error("Categoria do contrato é obrigatória");
      return;
    }
    if (!data.setorResponsavel?.trim()) {
      toast.error("Setor responsável é obrigatório");
      return;
    }
    if (!data.valorTotalContrato || Number(data.valorTotalContrato) <= 0) {
      toast.error(
        "Valor total do contrato é obrigatório e deve ser maior que zero"
      );
      return;
    }
    if (!data.tipoPagamento) {
      toast.error("Tipo de pagamento é obrigatório");
      return;
    }
    if (!data.formaPagamento) {
      toast.error("Forma de pagamento é obrigatória");
      return;
    }

    // Validações específicas de regras de negócio
    if (data.tipoPagamento === TipoPagamento.AVista) {
      // FORÇAR quantidade de parcelas como "1" para pagamento à vista
      if (!data.quantidadeParcelas || parseInt(data.quantidadeParcelas) !== 1) {
        console.log(
          "🔒 Forçando quantidade de parcelas para '1' no submit (pagamento à vista)"
        );
        data.quantidadeParcelas = "1";
      }
    } else if (data.tipoPagamento === TipoPagamento.Parcelado) {
      if (!data.quantidadeParcelas || parseInt(data.quantidadeParcelas) < 2) {
        toast.error("Pagamento parcelado deve ter pelo menos 2 parcelas");
        return;
      }
    }

    if (
      data.formaPagamento === FormaPagamento.Pix &&
      data.tipoPagamento !== TipoPagamento.AVista
    ) {
      toast.error("PIX só pode ser usado para pagamento à vista");
      return;
    }

    if (!data.dataFinal) {
      toast.error("Data final é obrigatória");
      return;
    }

    if (selectedFile && !(selectedFile instanceof File)) {
      toast.error("O arquivo selecionado não é válido.");
      return;
    }

    const submitData: ContractCreateDto = {
      contrato: data.contrato.trim(),
      contratante: data.contratante.trim(),
      contratada: data.contratada.trim(),
      objeto: data.objeto.trim(),
      dataContrato: data.dataContrato,
      prazo: Number(data.prazo),
      rescisao: data.rescisao ? Number(data.rescisao) : undefined,
      multa: data.multa ? Number(data.multa) : undefined,
      avisoPrevia: data.avisoPrevia ? Number(data.avisoPrevia) : undefined,
      observacoes: data.observacoes?.trim(),
      filial: data.filial || Filial.RioDeJaneiro, // setValueAs já converte para number
      categoriaContrato: data.categoriaContrato.trim(),
      setorResponsavel: data.setorResponsavel.trim(),
      valorTotalContrato: parseRawCents(data.valorTotalContrato),
      tipoPagamento: data.tipoPagamento || TipoPagamento.AVista, // setValueAs já converte para number
      quantidadeParcelas: data.quantidadeParcelas
        ? Number(data.quantidadeParcelas)
        : undefined,
      formaPagamento: data.formaPagamento || FormaPagamento.Pix, // setValueAs já converte para number
      dataFinal: data.dataFinal,
      arquivoPdf: selectedFile || undefined, // Garante que o arquivo vá para o backend
    };

    console.log("🔍 Submit data after processing:", submitData);
    console.log("📋 Campos críticos com valores forçados:");
    console.log(
      "  - valorTotalContrato raw:",
      data.valorTotalContrato,
      "-> parsed:",
      submitData.valorTotalContrato
    );
    console.log(
      "  - filial:",
      data.filial,
      "type:",
      typeof data.filial,
      "-> submitData:",
      submitData.filial,
      "type:",
      typeof submitData.filial,
      "forçado?",
      !data.filial ? "SIM" : "NÃO"
    );
    console.log(
      "  - tipoPagamento:",
      data.tipoPagamento,
      "type:",
      typeof data.tipoPagamento,
      "-> submitData:",
      submitData.tipoPagamento,
      "type:",
      typeof submitData.tipoPagamento,
      "forçado?",
      !data.tipoPagamento ? "SIM" : "NÃO"
    );
    console.log(
      "  - formaPagamento:",
      data.formaPagamento,
      "type:",
      typeof data.formaPagamento,
      "-> submitData:",
      submitData.formaPagamento,
      "type:",
      typeof submitData.formaPagamento,
      "forçado?",
      !data.formaPagamento ? "SIM" : "NÃO"
    );
    console.log("📋 Validação dos dados:");
    console.log(
      `  - Contrato: "${submitData.contrato}" (${submitData.contrato.length} chars)`
    );
    console.log(
      `  - Contratante: "${submitData.contratante}" (${submitData.contratante.length} chars)`
    );
    console.log(
      `  - Contratada: "${submitData.contratada}" (${submitData.contratada.length} chars)`
    );
    console.log(
      `  - Objeto: "${submitData.objeto}" (${submitData.objeto.length} chars)`
    );
    console.log(`  - DataContrato: "${submitData.dataContrato}"`);
    console.log(`  - Prazo: ${submitData.prazo}`);
    console.log(`  - Filial: ${submitData.filial}`);
    console.log(`  - CategoriaContrato: "${submitData.categoriaContrato}"`);
    console.log(`  - SetorResponsavel: "${submitData.setorResponsavel}"`);
    console.log(`  - ValorTotalContrato: R$ ${submitData.valorTotalContrato}`);
    console.log(`  - TipoPagamento: ${submitData.tipoPagamento}`);
    console.log(
      `  - QuantidadeParcelas: ${submitData.quantidadeParcelas || "N/A"}`
    );
    console.log(`  - FormaPagamento: ${submitData.formaPagamento}`);
    console.log(`  - DataFinal: "${submitData.dataFinal}"`);
    console.log(
      `  - ArquivoPdf: ${submitData.arquivoPdf ? `File(${submitData.arquivoPdf.name})` : "undefined"}`
    );

    if (selectedFile) {
      console.log("Enviando como FormData (com arquivo PDF)");
    } else {
      console.log("Enviando como FormData (sem arquivo PDF)");
    }

    try {
      if (contractId) {
        // Atualizando contrato existente
        // Simplificado: enviar todos os dados na edição por enquanto
        // TODO: Implementar rastreamento de mudanças de forma mais estável
        console.log("🔄 Atualizando contrato com todos os dados:", submitData);
        console.log("🔄 Especificamente os campos problemáticos:");
        console.log("  - tipoPagamento enviado:", submitData.tipoPagamento);
        console.log("  - formaPagamento enviado:", submitData.formaPagamento);
        updateMutation.mutate({ id: contractId, data: submitData });
      } else {
        // Criando novo contrato
        createMutation.mutate(submitData);
      }
    } catch (error) {
      console.error("❌ Erro ao enviar dados:", error);
      toast.error("Erro ao enviar dados do formulário");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Por favor, selecione apenas arquivos PDF");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 10MB");
        return;
      }

      setSelectedFile(file);
      toast.success("Arquivo selecionado com sucesso");
    }
  };

  const handleValorTotalChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    // Remove tudo exceto números
    const numbersOnly = value.replace(/\D/g, "");

    if (numbersOnly === "") {
      setValue("valorTotalContrato", "");
      setValorTotalFormatado("");
      setValorTotalRaw("");
    } else {
      // Formata como calculadora
      const formattedValue = formatCalculatorValue(numbersOnly);
      setValue("valorTotalContrato", numbersOnly);
      setValorTotalFormatado(formattedValue);
      setValorTotalRaw(numbersOnly);
    }
  };

  const handleQuantidadeParcelasChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // BLOQUEIO TOTAL: Se for pagamento à vista, NÃO PERMITE NENHUMA MUDANÇA
    if (tipoPagamento === TipoPagamento.AVista) {
      console.log(
        "🔒 Tentativa de alterar parcelas bloqueada (pagamento à vista)"
      );
      event.preventDefault();
      event.stopPropagation();
      setValue("quantidadeParcelas", "1");
      toast.success("Pagamento à vista sempre tem 1 parcela");
      return;
    }

    const value = event.target.value;
    const numericValue = parseInt(value);

    // Para pagamento parcelado, mínimo 2 parcelas
    if (
      value === "" ||
      isNaN(numericValue) ||
      numericValue < 2 ||
      numericValue > 60
    ) {
      setValue("quantidadeParcelas", "");
    } else {
      setValue("quantidadeParcelas", value);
    }
  };

  // Função para obter classes CSS para campos modificados
  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const isModified = modifiedFields.has(fieldName);
    return `${baseClassName} ${
      isModified
        ? "border-orange-500 bg-orange-50 ring-orange-500 focus:border-orange-500 focus:ring-orange-500"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    }`;
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Indicador simplificado */}
      {contractId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Modo Edição</h3>
              <p className="text-sm text-blue-700">
                Editando contrato existente. Apenas campos alterados serão
                atualizados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contrato Text Area */}
      <div className="space-y-2">
        <label
          htmlFor="contrato"
          className="block text-sm font-medium text-gray-700"
        >
          Contrato <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("contrato")}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Digite o título do contrato"
        />
        {errors.contrato && (
          <p className="text-sm text-red-600">{errors.contrato.message}</p>
        )}
      </div>

      {/* Contratante and Contratada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="contratante"
            className="block text-sm font-medium text-gray-700"
          >
            Contratante <span className="text-red-500">*</span>
          </label>
          <input
            {...register("contratante")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome ou empresa contratante"
          />
          {errors.contratante && (
            <p className="text-sm text-red-600">{errors.contratante.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="contratada"
            className="block text-sm font-medium text-gray-700"
          >
            Contratada <span className="text-red-500">*</span>
          </label>
          <input
            {...register("contratada")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome ou empresa contratada"
          />
          {errors.contratada && (
            <p className="text-sm text-red-600">{errors.contratada.message}</p>
          )}
        </div>
      </div>

      {/* Objeto */}
      <div className="space-y-2">
        <label
          htmlFor="objeto"
          className="block text-sm font-medium text-gray-700"
        >
          Objeto do Contrato <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register("objeto")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Descreva detalhadamente o objeto do contrato..."
        />
        {errors.objeto && (
          <p className="text-sm text-red-600">{errors.objeto.message}</p>
        )}
      </div>

      {/* Data and Prazo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="dataContrato"
            className="block text-sm font-medium text-gray-700"
          >
            Data do Contrato <span className="text-red-500">*</span>
          </label>
          <input
            {...register("dataContrato")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.dataContrato && (
            <p className="text-sm text-red-600">
              {errors.dataContrato.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="prazo"
            className="block text-sm font-medium text-gray-700"
          >
            Prazo (em dias) <span className="text-red-500">*</span>
          </label>
          <input
            {...register("prazo")}
            type="number"
            min="1"
            max="36500"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 365"
          />
          {errors.prazo && (
            <p className="text-sm text-red-600">{errors.prazo.message}</p>
          )}
        </div>
      </div>

      {/* Filial, Category and Sector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="filial"
            className="block text-sm font-medium text-gray-700"
          >
            Filial <span className="text-red-500">*</span>
          </label>
          <select
            {...register("filial", { setValueAs: (v) => Number(v) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={Filial.RioDeJaneiro}>🏢 Rio de Janeiro</option>
            <option value={Filial.Campinas}>🏢 Campinas</option>
            <option value={Filial.Brasilia}>🏢 Brasília</option>
            <option value={Filial.Curitiba}>🏢 Curitiba</option>
            <option value={Filial.SaoPaulo}>🏢 São Paulo</option>
            <option value={Filial.Joinville}>🏢 Joinville</option>
            <option value={Filial.BeloHorizonte}>🏢 Belo Horizonte</option>
            <option value={Filial.Salvador}>🏢 Salvador</option>
            <option value={Filial.Vitoria}>🏢 Vitória</option>
            <option value={Filial.Recife}>🏢 Recife</option>
            <option value={Filial.Manaus}>🏢 Manaus</option>
            <option value={Filial.ZonaDaMataMineira}>
              🏢 Zona da Mata Mineira
            </option>
            <option value={Filial.RibeiraoPreto}>🏢 Ribeirão Preto</option>
            <option value={Filial.NovaIorque}>🏢 Nova Iorque</option>
            <option value={Filial.Orlando}>🏢 Orlando</option>
          </select>
          {errors.filial && (
            <p className="text-sm text-red-600">{errors.filial.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="categoriaContrato"
            className="block text-sm font-medium text-gray-700"
          >
            Categoria do Contrato <span className="text-red-500">*</span>
          </label>
          <input
            {...register("categoriaContrato")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Software, Consultoria, Manutenção"
          />
          {errors.categoriaContrato && (
            <p className="text-sm text-red-600">
              {errors.categoriaContrato.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="setorResponsavel"
            className="block text-sm font-medium text-gray-700"
          >
            Setor Responsável <span className="text-red-500">*</span>
          </label>
          <input
            {...register("setorResponsavel")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: TI, RH, Financeiro"
          />
          {errors.setorResponsavel && (
            <p className="text-sm text-red-600">
              {errors.setorResponsavel.message}
            </p>
          )}
        </div>
      </div>

      {/* Regras de Pagamento */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Regras de Pagamento:</p>
            <ul className="text-xs space-y-1">
              <li>
                • <strong>Pagamento à Vista:</strong> Apenas 1 parcela
              </li>
              <li>
                • <strong>Pagamento Parcelado:</strong> TED, Transferência,
                Boleto ou Cartão de Crédito
              </li>
              <li>
                • <strong>PIX:</strong> Força pagamento à vista automaticamente
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="valorTotalContrato"
            className="block text-sm font-medium text-gray-700"
          >
            Valor Total do Contrato (R$) <span className="text-red-500">*</span>
          </label>
          <input
            value={valorTotalFormatado}
            onChange={handleValorTotalChange}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite o valor (ex: 5000000 = R$ 50.000,00)"
          />
          {errors.valorTotalContrato && (
            <p className="text-sm text-red-600">
              {errors.valorTotalContrato.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Digite apenas números: 5000000 = R$ 50.000,00 | 123456 = R$
            1.234,56
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tipoPagamento"
            className="block text-sm font-medium text-gray-700"
          >
            Tipo de Pagamento <span className="text-red-500">*</span>
          </label>
          <select
            {...register("tipoPagamento", { setValueAs: (v) => Number(v) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={TipoPagamento.AVista}>💰 À Vista</option>
            <option value={TipoPagamento.Parcelado}>📅 Parcelado</option>
          </select>
          {errors.tipoPagamento && (
            <p className="text-sm text-red-600">
              {errors.tipoPagamento.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            💡 Selecionar PIX automaticamente define o tipo como "À Vista"
          </p>
        </div>

        <div key={`parcelas-${tipoPagamento}`} className="space-y-2">
          <label
            htmlFor="quantidadeParcelas"
            className={`block text-sm font-medium ${
              tipoPagamento === TipoPagamento.AVista
                ? "text-gray-400"
                : "text-gray-700"
            }`}
          >
            Quantidade de Parcelas
            {tipoPagamento === TipoPagamento.AVista && (
              <span className="text-xs text-gray-500 ml-2">
                (automático para pagamento à vista)
              </span>
            )}
          </label>
          {tipoPagamento === TipoPagamento.AVista ? (
            <>
              <input
                type="hidden"
                {...register("quantidadeParcelas")}
                value="1"
                readOnly
              />
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 select-none">
                1
              </div>
            </>
          ) : (
            <input
              {...register("quantidadeParcelas")}
              value={quantidadeParcelas || ""}
              onChange={handleQuantidadeParcelasChange}
              type="number"
              min="2"
              max="60"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="Ex: 12"
            />
          )}
          {errors.quantidadeParcelas && (
            <p className="text-sm text-red-600">
              {errors.quantidadeParcelas.message}
            </p>
          )}
          {tipoPagamento === TipoPagamento.AVista && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Pagamento à vista: sempre 1 parcela
            </p>
          )}
          {tipoPagamento === TipoPagamento.Parcelado && (
            <p className="text-xs text-green-600 mt-1">
              💡 Pagamento parcelado: mínimo 2 parcelas
            </p>
          )}
        </div>
      </div>

      {/* Valor por Parcela (calculado automaticamente) */}
      {valorPorParcela && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              💰 Valor por Parcela (calculado automaticamente):
            </span>
            <span className="text-lg font-bold text-blue-900">
              {valorPorParcela}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {tipoPagamento === TipoPagamento.AVista ? (
              <>
                Valor total de{" "}
                {formatCurrency(parseRawCents(valorTotal || "0"))} em 1 parcela
              </>
            ) : (
              <>
                Baseado no valor total de{" "}
                {formatCurrency(parseRawCents(valorTotal || "0"))} dividido por{" "}
                {quantidadeParcelas} parcelas
              </>
            )}
          </p>
        </div>
      )}

      {/* Payment Method and Final Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="formaPagamento"
            className="block text-sm font-medium text-gray-700"
          >
            Forma de Pagamento <span className="text-red-500">*</span>
          </label>
          <select
            {...register("formaPagamento", { setValueAs: (v) => Number(v) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option
              value={FormaPagamento.Pix}
              disabled={tipoPagamento === TipoPagamento.Parcelado}
            >
              📱 PIX{" "}
              {tipoPagamento === TipoPagamento.Parcelado
                ? "(não disponível para parcelado)"
                : ""}
            </option>
            <option value={FormaPagamento.TED}>🏦 TED</option>
            <option value={FormaPagamento.Transferencia}>
              💳 Transferência
            </option>
            <option value={FormaPagamento.Boleto}>📄 Boleto</option>
            <option value={FormaPagamento.CartaoCredito}>
              💳 Cartão de Crédito
            </option>
          </select>
          {errors.formaPagamento && (
            <p className="text-sm text-red-600">
              {errors.formaPagamento.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="dataFinal"
            className="block text-sm font-medium text-gray-700"
          >
            Data Final <span className="text-red-500">*</span>
          </label>
          <input
            {...register("dataFinal")}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.dataFinal && (
            <p className="text-sm text-red-600">{errors.dataFinal.message}</p>
          )}
        </div>
      </div>

      {/* Em caso de Rescisão: Multa e Aviso Prévio (quadro amarelo) */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <div className="font-medium text-yellow-800 mb-2">
          Em caso de Rescisão:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="multa"
              className="block text-sm font-medium text-gray-700"
            >
              Multa (R$)
            </label>
            <input
              {...register("multa")}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 1500.00"
            />
            {errors.multa && (
              <p className="text-sm text-red-600">{errors.multa.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="avisoPrevia"
              className="block text-sm font-medium text-gray-700"
            >
              Aviso Prévio (em dias)
            </label>
            <select
              {...register("avisoPrevia")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue=""
            >
              <option value="">Selecione</option>
              <option value="30">30</option>
              <option value="60">60</option>
              <option value="90">90</option>
              <option value="120">120</option>
            </select>
            {errors.avisoPrevia && (
              <p className="text-sm text-red-600">
                {errors.avisoPrevia.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label
          htmlFor="observacoes"
          className="block text-sm font-medium text-gray-700"
        >
          Observações
        </label>
        <textarea
          {...register("observacoes")}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Observações adicionais..."
        />
        {errors.observacoes && (
          <p className="text-sm text-red-600">{errors.observacoes.message}</p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Anexar PDF do Contrato
        </label>
        <div className="flex items-center space-x-4">
          <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <FileUp className="w-5 h-5 mr-2" />
            <span>Selecionar arquivo</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {selectedFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Selecione um arquivo PDF com o contrato digitalizado (máximo 10MB)
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {contractId ? "Atualizar" : "Criar"} Contrato
        </Button>
      </div>
    </form>
  );
}
