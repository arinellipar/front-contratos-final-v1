/**
 * @fileoverview Enterprise Card Component System
 * @module components/ui/card
 * @description Sophisticated card implementation with multiple compositional elements
 * adhering to Fradema's professional design standards
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card variant configuration for enterprise styling
 * Implements shadow depth, border treatments, and interactive states
 */
const cardVariants = cva(
  "rounded-xl bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-slate-200 shadow-sm hover:shadow-md",
        elevated: "shadow-lg hover:shadow-xl border-0",
        flat: "border border-slate-200",
        outlined: "border-2 border-slate-300 shadow-none",
        enterprise:
          "border border-slate-200 shadow-enterprise hover:shadow-enterprise-lg bg-gradient-to-br from-white to-slate-50",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer active:scale-[0.99]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: false,
    },
  }
);

/**
 * Enhanced Card Props Interface
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Renders card as a specific HTML element */
  as?: React.ElementType;
  /** Gradient overlay for premium appearance */
  gradient?: boolean;
  /** Loading state with skeleton effect */
  loading?: boolean;
}

/**
 * Main Card Component
 * Container element with sophisticated styling options
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      as: Component = "div",
      gradient = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    const ElementComponent = Component as React.ComponentType<any>;

    return (
      <ElementComponent
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, interactive }),
          gradient &&
            "bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30",
          loading && "animate-pulse",
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        ) : (
          children
        )}
      </ElementComponent>
    );
  }
);
Card.displayName = "Card";

/**
 * Card Header Component
 * Structured header with support for actions and metadata
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    bordered?: boolean;
    compact?: boolean;
  }
>(({ className, bordered = false, compact = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5",
      !compact ? "p-6" : "px-6 py-4",
      bordered && "border-b border-slate-200",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Card Title Component
 * Semantic heading with professional typography
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    size?: "sm" | "default" | "lg" | "xl";
  }
>(({ className, as: Component = "h3", size = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-lg font-semibold",
    default: "text-xl font-bold",
    lg: "text-2xl font-bold",
    xl: "text-3xl font-bold",
  };

  return (
    <Component
      ref={ref}
      className={cn(
        "leading-none tracking-tight text-slate-900",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

/**
 * Card Description Component
 * Supplementary text with muted styling
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-600 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * Card Content Component
 * Main content area with consistent spacing
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean;
  }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(!noPadding && "p-6 pt-0", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

/**
 * Card Footer Component
 * Action area with alignment options
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    bordered?: boolean;
    align?: "start" | "center" | "end" | "between";
  }
>(({ className, bordered = false, align = "end", ...props }, ref) => {
  const alignmentClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center p-6 pt-0",
        alignmentClasses[align],
        bordered && "border-t border-slate-200 pt-6 mt-6",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

/**
 * Enterprise-specific Card Components
 */

/**
 * Metric Card Component
 * Displays key performance indicators with visual hierarchy
 */
export const MetricCard = React.forwardRef<
  HTMLDivElement,
  {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    className?: string;
  }
>(
  (
    { title, value, change, changeLabel, icon, loading = false, className },
    ref
  ) => {
    const isPositiveChange = change && change > 0;
    const isNegativeChange = change && change < 0;

    return (
      <Card
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        loading={loading}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>

              {change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isPositiveChange && "text-emerald-600",
                      isNegativeChange && "text-red-600",
                      !isPositiveChange && !isNegativeChange && "text-slate-600"
                    )}
                  >
                    {isPositiveChange && "+"}
                    {change}%
                  </span>
                  {changeLabel && (
                    <span className="text-sm text-slate-500">
                      {changeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {icon && (
              <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
MetricCard.displayName = "MetricCard";

/**
 * Info Card Component
 * Informational card with icon and structured content
 */
export const InfoCard = React.forwardRef<
  HTMLDivElement,
  {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    children?: React.ReactNode;
    variant?: "default" | "info" | "warning" | "error" | "success";
    className?: string;
  }
>(
  (
    { icon, title, description, children, variant = "default", className },
    ref
  ) => {
    const variantStyles = {
      default: "border-slate-200 bg-white",
      info: "border-blue-200 bg-blue-50",
      warning: "border-amber-200 bg-amber-50",
      error: "border-red-200 bg-red-50",
      success: "border-emerald-200 bg-emerald-50",
    };

    const iconColors = {
      default: "text-slate-600 bg-slate-100",
      info: "text-blue-600 bg-blue-100",
      warning: "text-amber-600 bg-amber-100",
      error: "text-red-600 bg-red-100",
      success: "text-emerald-600 bg-emerald-100",
    };

    return (
      <Card
        ref={ref}
        className={cn("border", variantStyles[variant], className)}
      >
        <CardContent className="p-6">
          <div className="flex gap-4">
            {icon && (
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  iconColors[variant]
                )}
              >
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {description && (
                <p className="text-sm text-slate-600 mt-1">{description}</p>
              )}
              {children && <div className="mt-3">{children}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
InfoCard.displayName = "InfoCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
