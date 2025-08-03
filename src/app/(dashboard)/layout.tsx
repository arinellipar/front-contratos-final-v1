// src/app/(dashboard)/layout.tsx
"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { DevLoginBanner } from "@/components/DevLoginBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(500 * 2 ** attemptIndex, 5000),
            staleTime: 0, // Sempre considera os dados como stale para forçar refetch
            gcTime: 2 * 60 * 1000, // 2 minutes - reduzido para liberar memória mais rápido
            refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
            refetchOnReconnect: true, // Refetch quando reconecta
          },
          mutations: {
            retry: 1,
            retryDelay: 500,
          },
        },
      })
  );

  // Set query client in API client for cache invalidation
  apiClient.setQueryClient(queryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}

/**
 * Componente de Layout Autenticado com Arquitetura Enterprise
 * Implementa posicionamento fixo do header e sidebar responsiva
 * com gerenciamento de estado centralizado e otimizações de performance
 */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading state com componente de alta performance
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">
              Sistema Fradema
            </h2>
            <p className="text-slate-600">Carregando interface...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Development Banner - Fixed Top Position */}
      <DevLoginBanner />

      {/*
        ARQUITETURA DE LAYOUT ENTERPRISE:
        - Header: Posição fixa no topo (z-index 40)
        - Sidebar: Posição fixa lateral (z-index 50)
        - Main: Container principal com padding dinâmico
      */}

      {/* Header Fixo Superior - Full Width */}
      <Header
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-0 left-0 right-0 z-40"
        fixed={true}
        showSearch={false}
      />

      {/* Sidebar com Z-Index Superior ao Header */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Container Principal com Padding Top para Header Fixo */}
      <div
        className={`
        transition-all duration-300 ease-in-out
        pt-16
        lg:pl-64
        ${sidebarOpen ? "lg:pl-64" : "lg:pl-16"}
      `}
      >
        {/* Main Content Area com Centralização Enterprise */}
        <main className="min-h-[calc(100vh-4rem)]">
          {/* Container Centralizado com Responsividade Otimizada */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="min-h-full">
              {/* Content Wrapper com Padding e Background Otimizado */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[calc(100vh-8rem)]">
                <div className="p-6 lg:p-8">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Overlay para Mobile quando Sidebar está Aberta */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
