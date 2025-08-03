import React from "react";
import { useResponsiveText } from "@/hooks/useResponsiveText";
import { cn } from "@/lib/utils";

interface ResponsiveTextProps {
  children: string | number;
  baseFontSize?: string;
  className?: string;
  containerClassName?: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  baseFontSize = "text-3xl",
  className,
  containerClassName,
  as: Component = "p",
}) => {
  const valueString =
    typeof children === "number" ? children.toString() : children;
  const { fontSize, textRef, containerRef } = useResponsiveText(valueString, {
    baseSize: baseFontSize,
  });

  return (
    <div ref={containerRef} className={cn("w-full", containerClassName)}>
      <Component
        ref={textRef}
        className={cn(fontSize, "font-bold leading-tight", className)}
      >
        {children}
      </Component>
    </div>
  );
};
