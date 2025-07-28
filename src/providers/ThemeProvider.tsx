/**
 * @fileoverview Enterprise Theme Provider with Advanced Context Management
 * @module providers/ThemeProvider
 * @description Implementação robusta do Theme Provider com gerenciamento de estado global,
 * persistência local, detecção de preferências do sistema e transições fluidas
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

/**
 * Theme mode enumeration with comprehensive type safety
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Theme configuration interface with extended properties
 */
interface ThemeConfig {
  mode: ThemeMode;
  systemPreference: "light" | "dark";
  resolvedTheme: "light" | "dark";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  highContrast: boolean;
}

/**
 * Theme context interface with comprehensive API surface
 */
interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  systemPreference: "light" | "dark";
  config: ThemeConfig;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: "small" | "medium" | "large") => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

/**
 * Default theme configuration with enterprise-grade defaults
 */
const DEFAULT_CONFIG: ThemeConfig = {
  mode: "light",
  systemPreference: "light",
  resolvedTheme: "light",
  accentColor: "#0a2540",
  fontSize: "medium",
  reducedMotion: false,
  highContrast: false,
};

/**
 * Storage keys for persistent configuration
 */
const STORAGE_KEYS = {
  THEME_MODE: "fradema_theme_mode",
  ACCENT_COLOR: "fradema_accent_color",
  FONT_SIZE: "fradema_font_size",
  REDUCED_MOTION: "fradema_reduced_motion",
  HIGH_CONTRAST: "fradema_high_contrast",
} as const;

/**
 * Create theme context with type safety
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Props interface
 */
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  enableSystem?: boolean;
  attribute?: string;
  value?: Record<string, string>;
  disableTransitionOnChange?: boolean;
}

/**
 * Advanced utility for detecting system theme preference
 */
function useSystemPreference(): "light" | "dark" {
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">(
    "light"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updatePreference = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    // Set initial value
    updatePreference(mediaQuery);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => updatePreference(e);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return systemPreference;
}

/**
 * Enhanced local storage hook with error handling and type safety
 */
function usePersistedState<T>(
  key: string,
  defaultValue: T,
  serializer = {
    serialize: JSON.stringify,
    deserialize: JSON.parse,
  }
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.deserialize(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(state) : value;
        setState(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serializer.serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serializer, state]
  );

  return [state, setValue];
}

/**
 * Enterprise Theme Provider Component
 * Implements comprehensive theme management with persistence and system integration
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "fradema_theme",
  enableSystem = true,
  attribute = "class",
  value,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const systemPreference = useSystemPreference();

  // Persisted state management with type safety
  const [theme, setThemeState] = usePersistedState<ThemeMode>(
    STORAGE_KEYS.THEME_MODE,
    defaultTheme
  );

  const [accentColor, setAccentColorState] = usePersistedState(
    STORAGE_KEYS.ACCENT_COLOR,
    DEFAULT_CONFIG.accentColor
  );

  const [fontSize, setFontSizeState] = usePersistedState<
    "small" | "medium" | "large"
  >(STORAGE_KEYS.FONT_SIZE, DEFAULT_CONFIG.fontSize);

  const [reducedMotion, setReducedMotionState] = usePersistedState(
    STORAGE_KEYS.REDUCED_MOTION,
    DEFAULT_CONFIG.reducedMotion
  );

  const [highContrast, setHighContrastState] = usePersistedState(
    STORAGE_KEYS.HIGH_CONTRAST,
    DEFAULT_CONFIG.highContrast
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Compute resolved theme based on current mode and system preference
   */
  const resolvedTheme = useMemo((): "light" | "dark" => {
    if (theme === "system") {
      return systemPreference;
    }
    return theme;
  }, [theme, systemPreference]);

  /**
   * Memoized theme configuration object
   */
  const config = useMemo(
    (): ThemeConfig => ({
      mode: theme,
      systemPreference,
      resolvedTheme,
      accentColor,
      fontSize,
      reducedMotion,
      highContrast,
    }),
    [
      theme,
      systemPreference,
      resolvedTheme,
      accentColor,
      fontSize,
      reducedMotion,
      highContrast,
    ]
  );

  /**
   * Apply theme to document with performance optimizations
   */
  const applyTheme = useCallback(
    (newTheme: "light" | "dark") => {
      if (typeof window === "undefined") return;

      const root = window.document.documentElement;
      const body = window.document.body;

      // Disable transitions temporarily if requested
      if (disableTransitionOnChange) {
        const css = document.createElement("style");
        css.appendChild(
          document.createTextNode(
            "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
          )
        );
        document.head.appendChild(css);

        // Force reflow
        (() => window.getComputedStyle(body).opacity)();

        // Re-enable transitions
        document.head.removeChild(css);
      }

      // Apply theme attribute
      if (attribute === "class") {
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      } else {
        root.setAttribute(attribute, newTheme);
      }

      // Apply custom values if provided
      if (value) {
        Object.entries(value).forEach(([key, val]) => {
          root.style.setProperty(key, val);
        });
      }

      // Apply additional configuration
      root.style.setProperty("--accent-color", accentColor);
      root.style.setProperty(
        "--font-size-scale",
        fontSize === "small" ? "0.875" : fontSize === "large" ? "1.125" : "1"
      );

      if (reducedMotion) {
        root.style.setProperty("--animation-duration", "0.01ms");
        root.classList.add("reduce-motion");
      } else {
        root.style.removeProperty("--animation-duration");
        root.classList.remove("reduce-motion");
      }

      if (highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Set color-scheme for native UI elements
      root.style.colorScheme = newTheme;
    },
    [
      attribute,
      value,
      accentColor,
      fontSize,
      reducedMotion,
      highContrast,
      disableTransitionOnChange,
    ]
  );

  /**
   * Enhanced theme setter with validation and side effects
   */
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (!["light", "dark", "system"].includes(newTheme)) {
        console.warn(
          `Invalid theme mode: ${newTheme}. Falling back to system.`
        );
        newTheme = "system";
      }

      setThemeState(newTheme);

      // Apply theme immediately for better UX
      const resolvedNewTheme =
        newTheme === "system" ? systemPreference : newTheme;
      applyTheme(resolvedNewTheme);

      // Dispatch custom event for external integrations
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("theme-change", {
            detail: { theme: newTheme, resolvedTheme: resolvedNewTheme },
          })
        );
      }
    },
    [setThemeState, systemPreference, applyTheme]
  );

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback(() => {
    if (theme === "system") {
      setTheme(systemPreference === "dark" ? "light" : "dark");
    } else {
      setTheme(theme === "dark" ? "light" : "dark");
    }
  }, [theme, systemPreference, setTheme]);

  /**
   * Advanced configuration setters with immediate application
   */
  const setAccentColor = useCallback(
    (color: string) => {
      setAccentColorState(color);
      if (typeof window !== "undefined") {
        document.documentElement.style.setProperty("--accent-color", color);
      }
    },
    [setAccentColorState]
  );

  const setFontSize = useCallback(
    (size: "small" | "medium" | "large") => {
      setFontSizeState(size);
      const scale =
        size === "small" ? "0.875" : size === "large" ? "1.125" : "1";
      if (typeof window !== "undefined") {
        document.documentElement.style.setProperty("--font-size-scale", scale);
      }
    },
    [setFontSizeState]
  );

  const setReducedMotion = useCallback(
    (enabled: boolean) => {
      setReducedMotionState(enabled);
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        if (enabled) {
          root.style.setProperty("--animation-duration", "0.01ms");
          root.classList.add("reduce-motion");
        } else {
          root.style.removeProperty("--animation-duration");
          root.classList.remove("reduce-motion");
        }
      }
    },
    [setReducedMotionState]
  );

  const setHighContrast = useCallback(
    (enabled: boolean) => {
      setHighContrastState(enabled);
      if (typeof window !== "undefined") {
        const root = document.documentElement;
        if (enabled) {
          root.classList.add("high-contrast");
        } else {
          root.classList.remove("high-contrast");
        }
      }
    },
    [setHighContrastState]
  );

  /**
   * Reset all settings to defaults
   */
  const resetToDefaults = useCallback(() => {
    setTheme(DEFAULT_CONFIG.mode);
    setAccentColor(DEFAULT_CONFIG.accentColor);
    setFontSize(DEFAULT_CONFIG.fontSize);
    setReducedMotion(DEFAULT_CONFIG.reducedMotion);
    setHighContrast(DEFAULT_CONFIG.highContrast);
  }, [
    setTheme,
    setAccentColor,
    setFontSize,
    setReducedMotion,
    setHighContrast,
  ]);

  /**
   * Initialize theme on mount
   */
  useEffect(() => {
    setIsMounted(true);

    // Apply initial theme
    applyTheme(resolvedTheme);

    // Set loading to false after applying theme
    const timer = setTimeout(() => setIsLoading(false), 100);

    return () => clearTimeout(timer);
  }, [applyTheme, resolvedTheme]);

  /**
   * Handle system preference changes
   */
  useEffect(() => {
    if (isMounted && theme === "system") {
      applyTheme(systemPreference);
    }
  }, [systemPreference, theme, applyTheme, isMounted]);

  /**
   * Detect user's motion preferences
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (!reducedMotion) {
        // Only auto-apply if user hasn't manually set preference
        setReducedMotion(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [reducedMotion, setReducedMotion]);

  /**
   * Context value with comprehensive API
   */
  const contextValue = useMemo(
    (): ThemeContextType => ({
      theme,
      resolvedTheme,
      systemPreference,
      config,
      setTheme,
      toggleTheme,
      setAccentColor,
      setFontSize,
      setReducedMotion,
      setHighContrast,
      resetToDefaults,
      isLoading,
    }),
    [
      theme,
      resolvedTheme,
      systemPreference,
      config,
      setTheme,
      toggleTheme,
      setAccentColor,
      setFontSize,
      setReducedMotion,
      setHighContrast,
      resetToDefaults,
      isLoading,
    ]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Enhanced hook for consuming theme context with comprehensive error handling
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme must be used within a ThemeProvider. " +
        "Make sure to wrap your app or component tree with <ThemeProvider>."
    );
  }

  return context;
}

/**
 * Utility hook for theme-aware styling
 */
export function useThemeAwareStyles() {
  const { resolvedTheme, config } = useTheme();

  return useMemo(
    () => ({
      isDark: resolvedTheme === "dark",
      isLight: resolvedTheme === "light",
      accentColor: config.accentColor,
      fontSize: config.fontSize,
      reducedMotion: config.reducedMotion,
      highContrast: config.highContrast,
      theme: resolvedTheme,
    }),
    [resolvedTheme, config]
  );
}

/**
 * Hook for theme-aware animations
 */
export function useThemeAwareAnimation() {
  const { config } = useTheme();

  return useMemo(
    () => ({
      duration: config.reducedMotion ? "0ms" : undefined,
      disabled: config.reducedMotion,
      transition: config.reducedMotion
        ? "none"
        : "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    }),
    [config.reducedMotion]
  );
}

// Export types for external usage
export type { ThemeConfig, ThemeContextType };

// Export default for convenience
export default ThemeProvider;
