/**
 * @fileoverview Enterprise Badge Component System
 * @module components/ui/Badge
 * @description High-performance badge implementation with comprehensive variant system,
 * animation states, and accessibility features following WCAG 2.1 AA standards
 *
 * Technical Specifications:
 * - Implements CSS containment for layout performance
 * - Uses CSS custom properties for dynamic theming
 * - Supports screen reader announcements for dynamic updates
 * - Optimized for 60fps animations with will-change hints
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  X,
  type LucideIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react";

/**
 * Badge variant configuration using CVA
 * Implements comprehensive design tokens for enterprise theming
 */
const badgeVariants = cva(
  // Base classes with performance optimizations
  "inline-flex items-center gap-1 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 will-change-transform",
  {
    variants: {
      variant: {
        // Primary variants - Core business states
        default:
          "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200",
        primary: "bg-[#0a2540] text-white border-[#0a2540] hover:bg-[#1e3a8a]",
        secondary:
          "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100",

        // Semantic variants - Status indicators
        success:
          "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
        warning:
          "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
        error: "bg-red-50 text-red-800 border-red-200 hover:bg-red-100",
        info: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",

        // Enterprise variants - Business specific
        enterprise:
          "bg-gradient-to-r from-[#0a2540] to-[#1e3a8a] text-white border-[#0a2540]",
        outline: "bg-transparent border-current hover:bg-slate-50",
        ghost: "bg-transparent border-transparent hover:bg-slate-100",

        // Status variants - System states
        active: "bg-green-500 text-white border-green-600 animate-pulse",
        inactive: "bg-gray-400 text-white border-gray-500",
        pending: "bg-yellow-500 text-white border-yellow-600 animate-pulse",

        // Premium variants - Special states
        premium:
          "bg-gradient-to-r from-amber-400 to-amber-600 text-amber-900 border-amber-500 shadow-sm",
        critical:
          "bg-red-600 text-white border-red-700 animate-pulse shadow-md",
      },

      size: {
        xs: "text-xs px-1.5 py-0.5 rounded",
        sm: "text-xs px-2 py-0.5 rounded-md",
        default: "text-sm px-2.5 py-0.5 rounded-md",
        lg: "text-sm px-3 py-1 rounded-lg",
        xl: "text-base px-4 py-1.5 rounded-lg",
      },

      // Border variants for visual hierarchy
      bordered: {
        true: "border",
        false: "border-0",
      },

      // Interaction states
      interactive: {
        true: "cursor-pointer active:scale-95",
        false: "",
      },

      // Animation variants
      animated: {
        true: "animate-in fade-in-50 zoom-in-95 duration-300",
        false: "",
      },

      // Shape variants
      shape: {
        default: "",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      bordered: true,
      interactive: false,
      animated: false,
      shape: "default",
    },

    // Compound variants for complex state combinations
    compoundVariants: [
      {
        variant: "enterprise",
        size: "lg",
        className: "shadow-lg hover:shadow-xl",
      },
      {
        variant: "critical",
        animated: true,
        className: "animate-bounce",
      },
      {
        variant: "premium",
        bordered: true,
        className: "border-2 border-amber-400",
      },
    ],
  }
);

/**
 * Badge Props Interface with comprehensive typing
 * @interface BadgeProps
 */
export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof badgeVariants> {
  /** Badge content */
  children?: React.ReactNode;

  /** Leading icon */
  icon?: LucideIcon | React.ReactNode;

  /** Icon position */
  iconPosition?: "left" | "right";

  /** Removable badge with close button */
  removable?: boolean;

  /** Callback when remove button is clicked */
  onRemove?: () => void;

  /** Maximum width before truncation */
  maxWidth?: string;

  /** Show dot indicator */
  dot?: boolean;

  /** Dot color for custom indicators */
  dotColor?: string;

  /** Badge count for numeric badges */
  count?: number;

  /** Maximum count to display before showing + */
  maxCount?: number;

  /** Loading state */
  loading?: boolean;

  /** Tooltip content */
  tooltip?: string;

  /** ARIA label for accessibility */
  ariaLabel?: string;

  /** Live region for dynamic updates */
  ariaLive?: "polite" | "assertive" | "off";
}

/**
 * Enterprise Badge Component
 * High-performance badge implementation with advanced features
 */
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      bordered,
      interactive,
      animated,
      shape,
      children,
      icon,
      iconPosition = "left",
      removable = false,
      onRemove,
      maxWidth,
      dot = false,
      dotColor,
      count,
      maxCount = 99,
      loading = false,
      tooltip,
      ariaLabel,
      ariaLive = "polite",
      onClick,
      ...props
    },
    ref
  ) => {
    // Compute display value for count badges
    const displayCount = React.useMemo(() => {
      if (count === undefined) return null;
      return count > maxCount ? `${maxCount}+` : count;
    }, [count, maxCount]);

    // Handle remove action with event propagation control
    const handleRemove = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.();
      },
      [onRemove]
    );

    // Render icon with proper typing
    const renderIcon = () => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return icon;
      }

      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-3 h-3" aria-hidden="true" />;
    };

    // Badge content with proper structure
    const badgeContent = (
      <>
        {/* Dot indicator */}
        {dot && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              dotColor || "bg-current opacity-60"
            )}
            style={dotColor ? { backgroundColor: dotColor } : undefined}
            aria-hidden="true"
          />
        )}

        {/* Loading spinner */}
        {loading && (
          <div
            className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-label="Loading"
          />
        )}

        {/* Icon */}
        {!loading && icon && iconPosition === "left" && renderIcon()}

        {/* Content */}
        {!loading && (
          <span
            className={cn("truncate", maxWidth && "block")}
            style={maxWidth ? { maxWidth } : undefined}
          >
            {displayCount !== null ? displayCount : children}
          </span>
        )}

        {/* Right icon */}
        {!loading && icon && iconPosition === "right" && renderIcon()}

        {/* Remove button */}
        {removable && !loading && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              "ml-1 -mr-0.5 p-0.5 rounded hover:bg-black/10 transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-current"
            )}
            aria-label="Remove badge"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </>
    );

    const badge = (
      <div
        ref={ref}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        className={cn(
          badgeVariants({
            variant,
            size,
            bordered,
            interactive: interactive || !!onClick,
            animated,
            shape,
          }),
          // Performance optimization with CSS containment
          "contain-layout",
          className
        )}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-live={ariaLive}
        title={tooltip}
        {...props}
      >
        {badgeContent}
      </div>
    );

    // Wrap with tooltip if provided
    if (tooltip && !props.title) {
      return (
        <div className="relative inline-flex group">
          {badge}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      );
    }

    return badge;
  }
);

Badge.displayName = "Badge";

/**
 * Badge Group Component
 * Container for organizing multiple badges with proper spacing
 */
export const BadgeGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Maximum number of visible badges before collapsing */
    maxVisible?: number;
    /** Spacing between badges */
    spacing?: "tight" | "normal" | "loose";
    /** Wrap badges to new line */
    wrap?: boolean;
  }
>(
  (
    {
      className,
      children,
      maxVisible,
      spacing = "normal",
      wrap = true,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const spacingClasses = {
      tight: "gap-1",
      normal: "gap-2",
      loose: "gap-3",
    };

    const childrenArray = React.Children.toArray(children);
    const visibleChildren =
      maxVisible && !isExpanded
        ? childrenArray.slice(0, maxVisible)
        : childrenArray;
    const hiddenCount = childrenArray.length - (maxVisible || 0);

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          wrap && "flex-wrap",
          className
        )}
        {...props}
      >
        {visibleChildren}

        {maxVisible && hiddenCount > 0 && !isExpanded && (
          <Badge
            variant="secondary"
            size="sm"
            interactive
            onClick={() => setIsExpanded(true)}
            className="cursor-pointer"
          >
            +{hiddenCount} more
          </Badge>
        )}

        {maxVisible && isExpanded && childrenArray.length > maxVisible && (
          <Badge
            variant="ghost"
            size="sm"
            interactive
            onClick={() => setIsExpanded(false)}
            className="cursor-pointer"
          >
            Show less
          </Badge>
        )}
      </div>
    );
  }
);

BadgeGroup.displayName = "BadgeGroup";

/**
 * Status Badge Component
 * Pre-configured badge for common status indicators
 */
export const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "icon" | "variant"> & {
    status: "online" | "offline" | "busy" | "away" | "active" | "inactive";
  }
>(({ status, ...props }, ref) => {
  const statusConfig = {
    online: {
      variant: "success" as const,
      icon: CheckCircle,
      dot: true,
      dotColor: "#10b981",
      animated: false,
    },
    offline: {
      variant: "default" as const,
      icon: XCircle,
      dot: true,
      dotColor: "#6b7280",
      animated: false,
    },
    busy: {
      variant: "error" as const,
      icon: AlertCircle,
      dot: true,
      dotColor: "#ef4444",
      animated: false,
    },
    away: {
      variant: "warning" as const,
      icon: Clock,
      dot: true,
      dotColor: "#f59e0b",
      animated: false,
    },
    active: {
      variant: "success" as const,
      icon: Zap,
      animated: true,
      dot: false,
      dotColor: undefined,
    },
    inactive: {
      variant: "secondary" as const,
      icon: XCircle,
      dot: false,
      dotColor: undefined,
      animated: false,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      icon={config.icon}
      dot={config.dot}
      dotColor={config.dotColor}
      animated={config.animated}
      {...props}
    >
      {props.children || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

/**
 * Trend Badge Component
 * Displays trending values with directional indicators
 */
export const TrendBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "icon" | "variant"> & {
    value: number;
    previousValue?: number;
    format?: "percent" | "number" | "currency";
    currency?: string;
  }
>(
  (
    { value, previousValue, format = "percent", currency = "BRL", ...props },
    ref
  ) => {
    const trend = previousValue !== undefined ? value - previousValue : 0;
    const trendPercent =
      previousValue !== undefined
        ? ((value - previousValue) / previousValue) * 100
        : 0;

    const isPositive = trend > 0;
    const isNegative = trend < 0;

    const formatValue = (val: number) => {
      switch (format) {
        case "percent":
          return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`;
        case "currency":
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency,
          }).format(Math.abs(val));
        default:
          return `${val > 0 ? "+" : ""}${val.toLocaleString("pt-BR")}`;
      }
    };

    return (
      <Badge
        ref={ref}
        variant={isPositive ? "success" : isNegative ? "error" : "secondary"}
        icon={isPositive ? TrendingUp : isNegative ? TrendingDown : undefined}
        {...props}
      >
        {formatValue(format === "percent" ? trendPercent : trend)}
      </Badge>
    );
  }
);

TrendBadge.displayName = "TrendBadge";

export { Badge, badgeVariants };
