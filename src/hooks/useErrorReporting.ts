// frontend/src/hooks/useErrorReporting.ts
"use client";

import { useCallback } from "react";

interface ErrorReportingConfig {
  environment: string;
  userId?: string;
  sessionId?: string;
}

export function useErrorReporting(config: ErrorReportingConfig) {
  const reportError = useCallback(
    (
      error: Error,
      errorInfo: React.ErrorInfo,
      context?: Record<string, any>
    ) => {
      const errorReport = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== "undefined" ? navigator.userAgent : null,
          url: typeof window !== "undefined" ? window.location.href : null,
          userId: config.userId,
          sessionId: config.sessionId,
          environment: config.environment,
        },
      };

      // Multiple reporting strategies
      if (config.environment === "production") {
        // Application Insights
        if (
          typeof window !== "undefined" &&
          (window as any).applicationInsights
        ) {
          (window as any).applicationInsights.trackException({
            error,
            properties: errorReport.context,
          });
        }

        // Custom API endpoint
        fetch("/api/errors", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorReport),
        }).catch((fetchError) => {
          console.error("Failed to report error:", fetchError);
        });

        // Local storage fallback for offline scenarios
        try {
          if (typeof window !== "undefined") {
            const existingErrors = JSON.parse(
              localStorage.getItem("pendingErrors") || "[]"
            );
            existingErrors.push(errorReport);
            localStorage.setItem(
              "pendingErrors",
              JSON.stringify(existingErrors)
            );
          }
        } catch (storageError) {
          console.error("Failed to store error locally:", storageError);
        }
      } else {
        // Development logging
        console.group("🚨 Error Boundary Triggered");
        console.error("Error:", error);
        console.error("Component Stack:", errorInfo.componentStack);
        console.error("Context:", errorReport.context);
        console.groupEnd();
      }
    },
    [config]
  );

  return { reportError };
}
