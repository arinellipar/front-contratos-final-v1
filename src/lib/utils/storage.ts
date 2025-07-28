/**
 * @fileoverview Utilitários para Local/Session Storage
 * @module @/lib/utils/storage
 */

import React from "react";

type StorageType = "local" | "session";

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== "undefined";

/**
 * Storage wrapper with JSON support
 * @description Wrapper seguro para localStorage/sessionStorage
 */
class StorageWrapper {
  private type: StorageType;
  private prefix: string;

  constructor(type: StorageType = "local", prefix = "fradema_") {
    this.type = type;
    this.prefix = prefix;
  }

  private get storage(): Storage | null {
    if (!isBrowser) return null;
    return this.type === "local" ? window.localStorage : window.sessionStorage;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, value: T): void {
    try {
      const storage = this.storage;
      if (!storage) return;

      const serialized = JSON.stringify(value);
      storage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error("Storage set error:", error);
    }
  }

  get<T>(key: string, fallback?: T): T | null {
    try {
      const storage = this.storage;
      if (!storage) return fallback ?? null;

      const item = storage.getItem(this.getKey(key));

      if (item === null) {
        return fallback ?? null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error("Storage get error:", error);
      return fallback ?? null;
    }
  }

  remove(key: string): void {
    const storage = this.storage;
    if (!storage) return;

    storage.removeItem(this.getKey(key));
  }

  clear(): void {
    const storage = this.storage;
    if (!storage) return;

    // Clear only items with our prefix
    const keys = Object.keys(storage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        storage.removeItem(key);
      }
    });
  }

  has(key: string): boolean {
    const storage = this.storage;
    if (!storage) return false;

    return storage.getItem(this.getKey(key)) !== null;
  }

  size(): number {
    const storage = this.storage;
    if (!storage) return 0;

    let size = 0;
    const keys = Object.keys(storage);

    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const item = storage.getItem(key);
        if (item) {
          size += item.length + key.length;
        }
      }
    });

    return size;
  }
}

export const localStorageWrapper = new StorageWrapper("local");
export const sessionStorageWrapper = new StorageWrapper("session");

/**
 * Storage with expiration
 * @description Storage com tempo de expiração
 */
export const setWithExpiry = <T>(
  key: string,
  value: T,
  expiryMinutes: number
): void => {
  const now = new Date();
  const item = {
    value,
    expiry: now.getTime() + expiryMinutes * 60 * 1000,
  };

  localStorageWrapper.set(key, item);
};

export const getWithExpiry = <T>(key: string): T | null => {
  const item = localStorageWrapper.get<{ value: T; expiry: number }>(key);

  if (!item) return null;

  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorageWrapper.remove(key);
    return null;
  }

  return item.value;
};

/**
 * Persistent state hook
 * @description Hook para estado persistente
 */
export const usePersistentState = <T>(
  key: string,
  initialValue: T,
  storage: StorageWrapper = localStorageWrapper
): [T, (value: T) => void] => {
  const [state, setState] = React.useState<T>(() => {
    // Only try to get stored value on client side
    if (!isBrowser) return initialValue;

    const stored = storage.get<T>(key);
    return stored ?? initialValue;
  });

  const setPersistentState = React.useCallback(
    (value: T) => {
      setState(value);
      storage.set(key, value);
    },
    [key, storage]
  );

  // Sync state with storage on mount (client side only)
  React.useEffect(() => {
    if (!isBrowser) return;

    const stored = storage.get<T>(key);
    if (stored !== null && stored !== state) {
      setState(stored);
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setPersistentState];
};
