// frontend/src/app/(dashboard)/contracts/page.tsx
"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import {
  Contract,
  ContractFilters,
  Filial,
  FilialDisplay,
} from "@/lib/types/contract";
import { useAuth } from "@/lib/auth/hooks";
import { PageHeader } from "@/components/layout/Pageheader";
import { ContractTable } from "@/components/contracts/ContractTable";
import { ContractFilters as ContractFiltersComponent } from "@/components/contracts/ContractFilters";
import { Button } from "@/components/ui/Button";
import {
  RefreshButton,
  CreateButton,
  ExportButton,
} from "@/components/ui/ButtonPatterns";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Download,
  RefreshCw,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  Building,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

export default function ContractsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // Estado dos filtros
  const [filters, setFilters] = useState<ContractFilters>({
    page: 1,
    pageSize: 10,
    contratante: "",
    dataInicio: undefined,
    dataFim: undefined,
    categoriaContrato: undefined,
    filial: undefined,
  });

  // Estado da UI
  const [isExporting, setIsExporting] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<number | null>(null);

  // Monitorar mudanças no estado contractToDelete
  useEffect(() => {
    console.log("🔴 contractToDelete changed to:", contractToDelete);
  }, [contractToDelete]);

  // Query para buscar contratos
  const {
    data: contractsResponse,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => contractsApi.getAll(filters, true),
    staleTime: 0, // Sempre considera stale para forçar refetch
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch a cada 30 segundos
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro 401 (não autorizado)
      if (error?.response?.status === 401) {
        console.error("❌ Erro de autenticação detectado:", error);
        router.push("/login");
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Query para estatísticas rápidas
  const { data: stats, error: statsError } = useQuery({
    queryKey: ["contracts-stats"],
    queryFn: () => contractsApi.getStatistics(),
    staleTime: 30000,
    refetchInterval: 60000,
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro 401 (não autorizado)
      if (error?.response?.status === 401) {
        console.error("❌ Erro de autenticação nas statistics:", error);
        router.push("/login");
        return false;
      }
      return failureCount < 3;
    },
  });

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("❌ Erro ao carregar contratos:", error);
    }
    if (statsError) {
      console.error("❌ Erro ao carregar statistics:", statsError);
    }
  }, [error, statsError]);

  // Mutation para deletar contrato
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      console.log("🔴 deleteMutation.mutationFn called with ID:", id);
      return contractsApi.delete(id);
    },
    onSuccess: () => {
      console.log("✅ deleteMutation.onSuccess called");
      toast.success("Contrato excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["contracts-statistics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      setContractToDelete(null);
    },
    onError: (error: any) => {
      console.error("❌ deleteMutation.onError called:", error);
      toast.error(
        error?.response?.data?.message ||
          "Erro ao excluir contrato. Tente novamente."
      );
    },
  });

  // Dados dos contratos
  const contracts = contractsResponse?.data || [];
  const totalPages = contractsResponse?.totalPages || 1;
  const totalItems = contractsResponse?.totalItems || 0;

  // Log para verificar ordenação
  useEffect(() => {
    if (contracts.length > 0) {
      console.log(
        "📅 Contratos ordenados por data:",
        contracts.map((c) => ({
          id: c.id,
          contrato: c.contrato,
          dataContrato: c.dataContrato,
          dataFormatada: new Date(c.dataContrato).toLocaleDateString("pt-BR"),
        }))
      );
    }
  }, [contracts]);

  // Estatísticas calculadas
  const quickStats = useMemo(() => {
    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.valorTotalContrato || 0);
    }, 0);

    const activeContracts = contracts.filter(
      (contract) => contract.status === 1
    ).length;

    const expiringContracts = contracts.filter((contract) => {
      const expiryDate = new Date(contract.dataContrato);
      expiryDate.setDate(expiryDate.getDate() + (contract.prazo || 365));
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return {
      total: contracts.length,
      active: activeContracts,
      expiring: expiringContracts,
      totalValue,
    };
  }, [contracts]);

  // Handlers
  const handleFilterChange = useCallback(
    (newFilters: Partial<ContractFilters>) => {
      console.log("📝 Filter change requested:", newFilters);
      setFilters((prev) => {
        const updatedFilters = {
          ...prev,
          ...newFilters,
          page: newFilters.page || 1,
        };
        console.log("📝 Updated filters:", updatedFilters);
        return updatedFilters;
      });
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleDeleteContract = useCallback(async (id: number) => {
    console.log("🔴 handleDeleteContract called with ID:", id);

    // Removida verificação de permissão - qualquer usuário autenticado pode deletar
    console.log("✅ Setting contractToDelete to:", id);
    setContractToDelete(id);
  }, []);

  const confirmDelete = useCallback(() => {
    console.log("🔴 confirmDelete called, contractToDelete:", contractToDelete);

    if (contractToDelete) {
      console.log(
        "✅ Calling deleteMutation.mutate with ID:",
        contractToDelete
      );
      deleteMutation.mutate(contractToDelete);
    } else {
      console.error("❌ contractToDelete is null or undefined");
    }
  }, [contractToDelete, deleteMutation]);

  const handleExport = useCallback(async () => {
    if (!hasPermission("contracts:export")) {
      toast.error("Você não tem permissão para exportar contratos");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Exportando contratos...");

    try {
      // Buscar todos os contratos para exportação
      const exportFilters = { ...filters, pageSize: 1000, page: 1 };
      const exportData = await contractsApi.getAll(exportFilters);

      // Preparar dados CSV
      const csvData = exportData.data.map((contract) => ({
        ID: contract.id,
        Contrato: contract.contrato,
        Contratante: contract.contratante,
        Contratada: contract.contratada,
        Objeto: contract.objeto,
        "Data do Contrato": new Date(contract.dataContrato).toLocaleDateString(
          "pt-BR"
        ),
        "Prazo (dias)": contract.prazo,
        "Valor Total": contract.valorTotalContrato
          ? formatCurrency(contract.valorTotalContrato)
          : "N/A",
        Categoria: contract.categoriaContrato,
        Filial: FilialDisplay[contract.filial]?.label || contract.filial,
        Status: contract.status === 1 ? "Ativo" : "Inativo",
      }));

      // Converter para CSV
      const csvContent = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `contratos_${new Date().toISOString().split("T")[0]}.csv`);

      toast.success("Exportação concluída!", { id: toastId });
    } catch (error) {
      console.error("Erro na exportação:", error);
      toast.error("Erro ao exportar contratos", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  }, [filters, hasPermission]);

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["contracts-stats"] });
  }, [refetch, queryClient]);

  // Renderização de erro
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contratos"
          description="Gerencie todos os contratos da empresa"
          actions={
            <Button onClick={handleRefresh} disabled={isRefetching}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          }
        />

        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erro ao carregar contratos
              </h3>
              <p className="text-gray-600 mb-4">
                {(error as any)?.message ||
                  "Ocorreu um erro ao carregar a lista de contratos."}
              </p>
              {(error as any)?.response?.data && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Detalhes do erro
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify((error as any).response.data, null, 2)}
                  </pre>
                </details>
              )}
              <Button onClick={handleRefresh} disabled={isRefetching}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <PageHeader
        title="Contratos"
        description="Gerencie todos os contratos da empresa"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contratos" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <RefreshButton
              onClick={handleRefresh}
              disabled={isRefetching}
              isRefreshing={isRefetching}
            />

            {hasPermission("contracts:export") && (
              <ExportButton
                onClick={handleExport}
                disabled={isExporting}
                isExporting={isExporting}
              />
            )}

            {hasPermission("contracts:create") && (
              <CreateButton
                onClick={() => router.push("/contracts/create")}
                text="Novo Contrato"
              />
            )}
          </div>
        }
      />

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total de Contratos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                quickStats.total.toLocaleString("pt-BR")
              )}
            </div>
            <p className="text-sm text-gray-600">
              {totalItems > quickStats.total &&
                `${totalItems} total no sistema`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Contratos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                quickStats.active.toLocaleString("pt-BR")
              )}
            </div>
            <p className="text-sm text-gray-600">Em vigência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vencendo em Breve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                quickStats.expiring.toLocaleString("pt-BR")
              )}
            </div>
            <p className="text-sm text-gray-600">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                formatCurrency(quickStats.totalValue)
              )}
            </div>
            <p className="text-sm text-gray-600">Valor total dos contratos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ContractFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        onExport={hasPermission("contracts:export") ? handleExport : undefined}
        isExporting={isExporting}
        totalItems={totalItems}
      />

      {/* Tabela de contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Contratos</span>
            {isLoading && <LoadingSpinner size="sm" text="" />}
          </CardTitle>
          <CardDescription>
            {totalItems > 0 ? (
              <>
                Mostrando{" "}
                {((filters.page || 1) - 1) * (filters.pageSize || 10) + 1} a{" "}
                {Math.min(
                  (filters.page || 1) * (filters.pageSize || 10),
                  totalItems
                )}{" "}
                de {totalItems} contratos
              </>
            ) : (
              "Nenhum contrato encontrado"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ContractTable
            contracts={contracts}
            isLoading={isLoading}
            totalPages={totalPages}
            currentPage={filters.page || 1}
            onPageChange={handlePageChange}
            onDelete={handleDeleteContract}
            pageSize={filters.pageSize}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={contractToDelete !== null}
        onOpenChange={() => {
          console.log(
            "🔴 AlertDialog onOpenChange called, contractToDelete:",
            contractToDelete
          );
          setContractToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contrato? Esta ação não pode
              ser desfeita e todos os dados associados serão permanentemente
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                console.log("🔴 Cancel button clicked");
                setContractToDelete(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                console.log("🔴 Confirm button clicked");
                confirmDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Excluindo...
                </>
              ) : (
                "Excluir Permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
