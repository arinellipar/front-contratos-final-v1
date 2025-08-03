import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTextCSSProps {
  children: string | number;
  baseFontSize?: string;
  className?: string;
  containerClassName?: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const ResponsiveTextCSS: React.FC<ResponsiveTextCSSProps> = ({
  children,
  baseFontSize = "text-3xl",
  className,
  containerClassName,
  as: Component = "p",
}) => {
  const valueString =
    typeof children === "number" ? children.toString() : children;
  const length = valueString.length;

  // Determinar o tamanho baseado no comprimento do texto
  let fontSize = baseFontSize;
  if (length > 15) {
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 3).toString();
    });
  } else if (length > 10) {
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 2).toString();
    });
  } else if (length > 6) {
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 1).toString();
    });
  }

  return (
    <div className={cn("w-full", containerClassName)}>
      <Component
        className={cn(
          fontSize,
          "font-bold leading-tight break-words",
          className
        )}
        style={{
          fontSize: `clamp(0.75rem, ${Math.max(0.5, 1 - length * 0.05)}vw, ${fontSize.includes("3xl") ? "1.875rem" : fontSize.includes("2xl") ? "1.5rem" : "1.25rem"})`,
        }}
      >
        {children}
      </Component>
    </div>
  );
};
