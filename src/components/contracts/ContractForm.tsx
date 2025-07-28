import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { contractsApi } from "@/lib/api/contracts";
import { ContractCategory, ContractCreateDto } from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { FileUp, Save, X } from "lucide-react";
import { SubmitHandler } from "react-hook-form";

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
  filial: z.string().min(1, "Filial é obrigatória").max(200),
  categoriaContrato: z.nativeEnum(ContractCategory),
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
  filial: string;
  categoriaContrato: ContractCategory;
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      prazo: "30",
      dataContrato: new Date().toISOString().split("T")[0],
      categoriaContrato: ContractCategory.Outros,
      ...initialData,
    },
  });

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
    if (!data.filial?.trim()) {
      toast.error("Filial é obrigatória");
      return;
    }
    if (!data.categoriaContrato) {
      toast.error("Categoria do contrato é obrigatória");
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
      filial: data.filial.trim(),
      categoriaContrato: String(data.categoriaContrato) as any, // Convert enum to string explicitly
      arquivoPdf: selectedFile || undefined, // Garante que o arquivo vá para o backend
    };

    console.log("🔍 Submit data after processing:", submitData);
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
    console.log(
      `  - Filial: "${submitData.filial}" (${submitData.filial.length} chars)`
    );
    console.log(`  - CategoriaContrato: "${submitData.categoriaContrato}"`);
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

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          placeholder="Digite o texto completo do contrato..."
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

      {/* Financial Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="rescisao"
            className="block text-sm font-medium text-gray-700"
          >
            Rescisão (em dias)
          </label>
          <input
            {...register("rescisao")}
            type="number"
            min="0"
            max="3650"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 30"
          />
          {errors.rescisao && (
            <p className="text-sm text-red-600">{errors.rescisao.message}</p>
          )}
        </div>

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
          <input
            {...register("avisoPrevia")}
            type="number"
            min="0"
            max="365"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: 30"
          />
          {errors.avisoPrevia && (
            <p className="text-sm text-red-600">{errors.avisoPrevia.message}</p>
          )}
        </div>
      </div>

      {/* Filial and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="filial"
            className="block text-sm font-medium text-gray-700"
          >
            Filial <span className="text-red-500">*</span>
          </label>
          <input
            {...register("filial")}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nome da filial responsável"
          />
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
          <select
            {...register("categoriaContrato")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={ContractCategory.Software}>💻 Software</option>
            <option value={ContractCategory.Aluguel}>🏢 Aluguel</option>
            <option value={ContractCategory.TI}>⚙️ TI</option>
            <option value={ContractCategory.Outros}>📁 Outros</option>
          </select>
          {errors.categoriaContrato && (
            <p className="text-sm text-red-600">
              {errors.categoriaContrato.message}
            </p>
          )}
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
          onClick={() => {
            const testData = {
              contrato: "Teste de contrato",
              contratante: "Teste contratante",
              contratada: "Teste contratada",
              objeto: "Teste objeto",
              dataContrato: "2024-01-01",
              prazo: 30,
              filial: "Teste filial",
              categoriaContrato: ContractCategory.Outros,
            };
            console.log("🧪 Test data:", testData);
            createMutation.mutate(testData);
          }}
          disabled={isLoading}
        >
          Teste
        </Button>
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
