import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardOptimizedProps {
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

export const MetricCardOptimized: React.FC<MetricCardOptimizedProps> =
  React.memo(
    ({
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
      const length = valueString.length;

      // Lógica otimizada para diferentes tipos de valores - memoizada
      const { fontSize, clampMin, clampMax, clampValue } = React.useMemo(() => {
        let fontSize = baseFontSize;
        let clampMin = "0.6rem";
        let clampMax = "2rem";
        let clampValue = "1.2vw";

        // Casos específicos para valores conhecidos
        if (valueString.includes("%")) {
          // Para todas as porcentagens, usar o mesmo tamanho do valor monetário
          fontSize = "text-xl";
          clampMin = "0.6rem";
          clampMax = "1.5rem";
          clampValue = "1vw";
        } else if (valueString.includes("R$") && length > 10) {
          // Para valores monetários longos
          fontSize = "text-xl";
          clampMin = "0.6rem";
          clampMax = "1.5rem";
          clampValue = "1vw";
        } else if (length > 12) {
          // Para textos muito longos
          fontSize = baseFontSize.replace(/\d+/, (match) => {
            const num = parseInt(match);
            return Math.max(1, num - 3).toString();
          });
          clampMin = "0.5rem";
          clampMax = "1.25rem";
          clampValue = "0.8vw";
        } else if (length > 8) {
          // Para textos médios-longos
          fontSize = baseFontSize.replace(/\d+/, (match) => {
            const num = parseInt(match);
            return Math.max(1, num - 1).toString();
          });
          clampMin = "0.6rem";
          clampMax = "1.75rem";
          clampValue = "1vw";
        } else {
          // Para textos curtos, usar tamanho maior
          clampMin = "0.7rem";
          clampMax = "2.25rem";
          clampValue = "1.4vw";
        }

        return { fontSize, clampMin, clampMax, clampValue };
      }, [valueString, length, baseFontSize]);

      return (
        <div
          className={cn(
            "bg-white/10 backdrop-blur rounded-xl p-5 hover:bg-white/15 transition-all duration-300 min-w-0 h-full flex flex-col",
            className
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2 rounded-lg flex-shrink-0", iconBgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <h4 className="font-semibold text-sm">{title}</h4>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p
              className={cn(
                fontSize,
                "font-bold mb-2 leading-tight break-words"
              )}
              style={{
                fontSize: `clamp(${clampMin}, ${clampValue}, ${clampMax})`,
              }}
            >
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
          </div>

          {subtitle && (
            <p className="text-xs opacity-90 break-words mt-auto">{subtitle}</p>
          )}
        </div>
      );
    }
  );
