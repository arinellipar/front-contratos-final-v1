/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/utils/formatters.ts
/**
 * Comprehensive formatting utilities for consistent data display
 * Handles dates, currency, file sizes, and other common formatting needs
 */

import { format, formatDistanceToNow, isValid, Locale, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  includeTime?: boolean;
  short?: boolean;
  relative?: boolean;
  locale?: Locale;
}

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: "decimal" | "percent" | "unit";
  unit?: string;
  compact?: boolean;
}

/**
 * Format a date string or Date object to a localized string
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!date) return "—";

  const {
    includeTime = false,
    short = false,
    relative = false,
    locale = ptBR,
  } = options;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return "Data inválida";
    }

    if (relative) {
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale,
      });
    }

    if (short) {
      return format(dateObj, includeTime ? "dd/MM/yy HH:mm" : "dd/MM/yy", {
        locale,
      });
    }

    if (includeTime) {
      return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale });
    }

    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data inválida";
  }
}

/**
 * Format a date for form inputs (YYYY-MM-DD)
 */
export function formatDateForInput(
  date: string | Date | null | undefined
): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return "";
    }

    return format(dateObj, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
}

/**
 * Format relative time (e.g., "2 horas atrás", "em 3 dias")
 */
export function formatRelativeTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "—";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return "Data inválida";
    }

    return formatDistanceToNow(dateObj, {
      addSuffix: true,
      locale: ptBR,
    });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Data inválida";
  }
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(
  date: string | Date | null | undefined,
  use24Hour = true
): string {
  if (!date) return "—";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return "Hora inválida";
    }

    return format(dateObj, use24Hour ? "HH:mm" : "h:mm a", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Hora inválida";
  }
}

/**
 * Format currency values in Brazilian Real
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {}
): string {
  if (value === null || value === undefined || value === "") return "—";

  const {
    currency = "BRL",
    locale = "pt-BR",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    compact = false,
  } = options;

  try {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue)) {
      return "Valor inválido";
    }

    if (compact && Math.abs(numericValue) >= 1000) {
      return formatCompactCurrency(numericValue, currency, locale);
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numericValue);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return "Valor inválido";
  }
}

/**
 * Format compact currency (e.g., R$ 1,2 mi, R$ 50 mil)
 */
function formatCompactCurrency(
  value: number,
  currency: string,
  locale: string
): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 1000000000) {
    const formatted = (value / 1000000000).toFixed(1);
    return `${sign}R$ ${formatted} bi`;
  } else if (absValue >= 1000000) {
    const formatted = (value / 1000000).toFixed(1);
    return `${sign}R$ ${formatted} mi`;
  } else if (absValue >= 1000) {
    const formatted = (value / 1000).toFixed(0);
    return `${sign}R$ ${formatted} mil`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format numbers with localization
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: NumberFormatOptions = {}
): string {
  if (value === null || value === undefined || value === "") return "—";

  const {
    locale = "pt-BR",
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    style = "decimal",
    unit,
    compact = false,
  } = options;

  try {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue)) {
      return "Valor inválido";
    }

    const formatOptions: Intl.NumberFormatOptions = {
      style,
      minimumFractionDigits,
      maximumFractionDigits,
    };

    if (unit && style === "unit") {
      formatOptions.unit = unit;
    }

    if (compact) {
      formatOptions.notation = "compact";
      formatOptions.compactDisplay = "short";
    }

    return new Intl.NumberFormat(locale, formatOptions).format(numericValue);
  } catch (error) {
    console.error("Error formatting number:", error);
    return "Valor inválido";
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || value === "") return "—";

  try {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numericValue)) {
      return "Valor inválido";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numericValue / 100);
  } catch (error) {
    console.error("Error formatting percentage:", error);
    return "Valor inválido";
  }
}

/**
 * Format file sizes in human-readable format
 */
export function formatFileSize(
  bytes: number | string | null | undefined,
  decimals = 2
): string {
  if (bytes === null || bytes === undefined || bytes === "") return "—";

  try {
    const numericBytes =
      typeof bytes === "string" ? parseInt(bytes, 10) : bytes;

    if (isNaN(numericBytes) || numericBytes < 0) {
      return "Tamanho inválido";
    }

    if (numericBytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

    const i = Math.floor(Math.log(numericBytes) / Math.log(k));

    return (
      parseFloat((numericBytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    );
  } catch (error) {
    console.error("Error formatting file size:", error);
    return "Tamanho inválido";
  }
}

/**
 * Format phone numbers to Brazilian format
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "—";

  try {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");

    // Format based on length
    if (cleaned.length === 11) {
      // Mobile: (11) 99999-9999
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      // Landline: (11) 9999-9999
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    } else if (cleaned.length === 8) {
      // Local: 9999-9999
      return cleaned.replace(/(\d{4})(\d{4})/, "$1-$2");
    }

    return phone; // Return original if doesn't match patterns
  } catch (error) {
    console.error("Error formatting phone number:", error);
    return phone;
  }
}

/**
 * Format CPF (Brazilian individual taxpayer registry)
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "—";

  try {
    const cleaned = cpf.replace(/\D/g, "");

    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    return cpf; // Return original if invalid length
  } catch (error) {
    console.error("Error formatting CPF:", error);
    return cpf;
  }
}

/**
 * Format CNPJ (Brazilian company registry)
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "—";

  try {
    const cleaned = cnpj.replace(/\D/g, "");

    if (cleaned.length === 14) {
      return cleaned.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }

    return cnpj; // Return original if invalid length
  } catch (error) {
    console.error("Error formatting CNPJ:", error);
    return cnpj;
  }
}

/**
 * Format postal code (CEP)
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return "—";

  try {
    const cleaned = cep.replace(/\D/g, "");

    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
    }

    return cep; // Return original if invalid length
  } catch (error) {
    console.error("Error formatting CEP:", error);
    return cep;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  suffix = "..."
): string {
  if (!text) return "—";

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Format text to title case
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return "";

  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Format text to sentence case
 */
export function toSentenceCase(text: string | null | undefined): string {
  if (!text) return "";

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format contract status for display
 */
export function formatContractStatus(status: string | null | undefined): {
  label: string;
  color: string;
  icon: string;
} {
  if (!status) {
    return { label: "Indefinido", color: "gray", icon: "❓" };
  }

  const statusMap: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    draft: { label: "Rascunho", color: "gray", icon: "📝" },
    active: { label: "Ativo", color: "green", icon: "✅" },
    expired: { label: "Expirado", color: "red", icon: "❌" },
    cancelled: { label: "Cancelado", color: "red", icon: "🚫" },
    suspended: { label: "Suspenso", color: "yellow", icon: "⏸️" },
    renewing: { label: "Em Renovação", color: "orange", icon: "🔄" },
  };

  return (
    statusMap[status.toLowerCase()] || {
      label: toTitleCase(status),
      color: "gray",
      icon: "📄",
    }
  );
}

/**
 * Format user role for display
 */
export function formatUserRole(role: string | null | undefined): string {
  if (!role) return "—";

  const roleMap: Record<string, string> = {
    SuperAdmin: "Super Administrador",
    Admin: "Administrador",
    Manager: "Gerente",
    User: "Usuário",
    Viewer: "Visualizador",
  };

  return roleMap[role] || toTitleCase(role);
}

/**
 * Format duration in a human-readable format
 */
export function formatDuration(
  milliseconds: number | null | undefined
): string {
  if (milliseconds === null || milliseconds === undefined) return "—";

  if (milliseconds < 0) return "Valor inválido";

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} dia${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hora${hours > 1 ? "s" : ""}`;
  } else if (minutes > 0) {
    return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
  } else {
    return `${seconds} segundo${seconds > 1 ? "s" : ""}`;
  }
}

/**
 * Format contract expiry information
 */
export function formatContractExpiry(
  dataContrato: string | Date,
  prazo: number
): {
  expiryDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  label: string;
  color: string;
} {
  try {
    const startDate =
      typeof dataContrato === "string" ? parseISO(dataContrato) : dataContrato;
    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + prazo);

    const now = new Date();
    const daysRemaining = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isExpired = daysRemaining < 0;
    const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;

    let label: string;
    let color: string;

    if (isExpired) {
      label = `Expirado há ${Math.abs(daysRemaining)} dia${
        Math.abs(daysRemaining) > 1 ? "s" : ""
      }`;
      color = "red";
    } else if (isExpiringSoon) {
      label = `Expira em ${daysRemaining} dia${daysRemaining > 1 ? "s" : ""}`;
      color = "orange";
    } else {
      label = `${daysRemaining} dia${daysRemaining > 1 ? "s" : ""} restantes`;
      color = "green";
    }

    return {
      expiryDate,
      daysRemaining,
      isExpired,
      isExpiringSoon,
      label,
      color,
    };
  } catch (error) {
    console.error("Error formatting contract expiry:", error);
    return {
      expiryDate: new Date(),
      daysRemaining: 0,
      isExpired: false,
      isExpiringSoon: false,
      label: "Data inválida",
      color: "gray",
    };
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}): string {
  const parts = [];

  if (address.street) {
    let streetPart = address.street;
    if (address.number) streetPart += `, ${address.number}`;
    if (address.complement) streetPart += ` - ${address.complement}`;
    parts.push(streetPart);
  }

  if (address.neighborhood) parts.push(address.neighborhood);

  if (address.city && address.state) {
    parts.push(`${address.city} - ${address.state}`);
  } else if (address.city) {
    parts.push(address.city);
  }

  if (address.cep) parts.push(formatCEP(address.cep));

  return parts.join(", ") || "Endereço não informado";
}

/**
 * Utility type for formatter function signatures
 */
export type FormatterFunction<T = any> = (value: T, ...args: any[]) => string;

/**
 * Collection of all formatters for easy importing
 */
export const formatters = {
  date: formatDate,
  dateForInput: formatDateForInput,
  relativeTime: formatRelativeTime,
  time: formatTime,
  currency: formatCurrency,
  number: formatNumber,
  percentage: formatPercentage,
  fileSize: formatFileSize,
  phoneNumber: formatPhoneNumber,
  cpf: formatCPF,
  cnpj: formatCNPJ,
  cep: formatCEP,
  truncateText,
  titleCase: toTitleCase,
  sentenceCase: toSentenceCase,
  contractStatus: formatContractStatus,
  userRole: formatUserRole,
  duration: formatDuration,
  contractExpiry: formatContractExpiry,
  address: formatAddress,
} as const;
