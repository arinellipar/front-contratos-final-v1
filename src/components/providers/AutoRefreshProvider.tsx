"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api/client";

export function AutoRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Inicializa o refresh automático quando há uma sessão ativa
    if (status === "authenticated" && session?.accessToken) {
      console.log("🚀 Iniciando refresh automático de tokens...");
      apiClient.startAutoRefresh();
    } else if (status === "unauthenticated") {
      console.log("🛑 Parando refresh automático (usuário não autenticado)");
      apiClient.stopAutoRefresh();
    }

    // Cleanup quando o componente é desmontado
    return () => {
      apiClient.stopAutoRefresh();
    };
  }, [session, status]);

  // Listener para eventos de atualização de tokens
  useEffect(() => {
    const handleTokensUpdated = () => {
      console.log("🔄 Tokens atualizados, reiniciando refresh automático...");
      apiClient.startAutoRefresh();
    };

    const handleTokensCleared = () => {
      console.log("🧹 Tokens limpos, parando refresh automático...");
      apiClient.stopAutoRefresh();
    };

    window.addEventListener("auth:tokens-updated", handleTokensUpdated);
    window.addEventListener("auth:tokens-cleared", handleTokensCleared);

    return () => {
      window.removeEventListener("auth:tokens-updated", handleTokensUpdated);
      window.removeEventListener("auth:tokens-cleared", handleTokensCleared);
    };
  }, []);

  return <>{children}</>;
} 