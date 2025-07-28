// frontend/src/components/providers/ClientErrorBoundary.tsx
"use client";

import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ReactNode } from "react";

interface ClientErrorBoundaryProps {
  children: ReactNode;
}

export function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Telemetry logic encapsulada no Client Component
    if (process.env.NODE_ENV === "production") {
      console.error("Root Error Boundary:", error, errorInfo);

      // Application Insights integration
      if (
        typeof window !== "undefined" &&
        (window as any).applicationInsights
      ) {
        (window as any).applicationInsights.trackException({
          error,
          properties: {
            componentStack: errorInfo.componentStack,
            errorBoundary: "RootLayout",
            userId: null,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        });
      }

      // Sentry integration (alternativa)
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: {
            component: "ErrorBoundary",
            level: "error",
          },
          extra: {
            componentStack: errorInfo.componentStack,
          },
        });
      }
    }
  };

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
}
