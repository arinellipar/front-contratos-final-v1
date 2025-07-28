import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssForms from "@tailwindcss/forms";
import tailwindcssTypography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Modern Navy Blue Palette for 2025 Corporate Design
        navy: {
          25: "hsl(220, 70%, 99%)",
          50: "hsl(220, 70%, 98%)",
          100: "hsl(220, 60%, 95%)",
          200: "hsl(220, 50%, 88%)",
          300: "hsl(220, 45%, 78%)",
          400: "hsl(220, 40%, 65%)",
          500: "hsl(220, 50%, 50%)",
          600: "hsl(220, 70%, 35%)",
          700: "hsl(220, 80%, 25%)",
          800: "hsl(220, 85%, 16%)",
          900: "hsl(220, 90%, 12%)",
          950: "hsl(220, 90%, 8%)",
        },
        // Enhanced semantic colors for enterprise applications
        success: {
          50: "hsl(142, 76%, 96%)",
          100: "hsl(142, 85%, 91%)",
          500: "hsl(142, 71%, 45%)",
          600: "hsl(142, 76%, 36%)",
          700: "hsl(142, 72%, 29%)",
        },
        warning: {
          50: "hsl(48, 96%, 95%)",
          100: "hsl(48, 100%, 88%)",
          500: "hsl(45, 93%, 47%)",
          600: "hsl(43, 96%, 37%)",
          700: "hsl(42, 87%, 31%)",
        },
        error: {
          50: "hsl(0, 86%, 97%)",
          100: "hsl(0, 93%, 94%)",
          500: "hsl(0, 84%, 60%)",
          600: "hsl(0, 72%, 51%)",
          700: "hsl(0, 74%, 42%)",
        },
        info: {
          50: "hsl(214, 100%, 97%)",
          100: "hsl(214, 95%, 93%)",
          500: "hsl(217, 91%, 60%)",
          600: "hsl(221, 83%, 53%)",
          700: "hsl(224, 76%, 48%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Roboto Mono",
          "monospace",
        ],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "3.5rem" }],
        "6xl": ["3.75rem", { lineHeight: "4rem" }],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-down": "fade-in-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        "bounce-soft": "bounce-soft 2s infinite",
        float: "float 3s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(59, 130, 246, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)" },
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)",
        strong:
          "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-navy": "0 0 20px rgba(13, 22, 40, 0.15)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      zIndex: {
        60: "60",
        70: "70",
        80: "80",
        90: "90",
        100: "100",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
        800: "800ms",
        1200: "1200ms",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "ease-in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
        "ease-out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
        "ease-in-out-expo": "cubic-bezier(1, 0, 0, 1)",
        "ease-in-quart": "cubic-bezier(0.5, 0, 0.75, 0)",
        "ease-out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "ease-in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "hsl(var(--foreground))",
            h1: {
              color: "hsl(var(--foreground))",
              fontWeight: "800",
            },
            h2: {
              color: "hsl(var(--foreground))",
              fontWeight: "700",
            },
            h3: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            strong: {
              color: "hsl(var(--foreground))",
              fontWeight: "600",
            },
            code: {
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--muted))",
              padding: "0.25rem 0.375rem",
              borderRadius: "0.375rem",
              fontWeight: "500",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssForms({
      strategy: "class",
    }),
    tailwindcssTypography,
    // Custom plugin for enterprise utilities
    function ({ addUtilities, addComponents, theme }) {
      addUtilities({
        // Glass morphism utilities
        ".glass-morphism": {
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".glass-morphism-strong": {
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(24px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        },
        // Modern gradient utilities
        ".gradient-navy": {
          background: `linear-gradient(135deg, ${theme(
            "colors.navy.900"
          )}, ${theme("colors.navy.800")})`,
        },
        ".gradient-navy-light": {
          background: `linear-gradient(135deg, ${theme(
            "colors.navy.50"
          )}, ${theme("colors.navy.100")})`,
        },
        ".gradient-radial": {
          background: `radial-gradient(ellipse at center, ${theme(
            "colors.navy.50"
          )}, transparent)`,
        },
      });

      addComponents({
        // Modern button components
        ".btn-modern": {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.75rem",
          fontWeight: "600",
          fontSize: "0.875rem",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:focus": {
            outline: "none",
            ringWidth: "2px",
            ringColor: theme("colors.navy.500"),
            ringOpacity: "0.5",
            ringOffsetWidth: "2px",
          },
        },
        ".btn-modern-primary": {
          background: `linear-gradient(135deg, ${theme(
            "colors.navy.900"
          )}, ${theme("colors.navy.800")})`,
          color: theme("colors.white"),
          boxShadow: "0 4px 12px rgba(13, 22, 40, 0.25)",
          "&:hover": {
            background: `linear-gradient(135deg, ${theme(
              "colors.navy.800"
            )}, ${theme("colors.navy.700")})`,
            transform: "translateY(-1px)",
            boxShadow: "0 6px 16px rgba(13, 22, 40, 0.35)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        // Modern card components
        ".card-modern": {
          backgroundColor: theme("colors.white"),
          borderRadius: "1rem",
          border: `1px solid ${theme("colors.navy.100")}`,
          boxShadow:
            "0 4px 6px -1px rgba(13, 22, 40, 0.1), 0 2px 4px -1px rgba(13, 22, 40, 0.06)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            boxShadow:
              "0 20px 25px -5px rgba(13, 22, 40, 0.1), 0 10px 10px -5px rgba(13, 22, 40, 0.04)",
          },
        },
        ".card-elevated": {
          backgroundColor: theme("colors.white"),
          borderRadius: "1rem",
          border: "none",
          boxShadow:
            "0 20px 25px -5px rgba(13, 22, 40, 0.1), 0 10px 10px -5px rgba(13, 22, 40, 0.04)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 25px 50px -12px rgba(13, 22, 40, 0.15)",
          },
        },
      });
    },
  ],
};

export default config;
