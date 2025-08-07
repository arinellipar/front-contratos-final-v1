// src/lib/api/contracts.ts
import { apiClient } from "./client";
import {
  Contract,
  ContractCreateDto,
  ContractFilters,
  PaginatedResponse,
} from "@/lib/types/contract";

// Define ContractStatistics interface matching backend response
export interface ContractStatistics {
  totalValue: number;
  totalContracts: number;
  contractsByCategory: Record<string, number>;
  recentContracts: Contract[];
  expiringContracts: Contract[];
}

export interface DashboardContractMetrics extends ContractStatistics {
  activeContracts: number;
  expiredContracts: number;
  pendingContracts: number;
  totalValue: number;
  averageValue: number;
  renewalRate: number;
  complianceScore: number;
  riskScore: number;
}

/**
 * Contract API service implementing all contract-related operations
 * with comprehensive error handling and type safety
 */
export const contractsApi = {
  /**
   * Retrieves paginated list of contracts with advanced filtering
   */
  async getAll(
    filters?: ContractFilters,
    forceRefresh?: boolean
  ): Promise<PaginatedResponse<Contract>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          // Converter enum para string se necessário
          const stringValue =
            typeof value === "number" ? value.toString() : String(value);
          params.append(key, stringValue);
        }
      });
    }

    if (forceRefresh) {
      params.append("forceRefresh", "true");
    }

    try {
      return await apiClient.get<PaginatedResponse<Contract>>(
        `/contracts?${params.toString()}`
      );
    } catch (error: any) {
      console.error("❌ Erro ao buscar contratos:", error);

      const empty: PaginatedResponse<Contract> = {
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: Number(filters?.page ?? 1),
        pageSize: Number(filters?.pageSize ?? 10),
        hasNextPage: false,
        hasPreviousPage: false,
      };

      // 401: retornar lista vazia (app vai redirecionar por conta própria)
      if (error?.response?.status === 401) {
        console.warn("⚠️ Erro 401 detectado - problema de autenticação");
        return empty;
      }

      // 404/500: retornar vazio para não quebrar UI; logs já foram emitidos
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        console.warn("⚠️ Endpoint indisponível ou migrações pendentes");
        return empty;
      }

      // Fallback: não mascarar outros erros desconhecidos
      throw error;
    }
  },

  /**
   * Retrieves a specific contract by ID
   */
  async getById(id: number): Promise<Contract> {
    return apiClient.get<Contract>(`/contracts/${id}`);
  },

  /**
   * Test endpoint to verify model binding
   */
  async testModelBinding(data: ContractCreateDto): Promise<any> {
    const formData = new FormData();

    // Append all fields with proper type conversion
    Object.entries(data).forEach(([key, value]) => {
      if (key !== "arquivoPdf") {
        // Handle required fields (always append, even if empty)
        if (
          [
            "contrato",
            "contratante",
            "contratada",
            "objeto",
            "dataContrato",
            "prazo",
            "filial",
            "categoriaContrato",
          ].includes(key)
        ) {
          if (value !== undefined && value !== null) {
            if (key === "prazo" && typeof value === "number") {
              formData.append(key, value.toString());
            } else if (key === "dataContrato" && typeof value === "string") {
              // Ensure date is in correct format (YYYY-MM-DD)
              const dateValue = value.split("T")[0]; // Remove time part if present
              formData.append(key, dateValue);
            } else if (key === "categoriaContrato") {
              // Ensure enum is converted to string
              const stringValue =
                typeof value === "string" ? value : String(value);
              formData.append(key, stringValue);
            } else if (typeof value === "string") {
              formData.append(key, value);
            } else if (typeof value === "number") {
              formData.append(key, value.toString());
            } else {
              formData.append(key, value.toString());
            }
          } else {
            formData.append(key, "");
          }
        }
        // Handle optional fields (only append if not empty)
        else if (value !== undefined && value !== null && value !== "") {
          if (key === "rescisao" && typeof value === "number") {
            formData.append(key, value.toString());
          } else if (key === "multa" && typeof value === "number") {
            formData.append(key, value.toString());
          } else if (key === "avisoPrevia" && typeof value === "number") {
            formData.append(key, value.toString());
          } else if (typeof value === "string") {
            formData.append(key, value);
          } else if (typeof value === "number") {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value.toString());
          }
        }
      }
    });

    // Append file if exists
    if (data.arquivoPdf) {
      formData.append("arquivoPdf", data.arquivoPdf);
    }

    return apiClient.post<any>("/contracts/test", formData);
  },

  /**
   * Creates a new contract with optional PDF attachment
   */
  async create(data: ContractCreateDto): Promise<Contract> {
    // Sempre usar FormData para garantir compatibilidade com o backend
    const formData = new FormData();

    // Adicionar todos os campos obrigatórios com validação
    if (!data.contrato) {
      throw new Error("Contrato é obrigatório");
    }
    formData.append("contrato", data.contrato);

    if (!data.contratante) {
      throw new Error("Contratante é obrigatório");
    }
    formData.append("contratante", data.contratante);

    if (!data.contratada) {
      throw new Error("Contratada é obrigatória");
    }
    formData.append("contratada", data.contratada);

    if (!data.objeto) {
      throw new Error("Objeto é obrigatório");
    }
    formData.append("objeto", data.objeto);

    if (!data.dataContrato) {
      throw new Error("Data do contrato é obrigatória");
    }
    formData.append("dataContrato", data.dataContrato);

    if (!data.prazo || data.prazo <= 0) {
      throw new Error("Prazo é obrigatório e deve ser maior que zero");
    }
    formData.append("prazo", data.prazo.toString());

    if (!data.filial) {
      throw new Error("Filial é obrigatória");
    }
    formData.append("filial", data.filial.toString());

    if (!data.categoriaContrato) {
      throw new Error("Categoria do contrato é obrigatória");
    }
    formData.append("categoriaContrato", data.categoriaContrato);

    // Adicionar campos opcionais se existirem
    if (data.rescisao !== undefined && data.rescisao !== null) {
      formData.append("rescisao", data.rescisao.toString());
    }
    if (data.multa !== undefined && data.multa !== null) {
      formData.append("multa", data.multa.toString());
    }
    if (data.avisoPrevia !== undefined && data.avisoPrevia !== null) {
      formData.append("avisoPrevia", data.avisoPrevia.toString());
    }
    if (data.observacoes) {
      formData.append("observacoes", data.observacoes);
    }

    // Adicionar novos campos (opcionais para compatibilidade com backend de produção)
    try {
      if (data.setorResponsavel) {
        formData.append("setorResponsavel", data.setorResponsavel);
      }

      if (data.valorTotalContrato && data.valorTotalContrato > 0) {
        formData.append(
          "valorTotalContrato",
          data.valorTotalContrato.toString()
        );
      }

      if (data.tipoPagamento !== undefined && data.tipoPagamento !== null) {
        formData.append("tipoPagamento", data.tipoPagamento.toString());
      }

      if (data.formaPagamento !== undefined && data.formaPagamento !== null) {
        formData.append("formaPagamento", data.formaPagamento.toString());
      }

      if (data.dataFinal) {
        formData.append("dataFinal", data.dataFinal);
      }

      // Adicionar campo opcional de quantidade de parcelas
      if (
        data.quantidadeParcelas !== undefined &&
        data.quantidadeParcelas !== null
      ) {
        formData.append(
          "quantidadeParcelas",
          data.quantidadeParcelas.toString()
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Alguns campos novos podem não estar disponíveis no backend:",
        error
      );
    }

    // Adicionar arquivo PDF se existir
    if (data.arquivoPdf && data.arquivoPdf instanceof File) {
      formData.append("arquivoPdf", data.arquivoPdf);
    }

    return apiClient.post<Contract>("/contracts", formData, {
      headers: {
        /* 'Content-Type' será definido automaticamente pelo browser */
      },
    });
  },

  /**
   * Updates an existing contract
   */
  async update(id: number, data: ContractCreateDto): Promise<Contract> {
    const formData = new FormData();

    // Adicionar todos os campos obrigatórios
    formData.append("contrato", data.contrato || "");
    formData.append("contratante", data.contratante || "");
    formData.append("contratada", data.contratada || "");
    formData.append("objeto", data.objeto || "");
    formData.append("dataContrato", data.dataContrato || "");
    formData.append("prazo", (data.prazo || 0).toString());
    formData.append("filial", (data.filial || "").toString());
    formData.append("categoriaContrato", data.categoriaContrato || "");

    // Adicionar campos opcionais se existirem
    if (data.rescisao !== undefined && data.rescisao !== null) {
      formData.append("rescisao", data.rescisao.toString());
    }
    if (data.multa !== undefined && data.multa !== null) {
      formData.append("multa", data.multa.toString());
    }
    if (data.avisoPrevia !== undefined && data.avisoPrevia !== null) {
      formData.append("avisoPrevia", data.avisoPrevia.toString());
    }
    if (data.observacoes) {
      formData.append("observacoes", data.observacoes);
    }

    // Adicionar novos campos (opcionais para compatibilidade com backend de produção)
    try {
      if (data.setorResponsavel) {
        formData.append("setorResponsavel", data.setorResponsavel);
      }

      if (data.valorTotalContrato && data.valorTotalContrato > 0) {
        formData.append(
          "valorTotalContrato",
          data.valorTotalContrato.toString()
        );
      }

      if (data.tipoPagamento !== undefined && data.tipoPagamento !== null) {
        formData.append("tipoPagamento", data.tipoPagamento.toString());
      }

      if (data.formaPagamento !== undefined && data.formaPagamento !== null) {
        formData.append("formaPagamento", data.formaPagamento.toString());
      }

      if (data.dataFinal) {
        formData.append("dataFinal", data.dataFinal);
      }

      // Adicionar campo opcional de quantidade de parcelas
      if (
        data.quantidadeParcelas !== undefined &&
        data.quantidadeParcelas !== null
      ) {
        formData.append(
          "quantidadeParcelas",
          data.quantidadeParcelas.toString()
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ Alguns campos novos podem não estar disponíveis no backend:",
        error
      );
    }

    // Adicionar arquivo PDF se existir
    if (data.arquivoPdf && data.arquivoPdf instanceof File) {
      formData.append("arquivoPdf", data.arquivoPdf);
    }

    return apiClient.put<Contract>(`/contracts/${id}`, formData);
  },

  /**
   * Deletes a contract
   */
  async delete(id: number): Promise<void> {
    console.log("🔴 contractsApi.delete called with ID:", id);
    const result = await apiClient.delete<void>(`/contracts/${id}`);
    console.log("✅ contractsApi.delete completed successfully");
    return result;
  },

  /**
   * Downloads contract PDF file
   */
  async downloadPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/contracts/${id}/download`, {
      responseType: "blob",
    });
    return response as Blob;
  },

  /**
   * Retrieves contract statistics
   */
  async getStatistics(): Promise<ContractStatistics> {
    try {
      const response = await apiClient.get<ContractStatistics>(
        "/contracts/statistics"
      );
      return response;
    } catch (error: any) {
      console.error("❌ Erro ao buscar statistics:", error);

      // Se for erro 500, pode ser problema de migração no backend
      if (error?.response?.status === 500) {
        console.warn(
          "⚠️ Erro 500 detectado nas statistics - possivelmente migrações não aplicadas no backend"
        );
      }

      // Se for erro 401, pode ser problema de autenticação
      if (error?.response?.status === 401) {
        console.warn(
          "⚠️ Erro 401 detectado nas statistics - problema de autenticação"
        );
      }

      // Return default values when there's an error or no data
      return {
        totalContracts: 0,
        contractsByCategory: {},
        recentContracts: [],
        expiringContracts: [],
        totalValue: 0,
      };
    }
  },

  /**
   * Retrieves enhanced dashboard metrics with calculations
   */
  async getDashboardMetrics(): Promise<DashboardContractMetrics> {
    try {
      const [statistics, allContracts] = await Promise.all([
        this.getStatistics(),
        this.getAll({ pageSize: 1000 }),
      ]);

      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      // Handle empty data gracefully
      const allContractsData = allContracts?.data || [];
      // Filtrar apenas contratos ativos (status 1)
      const contracts = allContractsData.filter(
        (contract: Contract) => contract.status === 1
      );
      const stats = statistics || {
        totalContracts: 0,
        expiringContracts: [],
        contractsByCategory: {},
        recentContracts: [],
        totalValue: 0,
      };

      const activeContracts = contracts.filter((contract: Contract) => {
        const expiryDate = new Date(contract.dataContrato);
        expiryDate.setDate(expiryDate.getDate() + (contract.prazo || 365));
        return expiryDate > now;
      }).length;

      const expiredContracts = contracts.filter((contract: Contract) => {
        const expiryDate = new Date(contract.dataContrato);
        expiryDate.setDate(expiryDate.getDate() + (contract.prazo || 365));
        return expiryDate <= now;
      }).length;

      const pendingContracts = stats.expiringContracts?.length || 0;

      const totalValue = contracts.reduce((sum: number, contract: Contract) => {
        return sum + (parseFloat(contract.multa?.toString() || "0") || 0);
      }, 0);

      const averageValue =
        stats.totalContracts > 0 ? totalValue / stats.totalContracts : 0;
      const renewalRate =
        stats.totalContracts > 0
          ? (activeContracts / stats.totalContracts) * 100
          : 0;
      const complianceScore =
        stats.totalContracts > 0
          ? Math.max(0, 100 - (expiredContracts / stats.totalContracts) * 100)
          : 100;
      const riskScore =
        activeContracts > 0 ? (pendingContracts / activeContracts) * 100 : 0;

      return {
        ...stats,
        totalContracts: contracts.length, // Atualizar para refletir apenas contratos ativos
        activeContracts,
        expiredContracts,
        pendingContracts,
        totalValue,
        averageValue,
        renewalRate,
        complianceScore,
        riskScore,
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      // Return default values when there's an error or no data
      return {
        totalContracts: 0,
        contractsByCategory: {},
        recentContracts: [],
        expiringContracts: [],
        totalValue: 0,
        activeContracts: 0,
        expiredContracts: 0,
        pendingContracts: 0,
        averageValue: 0,
        renewalRate: 0,
        complianceScore: 100,
        riskScore: 0,
      };
    }
  },

  /**
   * Exports contracts to Excel
   */
  async exportToExcel(filters?: ContractFilters): Promise<Blob> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(
      `/contracts/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );

    return response as Blob;
  },

  /**
   * Bulk operations for contracts
   */
  async bulkDelete(ids: number[]): Promise<void> {
    // Para bulk delete, fazer múltiplas chamadas individuais
    // já que o DELETE não deve ter body
    const deletePromises = ids.map((id) => this.delete(id));
    await Promise.all(deletePromises);
  },

  /**
   * Search contracts with full-text search
   */
  async search(
    query: string,
    filters?: ContractFilters
  ): Promise<PaginatedResponse<Contract>> {
    const params = new URLSearchParams();
    params.append("q", query);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    return apiClient.get<PaginatedResponse<Contract>>(
      `/contracts/search?${params.toString()}`
    );
  },
};
