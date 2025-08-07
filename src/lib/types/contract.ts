/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/types/contract.ts
/**
 * Contract type definitions matching the backend API models
 * Ensures type safety between frontend and backend
 */

/**
 * Contract category enumeration
 */
export enum ContractCategory {
  Software = "Software",
  Aluguel = "Aluguel",
  TI = "TI",
  ContasConsumo = "Contas de Consumo",
  Outros = "Outros",
}

/**
 * Payment type enumeration
 */
export enum TipoPagamento {
  AVista = 1,
  Parcelado = 2,
}

/**
 * Payment method enumeration
 */
export enum FormaPagamento {
  Pix = 1,
  TED = 2,
  Transferencia = 3,
  Boleto = 4,
  CartaoCredito = 5,
}

/**
 * Filial enumeration
 */
export enum Filial {
  RioDeJaneiro = 1,
  Campinas = 2,
  Brasilia = 3,
  Curitiba = 4,
  SaoPaulo = 5,
  Joinville = 6,
  BeloHorizonte = 7,
  Salvador = 8,
  Vitoria = 9,
  Recife = 10,
  Manaus = 11,
  ZonaDaMataMineira = 12,
  RibeiraoPreto = 13,
  NovaIorque = 14,
  Orlando = 15,
}

/**
 * Base contract interface matching the backend Contract model
 */
export interface Contract {
  id: number;
  contrato: string;
  contratante: string;
  contratada: string;
  objeto: string;
  dataContrato: string; // ISO date string
  prazo: number;
  rescisao?: number;
  multa?: number;
  avisoPrevia?: number;
  observacoes?: string;
  filial: Filial;
  categoriaContrato: string;
  setorResponsavel: string;
  valorTotalContrato: number;
  tipoPagamento: TipoPagamento;
  quantidadeParcelas?: number;
  formaPagamento: FormaPagamento;
  dataFinal: string; // ISO date string
  dataCriacao: string; // ISO date string
  dataAtualizacao?: string; // ISO date string
  userId: string;

  // File-related properties
  arquivoPdfCaminho?: string;
  arquivoPdfNomeOriginal?: string;
  arquivoPdfTamanho?: number;

  // Status: 1 = Ativo, 2 = Cancelado
  status: number;

  // User tracking
  usuarioCriador: string;
  usuarioUltimaEdicao?: string;
  usuarioCancelamento?: string;
}

/**
 * Contract creation DTO for form submissions
 */
export interface ContractCreateDto {
  contrato: string;
  contratante: string;
  contratada: string;
  objeto: string;
  dataContrato: string;
  prazo: number;
  rescisao?: number;
  multa?: number; // Keep as number for frontend, will be converted to decimal in backend
  avisoPrevia?: number;
  observacoes?: string;
  filial: Filial;
  categoriaContrato: ContractCategory;
  setorResponsavel?: string;
  valorTotalContrato?: number;
  tipoPagamento?: TipoPagamento;
  quantidadeParcelas?: number;
  formaPagamento?: FormaPagamento;
  dataFinal?: string;
  arquivoPdf?: File;
}

/**
 * Contract update DTO for form submissions
 */
export interface ContractUpdateDto {
  contrato?: string;
  contratante?: string;
  contratada?: string;
  objeto?: string;
  dataContrato?: string;
  prazo?: number;
  rescisao?: number;
  multa?: number;
  avisoPrevia?: number;
  observacoes?: string;
  filial?: Filial;
  categoriaContrato?: ContractCategory;
  setorResponsavel?: string;
  valorTotalContrato?: number;
  tipoPagamento?: TipoPagamento;
  quantidadeParcelas?: number;
  formaPagamento?: FormaPagamento;
  dataFinal?: string;
  arquivoPdf?: File;
}

/**
 * Contract filtering options for API queries
 */
export interface ContractFilters {
  searchTerm?: string; // Busca geral por qualquer campo
  contratante?: string;
  dataInicio?: string; // ISO date string
  dataFim?: string; // ISO date string
  categoriaContrato?: ContractCategory | string;
  filial?: Filial;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Contract statistics for dashboard and reports
 */
export interface ContractStatistics {
  totalContracts: number;
  contractsByCategory: Record<string, number>;
  recentContracts: Contract[];
  expiringContracts: Contract[];
  activeContracts?: number;
  expiredContracts?: number;
  pendingContracts?: number;
  totalValue?: number;
  averageValue?: number;
}

/**
 * Contract status enumeration for extended functionality
 */
export enum ContractStatus {
  ACTIVE = 1,
  CANCELLED = 2,
}

/**
 * Document type enumeration for file management
 */
export enum DocumentType {
  ORIGINAL = "original",
  AMENDMENT = "amendment",
  ANNEX = "annex",
  RECEIPT = "receipt",
  OTHER = "other",
}

/**
 * Contract document interface for file attachments
 */
export interface ContractDocument {
  id: string;
  name: string;
  type: DocumentType;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  filePath: string;
  contentType?: string;
  checksum?: string;
}

/**
 * Contract history entry for audit trail
 */
export interface ContractHistory {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean | Date>;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
}

/**
 * Extended contract interface with additional metadata
 * Used for detailed views and advanced features
 */
export interface ExtendedContract extends Omit<Contract, "status"> {
  status: ContractStatus;
  documents: ContractDocument[];
  history: ContractHistory[];
  tags: string[];
  lastModifiedBy?: {
    id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, string | number | boolean | Date>;

  // Additional computed properties
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  riskScore?: number;
  complianceStatus?: "compliant" | "non_compliant" | "pending_review";
}

/**
 * Contract metrics for analytics
 */
export interface ContractMetrics {
  totalValue: number;
  daysRemaining: number;
  completionPercentage: number;
  riskScore: number;
  complianceStatus: "compliant" | "non_compliant" | "pending_review";
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url?: string;
}

/**
 * Contract search result interface
 */
export interface ContractSearchResult extends Contract {
  relevanceScore: number;
  highlightedFields: Record<string, string>;
  matchedTerms: string[];
}

/**
 * Contract export options
 */
export interface ContractExportOptions {
  format: "excel" | "pdf" | "csv";
  filters?: ContractFilters;
  includeDocuments?: boolean;
  fields?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Contract validation error interface
 */
export interface ContractValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

/**
 * Contract form state interface
 */
export interface ContractFormState {
  data: Partial<ContractCreateDto>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  uploadProgress?: number;
}

/**
 * Bulk operation result interface
 */
export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    id: number;
    error: string;
  }>;
}

/**
 * Contract notification preferences
 */
export interface ContractNotificationSettings {
  expiryWarningDays: number[];
  enableEmailNotifications: boolean;
  enableInAppNotifications: boolean;
  notifyOnStatusChange: boolean;
  notifyOnDocumentUpload: boolean;
}

/**
 * Advanced filter options for search
 */
export interface AdvancedContractFilters extends ContractFilters {
  hasDocuments?: boolean;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  status?: ContractStatus[];
  createdBy?: string[];
  lastModifiedAfter?: string;
  lastModifiedBefore?: string;
  fullTextSearch?: string;
}

/**
 * Contract template interface for standardized contracts
 */
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: ContractCategory;
  template: string;
  fields: Array<{
    name: string;
    type: "text" | "number" | "date" | "select";
    required: boolean;
    options?: string[];
    defaultValue?: any;
  }>;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * Type guards for runtime type checking
 */
export const isContract = (obj: any): obj is Contract => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.contrato === "string" &&
    typeof obj.contratante === "string" &&
    typeof obj.contratada === "string" &&
    typeof obj.objeto === "string" &&
    typeof obj.dataContrato === "string" &&
    typeof obj.prazo === "number" &&
    typeof obj.filial === "string" &&
    typeof obj.categoriaContrato === "string" &&
    typeof obj.dataCriacao === "string" &&
    typeof obj.userId === "string" &&
    typeof obj.status === "number" &&
    typeof obj.usuarioCriador === "string"
  );
};

export const isExtendedContract = (obj: any): obj is ExtendedContract => {
  return (
    isContract(obj) &&
    typeof (obj as ExtendedContract).status === "number" &&
    Array.isArray((obj as ExtendedContract).documents) &&
    Array.isArray((obj as ExtendedContract).history) &&
    Array.isArray((obj as ExtendedContract).tags)
  );
};

/**
 * Utility type for partial contract updates
 */
export type PartialContract = Partial<
  Omit<Contract, "id" | "userId" | "dataCriacao">
>;

/**
 * Contract field names for form validation and display
 */
export const ContractFields = {
  contrato: "Contrato",
  contratante: "Contratante",
  contratada: "Contratada",
  objeto: "Objeto",
  dataContrato: "Data do Contrato",
  prazo: "Prazo",
  rescisao: "Rescisão",
  multa: "Multa",
  avisoPrevia: "Aviso Prévio",
  observacoes: "Observações",
  filial: "Filial",
  categoriaContrato: "Categoria do Contrato",
  arquivoPdf: "Arquivo PDF",
} as const;

/**
 * Contract category display names with icons
 */
export const ContractCategoryDisplay = {
  [ContractCategory.Software]: {
    label: "Software",
    icon: "💻",
    color: "blue",
  },
  [ContractCategory.Aluguel]: {
    label: "Aluguel",
    icon: "🏢",
    color: "yellow",
  },
  [ContractCategory.TI]: {
    label: "TI",
    icon: "⚙️",
    color: "cyan",
  },
  [ContractCategory.ContasConsumo]: {
    label: "Contas de Consumo",
    icon: "🧾",
    color: "green",
  },
  [ContractCategory.Outros]: {
    label: "Outros",
    icon: "📁",
    color: "gray",
  },
} as const;

/**
 * Payment type display names
 */
export const TipoPagamentoDisplay = {
  [TipoPagamento.AVista]: {
    label: "À Vista",
    icon: "💰",
    color: "green",
  },
  [TipoPagamento.Parcelado]: {
    label: "Parcelado",
    icon: "💳",
    color: "blue",
  },
} as const;

/**
 * Payment method display names
 */
export const FormaPagamentoDisplay = {
  [FormaPagamento.Pix]: {
    label: "PIX",
    icon: "🔷",
    color: "purple",
  },
  [FormaPagamento.TED]: {
    label: "TED",
    icon: "🏦",
    color: "blue",
  },
  [FormaPagamento.Transferencia]: {
    label: "Transferência",
    icon: "💱",
    color: "cyan",
  },
  [FormaPagamento.Boleto]: {
    label: "Boleto",
    icon: "📄",
    color: "orange",
  },
  [FormaPagamento.CartaoCredito]: {
    label: "Cartão de Crédito",
    icon: "💳",
    color: "red",
  },
} as const;

/**
 * Filial display names
 */
export const FilialDisplay = {
  [Filial.RioDeJaneiro]: {
    label: "Rio de Janeiro",
    icon: "🏖️",
    color: "blue",
  },
  [Filial.Campinas]: {
    label: "Campinas",
    icon: "🏭",
    color: "purple",
  },
  [Filial.Brasilia]: {
    label: "Brasília",
    icon: "🏛️",
    color: "yellow",
  },
  [Filial.Curitiba]: {
    label: "Curitiba",
    icon: "🌲",
    color: "green",
  },
  [Filial.SaoPaulo]: {
    label: "São Paulo",
    icon: "🏙️",
    color: "gray",
  },
  [Filial.Joinville]: {
    label: "Joinville",
    icon: "🏘️",
    color: "teal",
  },
  [Filial.BeloHorizonte]: {
    label: "Belo Horizonte",
    icon: "⛰️",
    color: "orange",
  },
  [Filial.Salvador]: {
    label: "Salvador",
    icon: "🏝️",
    color: "yellow",
  },
  [Filial.Vitoria]: {
    label: "Vitória",
    icon: "🌊",
    color: "blue",
  },
  [Filial.Recife]: {
    label: "Recife",
    icon: "🏖️",
    color: "coral",
  },
  [Filial.Manaus]: {
    label: "Manaus",
    icon: "🌳",
    color: "green",
  },
  [Filial.ZonaDaMataMineira]: {
    label: "Zona da Mata Mineira",
    icon: "🌿",
    color: "green",
  },
  [Filial.RibeiraoPreto]: {
    label: "Ribeirão Preto",
    icon: "🌾",
    color: "brown",
  },
  [Filial.NovaIorque]: {
    label: "Nova Iorque",
    icon: "🗽",
    color: "blue",
  },
  [Filial.Orlando]: {
    label: "Orlando",
    icon: "🎢",
    color: "purple",
  },
} as const;

/**
 * Default values for new contracts
 */
export const DefaultContractValues: Partial<ContractCreateDto> = {
  prazo: 365,
  categoriaContrato: ContractCategory.Outros,
  dataContrato: new Date().toISOString().split("T")[0],
};

/**
 * Contract validation rules
 */
export const ContractValidationRules = {
  contrato: {
    required: true,
    maxLength: 2000,
  },
  contratante: {
    required: true,
    maxLength: 500,
  },
  contratada: {
    required: true,
    maxLength: 500,
  },
  objeto: {
    required: true,
    maxLength: 1000,
  },
  prazo: {
    required: true,
    min: 1,
    max: 36500,
  },
  rescisao: {
    min: 0,
    max: 3650,
  },
  multa: {
    min: 0,
    max: 999999999.99,
  },
  avisoPrevia: {
    min: 0,
    max: 365,
  },
  observacoes: {
    maxLength: 2000,
  },
  filial: {
    required: true,
    maxLength: 200,
  },
  arquivoPdf: {
    maxSize: 52428800, // 50MB
    allowedTypes: ["application/pdf"],
  },
} as const;
