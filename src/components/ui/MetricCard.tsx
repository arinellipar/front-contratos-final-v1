import React from "react";
import { LucideIcon } from "lucide-react";
import { useResponsiveText } from "@/hooks/useResponsiveText";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  progressValue?: number;
  progressColor?: string;
  className?: string;
  baseFontSize?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-300",
  iconBgColor = "bg-blue-500/20",
  progressValue,
  progressColor = "bg-blue-400",
  className,
  baseFontSize = "text-3xl",
}) => {
  const valueString = typeof value === "number" ? value.toString() : value;
  const { fontSize, textRef, containerRef } = useResponsiveText(valueString, {
    baseSize: baseFontSize,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "bg-white/10 backdrop-blur rounded-xl p-5 hover:bg-white/15 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", iconBgColor)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>

      <p ref={textRef} className={cn(fontSize, "font-bold mb-2 leading-tight")}>
        {value}
      </p>

      {progressValue !== undefined && (
        <div className="w-full bg-white/20 rounded-full h-2 mb-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-1000",
              progressColor
            )}
            style={{
              width: `${Math.min(progressValue, 100)}%`,
            }}
          />
        </div>
      )}

      {subtitle && <p className="text-xs opacity-90">{subtitle}</p>}
    </div>
  );
};
