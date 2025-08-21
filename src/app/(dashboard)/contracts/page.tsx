// frontend/src/app/(dashboard)/contracts/page.tsx
"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { Contract, ContractFilters } from "@/lib/types/contract";

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
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
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
  BarChart3,
  Clock,
  Shield,
  Users,
  Target,
  Activity,
  Briefcase,
  FileCheck,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatters";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

// Modern 2025 animation variants for enterprise consulting
const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function ContractsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Debug QueryClient
  console.log("🔗 QueryClient disponível:", !!queryClient);

  // Estados para UI moderna - modo fixo em table para visualização padrão
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Estado dos filtros
  const [filters, setFilters] = useState<ContractFilters>({
    page: 1,
    pageSize: 10,
    contratante: "",
    dataInicio: undefined,
    dataFim: undefined,
    categoriaContrato: undefined,
    filial: "",
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
    isFetching,
    status,
    fetchStatus,
  } = useQuery({
    queryKey: ["contracts", filters],
    queryFn: () => {
      console.log(
        "🚀 Executando queryFn para buscar contratos com filtros:",
        filters
      );
      return contractsApi.getAll(filters, true);
    },
    enabled: true, // Forçar execução
    staleTime: 0, // Sempre considera stale para forçar refetch
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Reabilitar refetch automático
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true, // Forçar refetch no mount
    refetchOnReconnect: true, // Refetch quando reconectar
  });

  // Query para estatísticas rápidas
  const { data: stats } = useQuery({
    queryKey: ["contracts-stats"],
    queryFn: () => contractsApi.getStatistics(),
    staleTime: 30000,
    refetchInterval: 60000,
  });

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

  // Debug apenas em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Contracts Page:", {
      contracts: contracts.length,
      isLoading,
      totalItems,
      error: error?.message || error,
    });
  }

  // Log detalhado do erro se existir
  if (error) {
    console.error("🚨 Erro detalhado na query de contratos:", error);
  }

  // Debug useEffect para monitorar estado da query
  useEffect(() => {
    console.log("🔄 Estado da query mudou:", {
      isLoading,
      error: error?.message,
      contractsLength: contracts.length,
      hasResponse: !!contractsResponse,
      filters,
    });
  }, [isLoading, error, contracts.length, contractsResponse, filters]);

  // Forçar execução da query no mount para garantir dados atualizados
  useEffect(() => {
    refetch();
  }, []); // Executar apenas uma vez no mount

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
      return sum + (contract.multa || 0);
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
        "Valor da Multa": contract.multa
          ? formatCurrency(contract.multa)
          : "N/A",
        Categoria: contract.categoriaContrato,
        Filial: contract.filial,
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
  }, [filters]);

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
    <motion.div
      ref={containerRef}
      variants={pageVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-navy-50/30"
    >
      <div className="relative">
        {/* Sophisticated background pattern */}
        <div className="absolute inset-0 bg-grid-navy-100/20 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-gradient-to-br from-navy-100/30 to-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-navy-200/20 rounded-full blur-3xl" />

        <div className="relative space-y-8 p-6 pl-6 md:pl-12 lg:pl-16 max-w-7xl mx-auto">
          {/* Modern Executive Header */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism-strong rounded-3xl p-8 border border-navy-100/50 shadow-xl"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Briefcase className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-4xl font-bold bg-gradient-to-r from-navy-900 to-navy-700 bg-clip-text text-transparent"
                    >
                      Gestão de Contratos
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg text-navy-600 font-medium"
                    >
                      Consultoria Tributária Empresarial • 2025
                    </motion.p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-6 text-sm"
                >
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Shield className="w-4 h-4" />
                    <span>Compliance Tributário</span>
                  </div>
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Users className="w-4 h-4" />
                    <span>Gestão Corporativa</span>
                  </div>
                  <div className="flex items-center space-x-2 text-navy-600">
                    <Target className="w-4 h-4" />
                    <span>Otimização Fiscal</span>
                  </div>
                </motion.div>
              </div>

              {/* Modern Action Buttons */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleRefresh}
                    disabled={isRefetching}
                    variant="ghost"
                    className="bg-white/60 hover:bg-white/80 border border-navy-200/50 text-navy-700 backdrop-blur-sm"
                  >
                    <RefreshCw
                      className={cn(
                        "w-4 h-4 mr-2",
                        isRefetching && "animate-spin"
                      )}
                    />
                    Atualizar
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="ghost"
                    className="bg-white/60 hover:bg-white/80 border border-navy-200/50 text-navy-700 backdrop-blur-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => router.push("/contracts/create")}
                    className="bg-gradient-to-r from-navy-700 to-navy-800 hover:from-navy-800 hover:to-navy-900 text-white shadow-lg border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Contrato
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Advanced Executive Statistics Dashboard */}
          <motion.div
            variants={cardVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Total Contracts Card */}
            <motion.div
              variants={statsVariants}
              whileHover="hover"
              className="glass-morphism-strong rounded-2xl p-6 border border-navy-100/50 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 transition-all duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-8 h-8 border-2 border-blue-200/30 rounded-full border-t-blue-500/60"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-navy-700 uppercase tracking-wider">
                    Total de Contratos
                  </h3>
                  <div className="text-3xl font-bold text-navy-900">
                    {isLoading ? (
                      <div className="h-8 bg-gradient-to-r from-navy-200 to-navy-300 rounded-lg animate-pulse"></div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {quickStats.total.toLocaleString("pt-BR")}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600 font-medium">
                    {totalItems > quickStats.total ? (
                      <>
                        <span className="text-blue-600 font-semibold">
                          {totalItems.toLocaleString("pt-BR")}
                        </span>{" "}
                        total no sistema
                      </>
                    ) : (
                      "Atualizado em tempo real"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Active Contracts Card */}
            <motion.div
              variants={statsVariants}
              whileHover="hover"
              className="glass-morphism-strong rounded-2xl p-6 border border-navy-100/50 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/5 group-hover:from-emerald-500/10 group-hover:to-green-600/10 transition-all duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-200 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-600 font-semibold">
                      ATIVO
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-navy-700 uppercase tracking-wider">
                    Contratos Ativos
                  </h3>
                  <div className="text-3xl font-bold text-emerald-700">
                    {isLoading ? (
                      <div className="h-8 bg-gradient-to-r from-emerald-200 to-green-300 rounded-lg animate-pulse"></div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.1,
                        }}
                      >
                        {quickStats.active.toLocaleString("pt-BR")}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600 font-medium">
                    Em vigência e compliance
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Expiring Soon Card */}
            <motion.div
              variants={statsVariants}
              whileHover="hover"
              className="glass-morphism-strong rounded-2xl p-6 border border-navy-100/50 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5 group-hover:from-amber-500/10 group-hover:to-orange-600/10 transition-all duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-200 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-700" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-3 h-3 bg-amber-500 rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-navy-700 uppercase tracking-wider">
                    Vencimento Próximo
                  </h3>
                  <div className="text-3xl font-bold text-amber-700">
                    {isLoading ? (
                      <div className="h-8 bg-gradient-to-r from-amber-200 to-orange-300 rounded-lg animate-pulse"></div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.2,
                        }}
                      >
                        {quickStats.expiring.toLocaleString("pt-BR")}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600 font-medium">
                    Próximos 30 dias • Ação requerida
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Value Card */}
            <motion.div
              variants={statsVariants}
              whileHover="hover"
              className="glass-morphism-strong rounded-2xl p-6 border border-navy-100/50 shadow-lg relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-navy-500/5 to-blue-600/5 group-hover:from-navy-500/10 group-hover:to-blue-600/10 transition-all duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-navy-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-navy-700" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4 text-navy-600" />
                    <span className="text-xs text-navy-600 font-semibold">
                      TOTAL
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-navy-700 uppercase tracking-wider">
                    Valor Patrimonial
                  </h3>
                  <div className="text-3xl font-bold text-navy-800">
                    {isLoading ? (
                      <div className="h-8 bg-gradient-to-r from-navy-200 to-blue-300 rounded-lg animate-pulse"></div>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                          delay: 0.3,
                        }}
                      >
                        {formatCurrency(quickStats.totalValue)}
                      </motion.span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600 font-medium">
                    Soma das cláusulas penais
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Modern Filters Section */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism-strong rounded-2xl border border-navy-100/50 shadow-lg overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-navy-50/50 to-transparent border-b border-navy-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-700 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">
                      Filtros Avançados
                    </h3>
                    <p className="text-sm text-navy-600">
                      Refine sua busca por contratos
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-navy-200/50 rounded-full border-t-navy-600"
                />
              </div>
            </div>
            <div className="p-6">
              <ContractFiltersComponent
                filters={filters}
                onFilterChange={handleFilterChange}
                onExport={handleExport}
                isExporting={isExporting}
                totalItems={totalItems}
              />
            </div>
          </motion.div>

          {/* Enhanced Contracts Table */}
          <motion.div
            variants={cardVariants}
            className="glass-morphism-strong rounded-2xl border border-navy-100/50 shadow-xl overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-r from-navy-50/50 to-transparent border-b border-navy-100/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-700 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">
                        Portfólio de Contratos
                        {isLoading && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="inline-block ml-3 w-5 h-5 border-2 border-navy-300 border-t-navy-700 rounded-full"
                          />
                        )}
                      </h3>
                      <p className="text-sm text-navy-600 font-medium">
                        {totalItems > 0 ? (
                          <>
                            Exibindo{" "}
                            <span className="font-bold text-navy-800">
                              {((filters.page || 1) - 1) *
                                (filters.pageSize || 10) +
                                1}
                            </span>{" "}
                            a{" "}
                            <span className="font-bold text-navy-800">
                              {Math.min(
                                (filters.page || 1) * (filters.pageSize || 10),
                                totalItems
                              )}
                            </span>{" "}
                            de{" "}
                            <span className="font-bold text-navy-800">
                              {totalItems.toLocaleString("pt-BR")}
                            </span>{" "}
                            contratos
                          </>
                        ) : (
                          "Nenhum contrato encontrado com os filtros aplicados"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Enhanced gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-25/10 pointer-events-none" />

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
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Deletion Confirmation Dialog */}
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
        <AlertDialogContent className="glass-morphism-strong border border-navy-100/50 shadow-2xl max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <AlertDialogHeader className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-700" />
                </div>
                <div>
                  <AlertDialogTitle className="text-xl font-bold text-navy-900">
                    Confirmar Exclusão
                  </AlertDialogTitle>
                  <p className="text-sm text-navy-600 mt-1">
                    Ação irreversível de remoção
                  </p>
                </div>
              </div>
              <AlertDialogDescription className="text-navy-700 leading-relaxed bg-navy-25 p-4 rounded-xl border border-navy-100/50">
                <strong className="block mb-2 text-navy-900">
                  ⚠️ Atenção:
                </strong>
                Esta ação removerá permanentemente o contrato e todos os dados
                associados. Esta operação não pode ser desfeita e pode impactar
                relatórios e históricos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3 pt-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <AlertDialogCancel
                  onClick={() => {
                    console.log("🔴 Cancel button clicked");
                    setContractToDelete(null);
                  }}
                  className="w-full bg-white hover:bg-navy-50 text-navy-700 border-navy-200 font-semibold"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Cancelar e Manter
                </AlertDialogCancel>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <AlertDialogAction
                  onClick={() => {
                    console.log("🔴 Confirm button clicked");
                    confirmDelete();
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                      />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir Permanentemente
                    </>
                  )}
                </AlertDialogAction>
              </motion.div>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
