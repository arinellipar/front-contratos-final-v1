/**
 * @fileoverview Utilitários de otimização de performance
 * @module @/lib/utils/performance
 */

import React from "react";

/**
 * Debounce function
 * @description Atrasa execução de função
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

/**
 * Throttle function
 * @description Limita frequência de execução
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastResult: any;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
};

/**
 * Memoize function
 * @description Cache de resultados de função
 */
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
};

/**
 * Request idle callback
 * @description Executa quando browser está idle
 */
export const requestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
): void => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Lazy load component
 * @description Componente com lazy loading
 */
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunc);
};

/**
 * Virtual scroll helper
 * @description Cálculo para scroll virtual
 */
export const calculateVirtualScroll = (
  totalItems: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan = 5
): {
  startIndex: number;
  endIndex: number;
  offsetY: number;
} => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  const offsetY = startIndex * itemHeight;

  return { startIndex, endIndex, offsetY };
};

/**
 * Batch updates
 * @description Agrupa updates para melhor performance
 */
export const batchUpdates = <T>(
  updates: Array<() => void>,
  batchSize = 10,
  delay = 0
): Promise<void> => {
  return new Promise((resolve) => {
    let index = 0;

    const processBatch = () => {
      const batch = updates.slice(index, index + batchSize);

      batch.forEach((update) => update());

      index += batchSize;

      if (index < updates.length) {
        setTimeout(processBatch, delay);
      } else {
        resolve();
      }
    };

    processBatch();
  });
};

/**
 * Memory cache with size limit
 * @description Cache com limite de memória
 */
export class MemoryCache<K, V> {
  private cache = new Map<K, { value: V; size: number }>();
  private sizeLimit: number;
  private currentSize = 0;

  constructor(sizeLimitMB: number) {
    this.sizeLimit = sizeLimitMB * 1024 * 1024;
  }

  set(key: K, value: V): void {
    const size = this.estimateSize(value);

    // Remove items if needed
    while (this.currentSize + size > this.sizeLimit && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }

    this.cache.set(key, { value, size });
    this.currentSize += size;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    return item?.value;
  }

  delete(key: K): boolean {
    const item = this.cache.get(key);

    if (item) {
      this.currentSize -= item.size;
      return this.cache.delete(key);
    }

    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private estimateSize(value: any): number {
    return new Blob([JSON.stringify(value)]).size;
  }
}
