import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardCSSProps {
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

export const MetricCardCSS: React.FC<MetricCardCSSProps> = ({
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

  // Determinar o tamanho baseado no comprimento do texto
  let fontSize = baseFontSize;
  if (valueString.includes("%")) {
    // Para todas as porcentagens, usar tamanho consistente
    fontSize = "text-xl";
  } else if (length > 12) {
    // Para textos muito longos, reduzir mais agressivamente
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 4).toString();
    });
  } else if (length > 8) {
    // Para textos médios-longos, reduzir moderadamente
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 2).toString();
    });
  } else if (length > 5) {
    // Para textos médios, reduzir levemente
    fontSize = baseFontSize.replace(/\d+/, (match) => {
      const num = parseInt(match);
      return Math.max(1, num - 1).toString();
    });
  }
  // Para textos curtos (≤5), manter o tamanho original

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
          className={cn(fontSize, "font-bold mb-2 leading-tight break-words")}
          style={{
            fontSize: `clamp(0.6rem, ${Math.max(0.4, 1.2 - length * 0.08)}vw, ${fontSize.includes("3xl") ? "2rem" : fontSize.includes("2xl") ? "1.75rem" : "1.5rem"})`,
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

      {subtitle && <p className="text-xs opacity-90 break-words mt-auto">{subtitle}</p>}
    </div>
  );
};
