// src/components/layout/PageHeader.tsx
"use client";

import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("bg-white border-b border-gray-200", className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-gray-500 hover:text-gray-700"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </Button>
              </li>

              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  {crumb.href && index < breadcrumbs.length - 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => (window.location.href = crumb.href!)}
                    >
                      {crumb.label}
                    </Button>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header content */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                {description}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="ml-4 flex-shrink-0 flex space-x-3">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
