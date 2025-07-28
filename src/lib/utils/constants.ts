/**
 * @fileoverview Constantes do sistema
 * @module @/lib/utils/constants
 */

export const CONTRACT_CATEGORIES = {
  SOFTWARE: "Software",
  ALUGUEL: "Aluguel",
  TI: "TI",
  OUTROS: "Outros",
} as const;

export const CONTRACT_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  PENDING: "pending",
} as const;

export const FILE_LIMITS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ["pdf"] as const,
  ALLOWED_MIME_TYPES: ["application/pdf"] as const,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100] as const,
} as const;

export const DATE_FORMATS = {
  SHORT: "dd/MM/yyyy",
  LONG: "dd 'de' MMMM 'de' yyyy",
  DATETIME: "dd/MM/yyyy HH:mm",
  TIME: "HH:mm",
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  CONTRACTS: {
    BASE: "/dashboard",
    BY_ID: (id: number) => `/dashboard/${id}`,
    DOWNLOAD: (id: number) => `/dashboard/${id}/download`,
    STATISTICS: "/dashboard/statistics",
  },
} as const;

export const ERROR_MESSAGES = {
  GENERIC: "Ocorreu um erro inesperado",
  NETWORK: "Erro de conexão. Verifique sua internet",
  UNAUTHORIZED: "Acesso não autorizado",
  NOT_FOUND: "Recurso não encontrado",
  VALIDATION: "Dados inválidos. Verifique o formulário",
  FILE_TOO_LARGE: "Arquivo muito grande. Máximo 10MB",
  INVALID_FILE_TYPE: "Tipo de arquivo inválido. Apenas PDF",
} as const;

export const SUCCESS_MESSAGES = {
  CONTRACT_CREATED: "Contrato criado com sucesso!",
  CONTRACT_UPDATED: "Contrato atualizado com sucesso!",
  CONTRACT_DELETED: "Contrato excluído com sucesso!",
  FILE_UPLOADED: "Arquivo enviado com sucesso!",
  LOGIN_SUCCESS: "Login realizado com sucesso!",
  REGISTER_SUCCESS: "Conta criada com sucesso!",
} as const;

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  PHONE: /^\(\d{2}\) \d{4,5}-\d{4}$/,
  CEP: /^\d{5}-\d{3}$/,
} as const;

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  VIEWER: "viewer",
} as const;

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;
