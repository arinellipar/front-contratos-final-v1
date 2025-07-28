/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Arquivo principal de utilitários do Sistema Fradema
 * @module @/lib/utils
 * @description Centraliza todas as funções utilitárias com implementações otimizadas
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Re-export all utilities
export * from "./formatters";
export * from "./validators";
export * from "./constants";
export * from "./date";
export * from "./api";
export * from "./storage";
export * from "./crypto";
export * from "./performance";

// Re-export string utilities with explicit naming to avoid conflicts
export * as StringUtils from "./string";

// Re-export file utilities with explicit naming to avoid conflicts
export * as FileUtils from "./file";

/**
 * Merge class names with Tailwind CSS conflict resolution
 * @description Combina classes CSS resolvendo conflitos do Tailwind CSS
 * @param inputs - Array de valores de classe (strings, condicionais, objetos)
 * @returns String de classes CSS otimizada
 * @example
 * cn('px-2 py-1', 'p-3') // Returns: 'p-3'
 * cn('text-red-500', condition && 'text-blue-500') // Conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Type-safe object keys
 * @description Retorna as chaves de um objeto com tipagem correta
 */
export const objectKeys = <T extends object>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

/**
 * Type-safe object entries
 * @description Retorna entries de um objeto com tipagem correta
 */
export const objectEntries = <T extends object>(
  obj: T
): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

/**
 * Deep clone object
 * @description Clona profundamente um objeto
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T;
  if (obj instanceof Set)
    return new Set(Array.from(obj).map((item) => deepClone(item))) as T;
  if (obj instanceof Map)
    return new Map(Array.from(obj).map(([k, v]) => [k, deepClone(v)])) as T;

  const clonedObj = Object.create(Object.getPrototypeOf(obj));
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Safe JSON parse
 * @description Parse JSON com fallback para valor padrão
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Is empty check
 * @description Verifica se um valor está vazio
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return false;
  if (value instanceof Date) return false;
  if (value instanceof Error) return false;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  if (value instanceof Set || value instanceof Map) return value.size === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Pick properties from object
 * @description Seleciona propriedades específicas de um objeto
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit properties from object
 * @description Remove propriedades específicas de um objeto
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
};

/**
 * Group array by key
 * @description Agrupa array de objetos por uma chave
 */
export const groupBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Unique array values
 * @description Remove valores duplicados de um array
 */
export const uniqueArray = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Unique array by key
 * @description Remove objetos duplicados por chave
 */
export const uniqueBy = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): T[] => {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
};

/**
 * Chunk array
 * @description Divide array em chunks de tamanho específico
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten array
 * @description Achata array multi-dimensional
 */
export const flatten = <T>(array: any[]): T[] => {
  return array.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val),
    []
  );
};

/**
 * Sort by multiple fields
 * @description Ordena array por múltiplos campos
 */
export const sortBy = <T extends Record<string, any>>(
  array: T[],
  fields: Array<keyof T | { field: keyof T; order: "asc" | "desc" }>
): T[] => {
  return [...array].sort((a, b) => {
    for (const fieldConfig of fields) {
      const field =
        typeof fieldConfig === "object" ? fieldConfig.field : fieldConfig;
      const order = typeof fieldConfig === "object" ? fieldConfig.order : "asc";

      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) continue;

      const comparison = aVal > bVal ? 1 : -1;
      return order === "asc" ? comparison : -comparison;
    }
    return 0;
  });
};

/**
 * Range generator
 * @description Gera array com range de números
 */
export const range = (start: number, end: number, step = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
};

/**
 * Clamp number
 * @description Limita número entre min e max
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Random integer
 * @description Gera número inteiro aleatório entre min e max
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * UUID v4 generator
 * @description Gera UUID v4 compatível com RFC 4122
 */
export const uuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Async pipe
 * @description Compõe funções assíncronas em pipeline
 */
export const asyncPipe = <T>(...fns: Array<(arg: T) => Promise<T> | T>) => {
  return async (arg: T): Promise<T> => {
    let result = arg;
    for (const fn of fns) {
      result = await fn(result);
    }
    return result;
  };
};

/**
 * Retry async function
 * @description Tenta executar função assíncrona com retry
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> => {
  const { retries = 3, delay = 1000, onRetry } = options;

  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < retries) {
        onRetry?.(lastError, i + 1);
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  }

  throw lastError!;
};

/**
 * Measure performance
 * @description Mede tempo de execução de função
 */
export const measurePerformance = async <T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(
      `[Performance] ${name} (failed): ${(end - start).toFixed(2)}ms`
    );
    throw error;
  }
};

/**
 * Create enum from array
 * @description Cria enum-like object de array
 */
export const createEnum = <T extends string>(values: T[]): { [K in T]: K } => {
  return values.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {} as { [K in T]: K });
};

/**
 * Safe divide
 * @description Divisão segura com proteção contra divisão por zero
 */
export const safeDivide = (
  dividend: number,
  divisor: number,
  fallback = 0
): number => {
  if (divisor === 0) return fallback;
  return dividend / divisor;
};

/**
 * Percentage calculation
 * @description Calcula percentagem com precisão
 */
export const percentage = (
  value: number,
  total: number,
  decimals = 2
): number => {
  const percent = safeDivide(value * 100, total, 0);
  return Number(percent.toFixed(decimals));
};
