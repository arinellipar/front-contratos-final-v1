// src/lib/design-system/tokens.ts
/**
 * @fileoverview Enterprise Design System Token Architecture
 * @module design-system/tokens
 * @description Comprehensive design token system implementing atomic design principles
 * with advanced theming capabilities and runtime CSS variable generation
 */

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  elevation: ElevationTokens;
  motion: MotionTokens;
  breakpoints: BreakpointTokens;
  radii: RadiiTokens;
  borders: BorderTokens;
}

interface ColorTokens {
  // Brand Colors with semantic mapping
  brand: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
  };
  // Semantic Colors for state representation
  semantic: {
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
  };
  // Neutral Colors for UI foundation
  neutral: ColorScale;
  // Surface Colors for layering
  surface: {
    base: string;
    raised: string;
    overlay: string;
    sunken: string;
  };
  // Interactive state colors
  interactive: {
    default: string;
    hover: string;
    active: string;
    disabled: string;
    focus: string;
  };
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

interface TypographyTokens {
  fontFamilies: {
    sans: string;
    serif: string;
    mono: string;
    display: string;
  };
  fontSizes: {
    "2xs": string;
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
    "5xl": string;
    "6xl": string;
    "7xl": string;
    "8xl": string;
    "9xl": string;
  };
  fontWeights: {
    thin: number;
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
  lineHeights: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

interface SpacingTokens {
  0: string;
  px: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

interface ElevationTokens {
  none: string;
  xs: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  inner: string;
}

interface MotionTokens {
  duration: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
    slower: string;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    easeInSine: string;
    easeOutSine: string;
    easeInOutSine: string;
    easeInQuad: string;
    easeOutQuad: string;
    easeInOutQuad: string;
    easeInCubic: string;
    easeOutCubic: string;
    easeInOutCubic: string;
    easeInQuart: string;
    easeOutQuart: string;
    easeInOutQuart: string;
    easeInExpo: string;
    easeOutExpo: string;
    easeInOutExpo: string;
    easeInBack: string;
    easeOutBack: string;
    easeInOutBack: string;
    spring: string;
    bounce: string;
  };
}

interface BreakpointTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
  "5xl": string;
}

interface RadiiTokens {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  full: string;
}

interface BorderTokens {
  width: {
    none: string;
    thin: string;
    base: string;
    thick: string;
  };
  style: {
    solid: string;
    dashed: string;
    dotted: string;
    double: string;
  };
}

// Implementation of the design tokens
export const tokens: DesignTokens = {
  colors: {
    brand: {
      primary: {
        50: "#e6f4ff",
        100: "#bae3ff",
        200: "#7cc4fa",
        300: "#47a3f3",
        400: "#2186eb",
        500: "#0967d2",
        600: "#0552b5",
        700: "#03449e",
        800: "#01337d",
        900: "#002159",
        950: "#001333",
      },
      secondary: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd",
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
        950: "#082f49",
      },
      accent: {
        50: "#fdf4ff",
        100: "#fae8ff",
        200: "#f5d0fe",
        300: "#f0abfc",
        400: "#e879f9",
        500: "#d946ef",
        600: "#c026d3",
        700: "#a21caf",
        800: "#86198f",
        900: "#701a75",
        950: "#4a044e",
      },
    },
    semantic: {
      success: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d",
        950: "#052e16",
      },
      warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
        950: "#451a03",
      },
      error: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
        950: "#450a0a",
      },
      info: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
        950: "#172554",
      },
    },
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717",
      950: "#0a0a0a",
    },
    surface: {
      base: "#ffffff",
      raised: "#fafafa",
      overlay: "rgba(0, 0, 0, 0.5)",
      sunken: "#f5f5f5",
    },
    interactive: {
      default: "#0967d2",
      hover: "#0552b5",
      active: "#03449e",
      disabled: "#e5e5e5",
      focus: "rgba(9, 103, 210, 0.2)",
    },
  },
  typography: {
    fontFamilies: {
      sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
      serif: "Merriweather, Georgia, serif",
      mono: '"JetBrains Mono", "SF Mono", Monaco, Consolas, monospace',
      display: '"Inter Display", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    fontSizes: {
      "2xs": "0.625rem",
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem",
      "8xl": "6rem",
      "9xl": "8rem",
    },
    fontWeights: {
      thin: 100,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: "-0.05em",
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
      widest: "0.1em",
    },
  },
  spacing: {
    0: "0",
    px: "1px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  elevation: {
    none: "none",
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    base: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "2xl": "0 35px 60px -15px rgba(0, 0, 0, 0.3)",
    "3xl": "0 50px 100px -20px rgba(0, 0, 0, 0.35)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  },
  motion: {
    duration: {
      instant: "0ms",
      fast: "150ms",
      normal: "300ms",
      slow: "450ms",
      slower: "600ms",
    },
    easing: {
      linear: "linear",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeInSine: "cubic-bezier(0.47, 0, 0.745, 0.715)",
      easeOutSine: "cubic-bezier(0.39, 0.575, 0.565, 1)",
      easeInOutSine: "cubic-bezier(0.445, 0.05, 0.55, 0.95)",
      easeInQuad: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
      easeOutQuad: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      easeInOutQuad: "cubic-bezier(0.455, 0.03, 0.515, 0.955)",
      easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
      easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)",
      easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      easeInQuart: "cubic-bezier(0.895, 0.03, 0.685, 0.22)",
      easeOutQuart: "cubic-bezier(0.165, 0.84, 0.44, 1)",
      easeInOutQuart: "cubic-bezier(0.77, 0, 0.175, 1)",
      easeInExpo: "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
      easeOutExpo: "cubic-bezier(0.19, 1, 0.22, 1)",
      easeInOutExpo: "cubic-bezier(1, 0, 0, 1)",
      easeInBack: "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
      easeOutBack: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },
  breakpoints: {
    xs: "320px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
    "3xl": "1920px",
    "4xl": "2560px",
    "5xl": "3840px",
  },
  radii: {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  borders: {
    width: {
      none: "0",
      thin: "1px",
      base: "2px",
      thick: "4px",
    },
    style: {
      solid: "solid",
      dashed: "dashed",
      dotted: "dotted",
      double: "double",
    },
  },
};

// CSS Variable generation utility
export function generateCSSVariables(tokens: DesignTokens): string {
  const cssVars: string[] = [];

  // Process color tokens
  Object.entries(tokens.colors.brand).forEach(([brand, scale]) => {
    Object.entries(scale).forEach(([shade, value]) => {
      cssVars.push(`--color-${brand}-${shade}: ${value};`);
    });
  });

  // Process semantic colors
  Object.entries(tokens.colors.semantic).forEach(([semantic, scale]) => {
    Object.entries(scale).forEach(([shade, value]) => {
      cssVars.push(`--color-${semantic}-${shade}: ${value};`);
    });
  });

  // Process spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });

  // Process typography
  Object.entries(tokens.typography.fontSizes).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value};`);
  });

  // Process elevation
  Object.entries(tokens.elevation).forEach(([key, value]) => {
    cssVars.push(`--elevation-${key}: ${value};`);
  });

  // Process motion
  Object.entries(tokens.motion.duration).forEach(([key, value]) => {
    cssVars.push(`--duration-${key}: ${value};`);
  });

  return `:root {\n${cssVars.map((v) => `  ${v}`).join("\n")}\n}`;
}

// Theme configuration interface
export interface ThemeConfig {
  mode: "light" | "dark";
  colorScheme: "blue" | "green" | "purple" | "red" | "orange";
  contrast: "normal" | "high";
  reducedMotion: boolean;
  density: "compact" | "normal" | "comfortable";
}

// Generate theme-specific tokens
export function generateThemeTokens(
  config: ThemeConfig
): Partial<DesignTokens> {
  const themeTokens: Partial<DesignTokens> = {};

  if (config.mode === "dark") {
    // Dark mode color adjustments
    themeTokens.colors = {
      ...tokens.colors,
      surface: {
        base: "#0a0a0a",
        raised: "#171717",
        overlay: "rgba(255, 255, 255, 0.1)",
        sunken: "#000000",
      },
    };
  }

  if (config.contrast === "high") {
    // High contrast adjustments
    themeTokens.colors = {
      ...(themeTokens.colors || tokens.colors),
      neutral: {
        ...tokens.colors.neutral,
        900: "#000000",
        50: "#ffffff",
      },
    };
  }

  if (config.reducedMotion) {
    // Reduced motion adjustments
    themeTokens.motion = {
      duration: {
        instant: "0ms",
        fast: "0ms",
        normal: "0ms",
        slow: "0ms",
        slower: "0ms",
      },
      easing: {
        ...tokens.motion.easing,
        spring: "linear",
        bounce: "linear",
      },
    };
  }

  return themeTokens;
}

// Export utility functions
export { tokens as defaultTokens };
