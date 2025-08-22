import { useForm, Controller } from "react-hook-form";
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
import {
  FileUp,
  Save,
  X,
  FileText,
  Building,
  Users,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Info,
  Edit,
  MapPin,
  Hash,
  Briefcase,
  Target,
  FileCheck,
  Banknote,
  AlertTriangle,
} from "lucide-react";
import { SubmitHandler } from "react-hook-form";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Modern 2025 animation variants for form fields
const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
};

// Modern field component with glassmorphism
const ModernField = ({
  label,
  icon: Icon,
  required = false,
  error,
  children,
  description,
}: {
  label: string;
  icon: any;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  description?: string;
}) => (
  <motion.div variants={fieldVariants} className="space-y-3">
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-br from-navy-100 to-navy-200 rounded-lg flex items-center justify-center">
        <Icon className="w-4 h-4 text-navy-700" />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-bold text-navy-900 uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-navy-600 mt-1">{description}</p>
        )}
      </div>
    </div>

    <div className="relative">
      {children}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 mt-2 p-2 bg-red-50 rounded-lg border border-red-200/50"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </motion.div>
      )}
    </div>
  </motion.div>
);

// Modern input component
const ModernInput = ({ className = "", ...props }: any) => (
  <input
    {...props}
    className={cn(
      "w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-navy-200/50 rounded-xl",
      "text-navy-900 placeholder-navy-400 font-medium",
      "focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500",
      "transition-all duration-200 hover:bg-white/90",
      "shadow-sm hover:shadow-md focus:shadow-lg",
      className
    )}
  />
);

// Modern textarea component
const ModernTextarea = ({ className = "", ...props }: any) => (
  <textarea
    {...props}
    className={cn(
      "w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-navy-200/50 rounded-xl",
      "text-navy-900 placeholder-navy-400 font-medium resize-none",
      "focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500",
      "transition-all duration-200 hover:bg-white/90",
      "shadow-sm hover:shadow-md focus:shadow-lg",
      className
    )}
  />
);

// Modern select component
const ModernSelect = ({ className = "", ...props }: any) => (
  <select
    {...props}
    className={cn(
      "w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-navy-200/50 rounded-xl",
      "text-navy-900 font-medium cursor-pointer",
      "focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500",
      "transition-all duration-200 hover:bg-white/90",
      "shadow-sm hover:shadow-md focus:shadow-lg",
      className
    )}
  />
);

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

const parseCurrency = (value: string): number =>
  parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;

const parseRawCents = (value: string): number => {
  const cleanValue = value.replace(/[^\d]/g, "");
  return parseInt(cleanValue, 10) || 0;
};

const formatCentsAsDecimal = (cents: number): string => {
  return (cents / 100).toFixed(2).replace(".", ",");
};

const formatCentsAsCurrency = (cents: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

// Schema de validação
const contractSchema = z.object({
  contrato: z
    .string()
    .min(2, "O contrato deve ter pelo menos 2 caracteres")
    .max(1000, "O contrato deve ter no máximo 1000 caracteres"),
  contratante: z
    .string()
    .min(2, "O nome do contratante deve ter pelo menos 2 caracteres")
    .max(200, "O nome do contratante deve ter no máximo 200 caracteres"),
  contratada: z
    .string()
    .min(2, "O nome da contratada deve ter pelo menos 2 caracteres")
    .max(200, "O nome da contratada deve ter no máximo 200 caracteres"),
  objeto: z
    .string()
    .min(2, "O objeto deve ter pelo menos 2 caracteres")
    .max(1000, "O objeto deve ter no máximo 1000 caracteres"),
  dataContrato: z.string().min(1, "Data do contrato é obrigatória"),
  prazo: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "O prazo deve ser um número positivo",
  }),
  rescisao: z.string().optional(),
  multa: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Campo opcional
        const numValue = parseCurrency(val);
        return numValue >= 0;
      },
      {
        message: "O valor da multa deve ser positivo",
      }
    ),
  avisoPrevia: z.string().optional(),
  observacoes: z.string().optional(),
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
    .min(2, "A categoria deve ter pelo menos 2 caracteres")
    .max(100, "A categoria deve ter no máximo 100 caracteres"),
  setorResponsavel: z
    .string()
    .min(2, "O setor responsável deve ter pelo menos 2 caracteres")
    .max(100, "O setor responsável deve ter no máximo 100 caracteres"),
  valorTotalContrato: z.string().refine(
    (val) => {
      const numValue = parseRawCents(val);
      return numValue > 0;
    },
    {
      message: "O valor total deve ser maior que zero",
    }
  ),
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
  const [multaFormatada, setMultaFormatada] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] =
    useState<boolean>(!!contractId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
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

  // Watch form values
  const valorTotal = watch("valorTotalContrato");
  const quantidadeParcelas = watch("quantidadeParcelas");
  const tipoPagamento = watch("tipoPagamento");
  const formaPagamento = watch("formaPagamento");
  const filialWatch = watch("filial");

  // Sanitize select numeric values to avoid NaN in value attribute
  const safeSelectNumber = useCallback((val: any, fallback: number): number => {
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val !== "") {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  }, []);

  // Helper to coerce values that may arrive as string names (e.g., "AVista") or numeric strings
  const coerceEnumValue = useCallback(
    (value: any, enumObj: any, fallback: number): number => {
      if (typeof value === "number" && !isNaN(value)) return value;
      if (typeof value === "string") {
        const numeric = Number(value);
        if (!isNaN(numeric)) return numeric;
        const mapped = (enumObj as any)[value as keyof typeof enumObj];
        if (typeof mapped === "number") return mapped as number;
      }
      return fallback;
    },
    []
  );

  // Ensure selects are populated correctly in edit mode even if API returns enum names
  useEffect(() => {
    if (initialData && contractId) {
      const coercedFilial = coerceEnumValue(
        (initialData as any).filial,
        Filial,
        Filial.RioDeJaneiro
      );
      const coercedTipo = coerceEnumValue(
        (initialData as any).tipoPagamento,
        TipoPagamento,
        TipoPagamento.AVista
      );
      const coercedForma = coerceEnumValue(
        (initialData as any).formaPagamento,
        FormaPagamento,
        FormaPagamento.Pix
      );

      setValue("filial", coercedFilial as any);
      setValue("tipoPagamento", coercedTipo as any);
      setValue("formaPagamento", coercedForma as any);
    }
  }, [initialData, contractId, setValue, coerceEnumValue]);

  // Load initial data when available (for edit mode)
  useEffect(() => {
    if (initialData && contractId) {
      console.log("🔄 Loading initial data for edit:", initialData);

      // Reset form with initial data
      reset({
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
      });

      // Set the valor total formatted states
      if (initialData.valorTotalContrato) {
        const rawValue = initialData.valorTotalContrato;
        setValorTotalRaw(rawValue);
        const formattedValue = formatCentsAsCurrency(parseInt(rawValue, 10));
        setValorTotalFormatado(formattedValue);
      }

      // Set the multa formatted state
      if (initialData.multa) {
        const multaValue =
          typeof initialData.multa === "string"
            ? parseFloat(initialData.multa)
            : initialData.multa;
        const formattedMulta = formatCurrency(multaValue);
        setMultaFormatada(formattedMulta);
      }

      setIsInitialLoading(false);
    }
  }, [initialData, contractId, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ContractCreateDto) => contractsApi.create(data),
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      router.push("/contracts");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao criar contrato");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContractCreateDto }) =>
      contractsApi.update(id, data),
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      router.push("/contracts");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Erro ao atualizar contrato"
      );
    },
  });

  // Handle file change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Arquivo muito grande. Máximo 10MB.");
          return;
        }
        if (file.type !== "application/pdf") {
          toast.error("Apenas arquivos PDF são aceitos.");
          return;
        }
        setSelectedFile(file);
      }
    },
    []
  );

  // Handle valor total change
  const handleValorTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d]/g, "");
      setValorTotalRaw(rawValue);

      if (rawValue) {
        const formattedValue = formatCentsAsCurrency(parseInt(rawValue, 10));
        setValorTotalFormatado(formattedValue);
        setValue("valorTotalContrato", rawValue);
      } else {
        setValorTotalFormatado("");
        setValue("valorTotalContrato", "");
      }
    },
    [setValue]
  );

  // Handle quantidade parcelas change
  const handleQuantidadeParcelasChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValue("quantidadeParcelas", value);
    },
    [setValue]
  );

  // Handle multa change
  const handleMultaChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d]/g, "");

      if (rawValue) {
        const formattedValue = formatCentsAsCurrency(parseInt(rawValue, 10));
        setMultaFormatada(formattedValue);
        setValue("multa", formattedValue);
      } else {
        setMultaFormatada("");
        setValue("multa", "");
      }
    },
    [setValue]
  );

  // Calculate valor por parcela
  useEffect(() => {
    if (valorTotal && quantidadeParcelas) {
      const valorCents = parseRawCents(valorTotal);
      const parcelas = parseInt(quantidadeParcelas, 10);

      if (valorCents > 0 && parcelas > 0) {
        const valorPorParcelaCalculado = Math.round(valorCents / parcelas);
        setValorPorParcela(formatCentsAsCurrency(valorPorParcelaCalculado));
      }
    } else {
      setValorPorParcela("");
    }
  }, [valorTotal, quantidadeParcelas]);

  // Auto-set parcelas based on payment type (only for new contracts)
  useEffect(() => {
    if (!contractId && tipoPagamento === TipoPagamento.AVista) {
      setValue("quantidadeParcelas", "1");
    }
  }, [tipoPagamento, setValue, contractId]);

  // Auto-set payment type when PIX is selected (only for new contracts)
  useEffect(() => {
    if (!contractId && formaPagamento === FormaPagamento.Pix) {
      setValue("tipoPagamento", TipoPagamento.AVista);
      setValue("quantidadeParcelas", "1");
    }
  }, [formaPagamento, setValue, contractId]);

  // Submit handler
  const onSubmit: SubmitHandler<ContractFormData> = async (data) => {
    try {
      console.log("🔍 Form data before processing:", data);
      console.log("🔍 valorTotalContrato raw:", data.valorTotalContrato);
      console.log(
        "🔍 parseRawCents result:",
        parseRawCents(data.valorTotalContrato)
      );
      console.log(
        "🔍 Final value to send:",
        parseRawCents(data.valorTotalContrato) / 100
      );
      const submitData: ContractCreateDto = {
        contrato: data.contrato,
        contratante: data.contratante,
        contratada: data.contratada,
        objeto: data.objeto,
        dataContrato: data.dataContrato,
        prazo: parseInt(data.prazo, 10),
        rescisao: data.rescisao ? parseInt(data.rescisao, 10) : undefined,
        multa: data.multa ? parseCurrency(data.multa) : undefined,
        avisoPrevia: data.avisoPrevia
          ? parseInt(data.avisoPrevia, 10)
          : undefined,
        observacoes: data.observacoes || undefined,
        filial:
          typeof data.filial === "number" ? data.filial : Number(data.filial),
        categoriaContrato: data.categoriaContrato,
        setorResponsavel: data.setorResponsavel,
        valorTotalContrato: parseRawCents(data.valorTotalContrato) / 100, // Convert cents back to decimal
        tipoPagamento:
          typeof data.tipoPagamento === "number"
            ? data.tipoPagamento
            : Number(data.tipoPagamento),
        quantidadeParcelas: data.quantidadeParcelas
          ? parseInt(data.quantidadeParcelas, 10)
          : 1,
        formaPagamento:
          typeof data.formaPagamento === "number"
            ? data.formaPagamento
            : Number(data.formaPagamento),
        dataFinal: data.dataFinal,
        arquivoPdf: selectedFile || undefined,
      };

      if (contractId) {
        await updateMutation.mutateAsync({ id: contractId, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      console.error("Erro no submit:", error);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Edit Mode Indicator */}
      {contractId && (
        <motion.div
          variants={fieldVariants}
          className="glass-morphism rounded-2xl p-6 border border-blue-200/50 bg-blue-50/30 shadow-lg"
        >
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                🔄 Modo de Edição Ativo
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Você está editando um contrato existente. Apenas os campos que
                você modificar serão atualizados no sistema. Os dados originais
                são preservados automaticamente.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 1: Contract Information */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-700 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Informações do Contrato
            </h3>
            <p className="text-sm text-navy-600">
              Dados básicos e identificação do acordo
            </p>
          </div>
        </div>

        <ModernField
          label="Título do Contrato"
          icon={FileText}
          required
          error={errors.contrato?.message}
          description="Descreva brevemente o contrato ou acordo"
        >
          <ModernTextarea
            {...register("contrato")}
            rows={4}
            placeholder="Ex: Contrato de Prestação de Serviços de Consultoria Tributária..."
          />
        </ModernField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernField
            label="Contratante"
            icon={Building}
            required
            error={errors.contratante?.message}
            description="Empresa ou pessoa que está contratando"
          >
            <ModernInput
              {...register("contratante")}
              type="text"
              placeholder="Ex: Empresa ABC Ltda."
            />
          </ModernField>

          <ModernField
            label="Contratada"
            icon={Users}
            required
            error={errors.contratada?.message}
            description="Empresa ou pessoa que será contratada"
          >
            <ModernInput
              {...register("contratada")}
              type="text"
              placeholder="Ex: Consultoria XYZ S.A."
            />
          </ModernField>
        </div>

        <ModernField
          label="Objeto do Contrato"
          icon={Target}
          required
          error={errors.objeto?.message}
          description="Descrição detalhada do que será executado"
        >
          <ModernTextarea
            {...register("objeto")}
            rows={3}
            placeholder="Descreva detalhadamente os serviços, produtos ou atividades que serão realizadas no âmbito deste contrato..."
          />
        </ModernField>
      </motion.div>

      {/* Section 2: Dates and Terms */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">Datas e Prazos</h3>
            <p className="text-sm text-navy-600">
              Definição de vigência e cronograma
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModernField
            label="Data do Contrato"
            icon={Calendar}
            required
            error={errors.dataContrato?.message}
            description="Data de assinatura do contrato"
          >
            <ModernInput {...register("dataContrato")} type="date" />
          </ModernField>

          <ModernField
            label="Prazo"
            icon={Clock}
            required
            error={errors.prazo?.message}
            description="Duração em dias úteis"
          >
            <ModernInput
              {...register("prazo")}
              type="number"
              min="1"
              max="36500"
              placeholder="Ex: 365 dias"
            />
          </ModernField>

          <ModernField
            label="Data Final"
            icon={Calendar}
            required
            error={errors.dataFinal?.message}
            description="Data de término do contrato"
          >
            <ModernInput {...register("dataFinal")} type="date" />
          </ModernField>
        </div>
      </motion.div>

      {/* Section 3: Organization */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Organização e Classificação
            </h3>
            <p className="text-sm text-navy-600">
              Categorização e responsabilidades
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ModernField
            label="Filial"
            icon={MapPin}
            required
            error={errors.filial?.message}
            description="Unidade responsável"
          >
            <Controller
              control={control}
              name="filial"
              render={({ field }) => (
                <ModernSelect
                  value={
                    safeSelectNumber(field.value, Filial.RioDeJaneiro) as any
                  }
                  onChange={(e: any) => field.onChange(Number(e.target.value))}
                >
                  <option value={Filial.RioDeJaneiro}>🏢 Rio de Janeiro</option>
                  <option value={Filial.Campinas}>🏢 Campinas</option>
                  <option value={Filial.Brasilia}>🏢 Brasília</option>
                  <option value={Filial.Curitiba}>🏢 Curitiba</option>
                  <option value={Filial.SaoPaulo}>🏢 São Paulo</option>
                  <option value={Filial.Joinville}>🏢 Joinville</option>
                  <option value={Filial.BeloHorizonte}>
                    🏢 Belo Horizonte
                  </option>
                  <option value={Filial.Salvador}>🏢 Salvador</option>
                  <option value={Filial.Vitoria}>🏢 Vitória</option>
                  <option value={Filial.Recife}>🏢 Recife</option>
                  <option value={Filial.Manaus}>🏢 Manaus</option>
                  <option value={Filial.ZonaDaMataMineira}>
                    🏢 Zona da Mata Mineira
                  </option>
                  <option value={Filial.RibeiraoPreto}>
                    🏢 Ribeirão Preto
                  </option>
                  <option value={Filial.NovaIorque}>🏢 Nova Iorque</option>
                  <option value={Filial.Orlando}>🏢 Orlando</option>
                </ModernSelect>
              )}
            />
          </ModernField>

          <ModernField
            label="Categoria"
            icon={Hash}
            required
            error={errors.categoriaContrato?.message}
            description="Tipo de contrato"
          >
            <ModernInput
              {...register("categoriaContrato")}
              type="text"
              placeholder="Ex: Software, Consultoria, Manutenção"
            />
          </ModernField>

          <ModernField
            label="Setor Responsável"
            icon={Users}
            required
            error={errors.setorResponsavel?.message}
            description="Departamento gestor"
          >
            <ModernInput
              {...register("setorResponsavel")}
              type="text"
              placeholder="Ex: TI, RH, Financeiro, Jurídico"
            />
          </ModernField>
        </div>
      </motion.div>

      {/* Section 4: Financial Information */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Informações Financeiras
            </h3>
            <p className="text-sm text-navy-600">
              Valores, pagamento e condições fiscais
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernField
            label="Valor Total"
            icon={Banknote}
            required
            error={errors.valorTotalContrato?.message}
            description="Valor total do contrato em reais"
          >
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-600 font-bold">
                R$
              </div>
              <ModernInput
                value={valorTotalFormatado}
                onChange={handleValorTotalChange}
                type="text"
                className="pl-10"
                placeholder="50.000,00"
              />
            </div>
          </ModernField>

          <ModernField
            label="Tipo de Pagamento"
            icon={CreditCard}
            required
            error={errors.tipoPagamento?.message}
            description="Modalidade de pagamento"
          >
            <Controller
              control={control}
              name="tipoPagamento"
              render={({ field }) => (
                <ModernSelect
                  value={
                    safeSelectNumber(field.value, TipoPagamento.AVista) as any
                  }
                  onChange={(e: any) => field.onChange(Number(e.target.value))}
                >
                  <option value={TipoPagamento.AVista}>💰 À Vista</option>
                  <option value={TipoPagamento.Parcelado}>📅 Parcelado</option>
                </ModernSelect>
              )}
            />
          </ModernField>
        </div>

        {tipoPagamento === TipoPagamento.Parcelado && (
          <ModernField
            label="Quantidade de Parcelas"
            icon={Hash}
            error={errors.quantidadeParcelas?.message}
            description="Número de parcelas (2-60)"
          >
            <ModernInput
              {...register("quantidadeParcelas")}
              value={quantidadeParcelas || ""}
              onChange={handleQuantidadeParcelasChange}
              type="number"
              min="2"
              max="60"
              placeholder="Ex: 12 parcelas"
            />
          </ModernField>
        )}

        <ModernField
          label="Forma de Pagamento"
          icon={CreditCard}
          required
          error={errors.formaPagamento?.message}
          description="Método de pagamento preferido"
        >
          <Controller
            control={control}
            name="formaPagamento"
            render={({ field }) => (
              <ModernSelect
                value={safeSelectNumber(field.value, FormaPagamento.Pix) as any}
                onChange={(e: any) => field.onChange(Number(e.target.value))}
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
              </ModernSelect>
            )}
          />
        </ModernField>

        {/* Calculated Value Display */}
        {valorPorParcela && (
          <motion.div
            variants={fieldVariants}
            className="glass-morphism rounded-2xl p-6 border border-emerald-200/50 bg-emerald-50/30 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-900">
                    Valor por Parcela
                  </h4>
                  <p className="text-sm text-emerald-700">
                    Calculado automaticamente
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-800">
                  {valorPorParcela}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Section 5: Rescission Terms */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Em caso de rescisão
            </h3>
            <p className="text-sm text-navy-600">
              Condições para término antecipado do contrato
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ModernField
            label="Aviso Prévio"
            icon={Clock}
            error={errors.avisoPrevia?.message}
            description="Prazo de comunicação para rescisão"
          >
            <Controller
              control={control}
              name="avisoPrevia"
              render={({ field }) => (
                <ModernSelect
                  value={field.value || ""}
                  onChange={(e: any) => field.onChange(e.target.value)}
                >
                  <option value="">Selecione o prazo</option>
                  <option value="30">⏰ 30 dias</option>
                  <option value="60">⏰ 60 dias</option>
                  <option value="90">⏰ 90 dias</option>
                  <option value="120">⏰ 120 dias</option>
                </ModernSelect>
              )}
            />
          </ModernField>

          <ModernField
            label="Multa"
            icon={DollarSign}
            error={errors.multa?.message}
            description="Valor da multa por rescisão antecipada"
          >
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-600 font-bold">
                R$
              </div>
              <ModernInput
                value={multaFormatada}
                onChange={handleMultaChange}
                type="text"
                className="pl-10"
                placeholder="5.000,00"
              />
            </div>
          </ModernField>
        </div>
      </motion.div>

      {/* Section 6: Additional Information */}
      <motion.div variants={sectionVariants} className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-900">
              Informações Adicionais
            </h3>
            <p className="text-sm text-navy-600">Observações e documentação</p>
          </div>
        </div>

        <ModernField
          label="Observações"
          icon={Edit}
          error={errors.observacoes?.message}
          description="Informações complementares, cláusulas especiais ou observações gerais"
        >
          <ModernTextarea
            {...register("observacoes")}
            rows={4}
            placeholder="Digite aqui observações adicionais, cláusulas especiais, condições particulares ou qualquer informação relevante sobre o contrato..."
          />
        </ModernField>

        {/* File Upload Section */}
        <ModernField
          label="Anexar PDF do Contrato"
          icon={FileUp}
          description="Upload do documento digitalizado (opcional)"
        >
          <div className="space-y-4">
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center w-full px-6 py-8 bg-white/70 backdrop-blur-sm border-2 border-dashed border-navy-300/50 rounded-xl cursor-pointer hover:bg-white/90 hover:border-navy-400/50 transition-all duration-200 group"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-navy-200 transition-colors">
                  <FileUp className="w-6 h-6 text-navy-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Clique para selecionar arquivo PDF
                  </p>
                  <p className="text-xs text-navy-600">
                    Ou arraste e solte aqui • Máximo 10MB
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </motion.label>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/50 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </div>
        </ModernField>
      </motion.div>

      {/* Enhanced Action Buttons */}
      <motion.div
        variants={sectionVariants}
        className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-navy-100/50"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/contracts")}
            disabled={isLoading}
            className="w-full sm:w-auto bg-white/60 hover:bg-white/80 border border-navy-200/50 text-navy-700 backdrop-blur-sm"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg border-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {contractId ? "Atualizar Contrato" : "Criar Contrato"}
          </Button>
        </motion.div>
      </motion.div>
    </motion.form>
  );
}
