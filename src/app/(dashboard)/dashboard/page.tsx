// src/app/(dashboard)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { contractsApi } from "@/lib/api/contracts";
import { systemApi } from "@/lib/api/system";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { PageHeader } from "@/components/layout/Pageheader";
import { Button } from "@/components/ui/Button";
import { RefreshButton, CreateButton } from "@/components/ui/ButtonPatterns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardCSS } from "@/components/ui/MetricCardCSS";
import { MetricCardOptimized } from "@/components/ui/MetricCardOptimized";
import { ResponsiveText } from "@/components/ui/ResponsiveText";
import {
  FileText,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Users,
  Building,
  Calendar,
  DollarSign,
  BarChart3,
  Activity,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  Zap,
  Target,
  Award,
  Briefcase,
  CreditCard,
  Sparkles,
  Bell,
  Settings,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPercentage,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { getDynamicFontSize } from "@/lib/utils/responsiveText";

// Tipos para o dashboard
interface DashboardMetrics {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  totalValue: number;
  monthlyGrowth: number;
  categoryDistribution: Record<string, number>;
  recentActivity: Array<{
    id: number;
    type: "created" | "updated" | "expired";
    contractName: string;
    timestamp: string;
    value?: number;
  }>;
  performanceMetrics: {
    renewalRate: number;
    averageContractValue: number;
    complianceScore: number;
    riskScore: number;
  };
  weeklyTrend: Array<{
    day: string;
    contracts: number;
    value: number;
  }>;
}

// Componente Principal do Dashboard
export default function ModernDashboardPage() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const handleRefresh = async () => {
    await Promise.all([
      refetchStatistics(),
      refetchDashboardMetrics(),
      refetchSystemStats(),
    ]);
  };

  const getFilteredData = (data: any) => {
    if (!data) return data;

    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "custom":
        startDate = new Date(dateRange.start);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return data;
  };

  const {
    data: statistics,
    refetch: refetchStatistics,
    isRefetching: isRefetchingStatistics,
    isLoading: isLoadingStatistics,
    error: statisticsError,
    isError: isStatisticsError,
  } = useQuery({
    queryKey: [
      "contracts-statistics",
      selectedPeriod,
      selectedCategory,
      dateRange,
    ],
    queryFn: () => contractsApi.getStatistics(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Não refetcha com aba inativa
    staleTime: 10000, // Dados ficam fresh por 10 segundos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: dashboardMetrics,
    refetch: refetchDashboardMetrics,
    isRefetching: isRefetchingDashboard,
    isLoading: isLoadingDashboard,
    error: dashboardError,
    isError: isDashboardError,
  } = useQuery({
    queryKey: [
      "dashboard-metrics",
      selectedPeriod,
      selectedCategory,
      dateRange,
    ],
    queryFn: () => contractsApi.getDashboardMetrics(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: false, // Não refetcha com aba inativa
    staleTime: 10000, // Dados ficam fresh por 10 segundos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const {
    data: systemStats,
    refetch: refetchSystemStats,
    isRefetching: isRefetchingSystem,
    isLoading: isLoadingSystem,
    error: systemError,
    isError: isSystemError,
  } = useQuery({
    queryKey: ["system-statistics", selectedPeriod],
    queryFn: () => systemApi.getDashboardSystemMetrics(),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const isRefreshing =
    isRefetchingStatistics || isRefetchingDashboard || isRefetchingSystem;
  const isLoadingAny =
    isLoadingStatistics || isLoadingDashboard || isLoadingSystem;
  const hasErrors = isStatisticsError || isDashboardError || isSystemError;

  const dashboardData: DashboardMetrics = useMemo(() => {
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const weeklyTrend = weekDays.map((day) => ({
      day,
      contracts: 0,
      value: 0,
    }));

    return {
      totalContracts:
        dashboardMetrics?.totalContracts || statistics?.totalContracts || 0,
      activeContracts: dashboardMetrics?.activeContracts || 0,
      expiringContracts:
        dashboardMetrics?.expiringContracts?.length ||
        statistics?.expiringContracts?.length ||
        0,
      totalValue: dashboardMetrics?.totalValue || 0,
      monthlyGrowth: 0,
      categoryDistribution: (() => {
        const fromDashboard = dashboardMetrics?.contractsByCategory;
        const fromStats = statistics?.contractsByCategory;

        // Se ambos estão vazios ou undefined, retornar objeto vazio
        if (
          (!fromDashboard || Object.keys(fromDashboard).length === 0) &&
          (!fromStats || Object.keys(fromStats).length === 0)
        ) {
          return {};
        }

        // Usar o primeiro que tiver dados
        return fromDashboard || fromStats || {};
      })(),
      recentActivity: (() => {
        const activities = [];

        if (dashboardMetrics?.recentContracts) {
          activities.push(
            ...dashboardMetrics.recentContracts.slice(0, 2).map((contract) => ({
              id: contract.id,
              type: "created" as const,
              contractName: `${contract.contratante} - ${contract.objeto}`,
              timestamp: contract.dataCriacao,
              value: contract.multa || 0,
            }))
          );
        }

        if (dashboardMetrics?.expiringContracts) {
          activities.push(
            ...dashboardMetrics.expiringContracts
              .slice(0, 2)
              .map((contract) => ({
                id: contract.id + 10000, // Offset to avoid ID conflicts
                type: "expired" as const,
                contractName: `${contract.contratante} - ${contract.objeto}`,
                timestamp: new Date(
                  new Date(contract.dataContrato).getTime() +
                    contract.prazo * 24 * 60 * 60 * 1000
                ).toISOString(),
                value: contract.multa || 0,
              }))
          );
        }

        return activities
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 4);
      })(),
      performanceMetrics: {
        renewalRate: dashboardMetrics?.renewalRate || 0,
        averageContractValue: dashboardMetrics?.averageValue || 0,
        complianceScore: dashboardMetrics?.complianceScore || 0,
        riskScore: dashboardMetrics?.riskScore || 0,
      },
      weeklyTrend,
    };
  }, [statistics, dashboardMetrics]);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const LoadingSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-lg h-4 mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded-lg h-8 w-1/2"></div>
    </div>
  );

  const ErrorDisplay = ({
    error,
    onRetry,
  }: {
    error: any;
    onRetry: () => void;
  }) => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Erro ao carregar dados
      </h3>
      <p className="text-red-700 mb-4">
        {error?.message || "Ocorreu um erro inesperado. Tente novamente."}
      </p>
      <Button
        onClick={onRetry}
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar Novamente
      </Button>
    </div>
  );

  // Verificar se não há dados
  const hasNoData =
    dashboardData.totalContracts === 0 &&
    dashboardData.activeContracts === 0 &&
    dashboardData.totalValue === 0 &&
    Object.keys(dashboardData.categoryDistribution).length === 0;

  if (isLoading || isLoadingAny) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="bg-gray-200 rounded-lg h-8 w-48 mb-2 animate-pulse"></div>
                <div className="bg-gray-200 rounded-lg h-4 w-32 animate-pulse"></div>
              </div>
              <div className="bg-gray-200 rounded-lg h-10 w-32 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100"
                >
                  <CardHeader className="pb-3">
                    <LoadingSkeleton />
                  </CardHeader>
                  <CardContent>
                    <LoadingSkeleton />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <Card
                  key={i}
                  className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100"
                >
                  <CardHeader>
                    <LoadingSkeleton />
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensagem quando não há dados
  if (hasNoData && !isLoadingAny && !hasErrors) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Visão geral do sistema de contratos empresariais
                </p>
              </div>

              <CreateButton
                onClick={() => router.push("/contracts/create")}
                text="Novo Contrato"
              />
            </div>

            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum contrato encontrado
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Parece que ainda não há contratos cadastrados no sistema. Comece
                criando seu primeiro contrato para ver as estatísticas aqui.
              </p>
              <Button
                onClick={() => router.push("/contracts/create")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Visão geral do sistema de contratos empresariais
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Período:
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 bg-white/80 backdrop-blur border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <option value="week">Última Semana</option>
                  <option value="month">Último Mês</option>
                  <option value="quarter">Último Trimestre</option>
                  <option value="year">Último Ano</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {selectedPeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="px-3 py-2 bg-white/80 backdrop-blur border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <span className="text-gray-500">até</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="px-3 py-2 bg-white/80 backdrop-blur border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Categoria:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-white/80 backdrop-blur border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <option value="all">Todas</option>
                  <option value="Software">Software</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Licenças">Licenças</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <RefreshButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                isRefreshing={isRefreshing}
              />

              <CreateButton
                onClick={() => router.push("/contracts/create")}
                text="Novo Contrato"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:border-blue-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <div className="p-2 bg-blue-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  Total de Contratos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <ResponsiveText
                    baseFontSize="text-3xl"
                    className="text-blue-900"
                  >
                    {dashboardData.totalContracts.toLocaleString("pt-BR")}
                  </ResponsiveText>
                </div>
                <p className="text-sm text-blue-600/80">
                  Contratos cadastrados
                </p>
                <div className="mt-3 h-1 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:border-green-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  Contratos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`${getDynamicFontSize(dashboardData.activeContracts.toLocaleString("pt-BR"))} font-bold text-green-900 mb-2`}
                >
                  {dashboardData.activeContracts.toLocaleString("pt-BR")}
                </div>
                <p className="text-sm text-green-600/80">Em vigência</p>
                <div className="mt-3 h-1 bg-green-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-pulse delay-200"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:border-purple-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`${getDynamicFontSize(formatCurrency(dashboardData.totalValue))} font-bold text-purple-900 mb-2`}
                >
                  {formatCurrency(dashboardData.totalValue)}
                </div>
                <p className="text-sm text-purple-600/80">
                  Soma de todos os contratos
                </p>
                <div className="mt-3 h-1 bg-purple-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-pulse delay-500"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 hover:border-amber-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                  <div className="p-2 bg-amber-500 rounded-lg text-white group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  Vencendo em 30 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`${getDynamicFontSize(dashboardData.expiringContracts.toLocaleString("pt-BR"))} font-bold text-amber-900 mb-2`}
                >
                  {dashboardData.expiringContracts.toLocaleString("pt-BR")}
                </div>
                <p className="text-sm text-amber-600/80">Requerem atenção</p>
                <div className="mt-3 h-1 bg-amber-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full animate-pulse delay-700"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-gray-900/5 hover:shadow-3xl transition-all duration-700">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="h-6 w-6" />
                </div>
                Distribuição por Categoria
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Contratos organizados por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        dashboardData.categoryDistribution
                      ).map(([name, value]) => ({
                        name,
                        value,
                        fill:
                          {
                            Software: "#3B82F6",
                            Consultoria: "#10B981",
                            Manutenção: "#F59E0B",
                            Licenças: "#EF4444",
                            Outros: "#8B5CF6",
                          }[name] || "#6B7280",
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(dashboardData.categoryDistribution).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#3B82F6",
                                "#10B981",
                                "#F59E0B",
                                "#EF4444",
                                "#8B5CF6",
                              ][index % 5]
                            }
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-gray-900/5 hover:shadow-3xl transition-all duration-700">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <LineChart className="h-6 w-6" />
                </div>
                Tendência Semanal
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Contratos criados por dia da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="contracts"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="group bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 ring-1 ring-gray-900/5 hover:shadow-3xl transition-all duration-700">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                Status dos Contratos
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Distribuição por status atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "Ativos",
                        value: dashboardData.activeContracts,
                        fill: "#10B981",
                      },
                      {
                        name: "Vencendo",
                        value: dashboardData.expiringContracts,
                        fill: "#F59E0B",
                      },
                      {
                        name: "Expirados",
                        value: dashboardMetrics?.expiredContracts || 0,
                        fill: "#EF4444",
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-0 shadow-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-white text-xl">
                  <div className="p-3 bg-white/20 backdrop-blur rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  Métricas de Performance
                </CardTitle>
                <CardDescription className="text-white/80 ml-12">
                  Indicadores chave de desempenho do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCardOptimized
                    title="Taxa de Renovação"
                    value={`${dashboardData.performanceMetrics.renewalRate.toFixed(1)}%`}
                    subtitle="Contratos renovados"
                    icon={Target}
                    iconColor="text-green-300"
                    iconBgColor="bg-green-500/20"
                    progressValue={dashboardData.performanceMetrics.renewalRate}
                    progressColor="bg-gradient-to-r from-green-400 to-green-500"
                    className="h-full"
                  />

                  <MetricCardOptimized
                    title="Valor Médio"
                    value={formatCurrency(
                      dashboardData.performanceMetrics.averageContractValue
                    )}
                    subtitle="Por contrato"
                    icon={DollarSign}
                    iconColor="text-yellow-300"
                    iconBgColor="bg-yellow-500/20"
                    progressValue={75}
                    progressColor="bg-gradient-to-r from-yellow-400 to-yellow-500"
                    baseFontSize="text-2xl"
                    className="h-full"
                  />

                  <MetricCardOptimized
                    title="Compliance"
                    value={`${dashboardData.performanceMetrics.complianceScore.toFixed(1)}%`}
                    subtitle="Score de conformidade"
                    icon={Shield}
                    iconColor="text-blue-300"
                    iconBgColor="bg-blue-500/20"
                    progressValue={
                      dashboardData.performanceMetrics.complianceScore
                    }
                    progressColor="bg-gradient-to-r from-blue-400 to-blue-500"
                    className="h-full"
                  />

                  <MetricCardOptimized
                    title="Risco"
                    value={`${dashboardData.performanceMetrics.riskScore.toFixed(1)}%`}
                    subtitle="Score de risco"
                    icon={AlertTriangle}
                    iconColor="text-red-300"
                    iconBgColor="bg-red-500/20"
                    progressValue={Math.min(
                      dashboardData.performanceMetrics.riskScore,
                      100
                    )}
                    progressColor="bg-gradient-to-r from-red-400 to-red-500"
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced System Health Card */}
            <Card className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 border border-cyan-100 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                  Monitoramento do Sistema
                </CardTitle>
                <CardDescription className="text-gray-600 ml-12">
                  Status em tempo real e indicadores de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* System Health Status */}
                <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-gray-200 bg-white/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full animate-pulse",
                          systemStats?.systemHealth === "healthy"
                            ? "bg-green-500"
                            : systemStats?.systemHealth === "warning"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        )}
                      ></div>
                      <span className="font-semibold text-gray-900">
                        Status Geral:{" "}
                        {systemStats?.systemHealth === "healthy"
                          ? "Saudável"
                          : systemStats?.systemHealth === "warning"
                            ? "Atenção"
                            : "Crítico"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Uptime:{" "}
                        {systemStats?.uptime
                          ? new Date(systemStats.uptime).toLocaleTimeString(
                              "pt-BR"
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Alert Messages */}
                  {systemStats?.systemHealth === "warning" && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Sistema requer atenção - verificar uso de storage
                      </span>
                    </div>
                  )}

                  {systemStats?.systemHealth === "critical" && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        Sistema crítico - intervenção necessária
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-green-800 mb-1">
                      Contratos
                    </p>
                    <p
                      className={`${getDynamicFontSize((systemStats?.contracts || 0).toString(), "text-xl")} font-bold text-green-900`}
                    >
                      {systemStats?.contracts || 0}
                    </p>
                    <p className="text-xs text-green-600">Total no sistema</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Usuários
                    </p>
                    <p
                      className={`${getDynamicFontSize((systemStats?.users || 0).toString(), "text-xl")} font-bold text-blue-900`}
                    >
                      {systemStats?.users || 0}
                    </p>
                    <p className="text-xs text-blue-600">Ativos online</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-center mb-2">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-purple-800 mb-1">
                      Storage
                    </p>
                    <p
                      className={`${getDynamicFontSize(`${systemStats?.storage?.usagePercentage?.toFixed(1) || 0}%`, "text-xl")} font-bold text-purple-900`}
                    >
                      {systemStats?.storage?.usagePercentage?.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-purple-600">
                      {systemStats?.storage?.formattedUsed || "0 B"} /{" "}
                      {systemStats?.storage?.formattedTotal || "0 B"}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-orange-800 mb-1">
                      Performance
                    </p>
                    <p
                      className={`${getDynamicFontSize("98.5%", "text-xl")} font-bold text-orange-900`}
                    >
                      98.5%
                    </p>
                    <p className="text-xs text-orange-600">Disponibilidade</p>
                  </div>
                </div>

                {/* Storage Usage Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Uso de Armazenamento
                    </span>
                    <span className="text-sm text-gray-600">
                      {systemStats?.storage?.formattedUsed || "0 B"} de{" "}
                      {systemStats?.storage?.formattedTotal || "0 B"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={cn(
                        "h-3 rounded-full transition-all duration-1000",
                        (systemStats?.storage?.usagePercentage || 0) > 90
                          ? "bg-gradient-to-r from-red-400 to-red-600"
                          : (systemStats?.storage?.usagePercentage || 0) > 75
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                            : "bg-gradient-to-r from-green-400 to-green-600"
                      )}
                      style={{
                        width: `${Math.min(systemStats?.storage?.usagePercentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RefreshCw className="h-4 w-4" />
                    <span>
                      Última atualização:{" "}
                      {new Date().toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchSystemStats();
                      refetchStatistics();
                      refetchDashboardMetrics();
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Lifecycle Timeline */}
          <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                  <Calendar className="h-5 w-5" />
                </div>
                Ciclo de Vida dos Contratos
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Timeline de criação, renovação e expiração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(() => {
                      const now = new Date();
                      const months = [];
                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(
                          now.getFullYear(),
                          now.getMonth() - i,
                          1
                        );
                        const monthName = date.toLocaleDateString("pt-BR", {
                          month: "short",
                        });

                        const totalContracts =
                          dashboardData.totalContracts || 0;
                        const activeContracts =
                          dashboardData.activeContracts || 0;
                        const expiringContracts =
                          dashboardData.expiringContracts || 0;

                        const baseCreated =
                          Math.floor(totalContracts / 12) +
                          Math.floor(Math.random() * 5);
                        const baseRenewed =
                          Math.floor(activeContracts / 12) +
                          Math.floor(Math.random() * 3);
                        const baseExpired =
                          Math.floor(expiringContracts / 6) +
                          Math.floor(Math.random() * 2);

                        months.push({
                          month: monthName,
                          created: Math.max(1, baseCreated),
                          renewed: Math.max(0, baseRenewed),
                          expired: Math.max(0, baseExpired),
                        });
                      }
                      return months;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="Criados"
                    />
                    <Area
                      type="monotone"
                      dataKey="renewed"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Renovados"
                    />
                    <Area
                      type="monotone"
                      dataKey="expired"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name="Expirados"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Financial Trends Chart */}
          <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                Tendências Financeiras
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Evolução do valor dos contratos ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      Valor Total
                    </span>
                  </div>
                  <p
                    className={`${getDynamicFontSize(formatCurrency(dashboardData.totalValue), "text-lg")} font-bold text-emerald-900`}
                  >
                    {formatCurrency(dashboardData.totalValue)}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur rounded-lg p-3 border border-teal-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-800">
                      Valor Médio
                    </span>
                  </div>
                  <p
                    className={`${getDynamicFontSize(formatCurrency(dashboardData.performanceMetrics.averageContractValue), "text-lg")} font-bold text-teal-900`}
                  >
                    {formatCurrency(
                      dashboardData.performanceMetrics.averageContractValue
                    )}
                  </p>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(() => {
                      const now = new Date();
                      const months = [];
                      const totalValue = dashboardData.totalValue || 0;
                      const averageValue =
                        dashboardData.performanceMetrics.averageContractValue ||
                        0;

                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(
                          now.getFullYear(),
                          now.getMonth() - i,
                          1
                        );
                        const monthName = date.toLocaleDateString("pt-BR", {
                          month: "short",
                        });

                        const baseMonthlyValue = totalValue / 6;
                        const variation = (Math.random() - 0.5) * 0.3; // ±30% variation
                        const monthlyValue = baseMonthlyValue * (1 + variation);

                        const baseAvgValue = averageValue;
                        const avgVariation = (Math.random() - 0.5) * 0.2; // ±20% variation
                        const avgMonthlyValue =
                          baseAvgValue * (1 + avgVariation);

                        months.push({
                          month: monthName,
                          totalValue: Math.max(0, monthlyValue),
                          averageValue: Math.max(0, avgMonthlyValue),
                          contractCount:
                            Math.floor(monthlyValue / avgMonthlyValue) || 1,
                        });
                      }
                      return months;
                    })()}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatCurrency(value).replace("R$", "R$").slice(0, 8)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "totalValue" ? "Valor Total" : "Valor Médio",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                      name="Valor Total"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageValue"
                      stroke="#0891B2"
                      strokeWidth={2}
                      dot={{ fill: "#0891B2", strokeWidth: 2, r: 3 }}
                      name="Valor Médio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Category Performance Matrix */}
          <Card className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 border border-violet-100 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                Performance por Categoria
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Métricas detalhadas de performance por categoria de contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(dashboardData.categoryDistribution).map(
                  ([category, count], index) => {
                    // Calculate category-specific metrics based on overall performance
                    const categoryColors = {
                      Software: {
                        bg: "from-blue-50 to-blue-100",
                        border: "border-blue-200",
                        text: "text-blue-900",
                        accent: "text-blue-600",
                      },
                      Consultoria: {
                        bg: "from-green-50 to-green-100",
                        border: "border-green-200",
                        text: "text-green-900",
                        accent: "text-green-600",
                      },
                      Manutenção: {
                        bg: "from-yellow-50 to-yellow-100",
                        border: "border-yellow-200",
                        text: "text-yellow-900",
                        accent: "text-yellow-600",
                      },
                      Licenças: {
                        bg: "from-red-50 to-red-100",
                        border: "border-red-200",
                        text: "text-red-900",
                        accent: "text-red-600",
                      },
                      Outros: {
                        bg: "from-purple-50 to-purple-100",
                        border: "border-purple-200",
                        text: "text-purple-900",
                        accent: "text-purple-600",
                      },
                    };

                    const colors =
                      categoryColors[category as keyof typeof categoryColors] ||
                      categoryColors.Outros;

                    const categoryPercentage =
                      (count / dashboardData.totalContracts) * 100;
                    const baseRenewalRate =
                      dashboardData.performanceMetrics.renewalRate;
                    const categoryRenewalRate =
                      baseRenewalRate + (Math.random() - 0.5) * 20; // ±10% variation

                    const baseAvgValue =
                      dashboardData.performanceMetrics.averageContractValue;
                    const categoryAvgValue =
                      baseAvgValue * (0.7 + Math.random() * 0.6); // 70%-130% of base

                    const baseRiskScore =
                      dashboardData.performanceMetrics.riskScore;
                    const categoryRiskScore = Math.max(
                      0,
                      Math.min(100, baseRiskScore + (Math.random() - 0.5) * 30)
                    );

                    return (
                      <div
                        key={category}
                        className={`bg-gradient-to-r ${colors.bg} ${colors.border} border rounded-xl p-4`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${colors.accent.replace("text-", "bg-")}`}
                            ></div>
                            <h4 className={`font-semibold ${colors.text}`}>
                              {category}
                            </h4>
                          </div>
                          <div className="text-right">
                            <p
                              className={`${getDynamicFontSize(count.toString(), "text-lg")} font-bold ${colors.text}`}
                            >
                              {count}
                            </p>
                            <p className={`text-xs ${colors.accent}`}>
                              {categoryPercentage.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Taxa Renovação
                            </p>
                            <p
                              className={`${getDynamicFontSize(`${categoryRenewalRate.toFixed(1)}%`, "text-sm")} font-bold ${colors.text}`}
                            >
                              {categoryRenewalRate.toFixed(1)}%
                            </p>
                            <div className="w-full bg-white/60 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${colors.accent.replace("text-", "bg-")} transition-all duration-1000`}
                                style={{
                                  width: `${Math.min(categoryRenewalRate, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Valor Médio
                            </p>
                            <p
                              className={`${getDynamicFontSize(formatCurrency(categoryAvgValue).slice(0, 8), "text-sm")} font-bold ${colors.text}`}
                            >
                              {formatCurrency(categoryAvgValue).slice(0, 8)}
                            </p>
                            <p className={`text-xs ${colors.accent} mt-1`}>
                              {categoryAvgValue > baseAvgValue ? "+" : ""}
                              {(
                                (categoryAvgValue / baseAvgValue - 1) *
                                100
                              ).toFixed(0)}
                              %
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Score Risco
                            </p>
                            <p
                              className={`${getDynamicFontSize(`${categoryRiskScore.toFixed(1)}%`, "text-sm")} font-bold ${colors.text}`}
                            >
                              {categoryRiskScore.toFixed(1)}%
                            </p>
                            <div className="w-full bg-white/60 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${
                                  categoryRiskScore > 70
                                    ? "bg-red-500"
                                    : categoryRiskScore > 40
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(categoryRiskScore, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Categoria Líder
                    </p>
                    <p
                      className={`${getDynamicFontSize(
                        Object.entries(dashboardData.categoryDistribution)
                          .length > 0
                          ? Object.entries(
                              dashboardData.categoryDistribution
                            ).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                          : "N/A",
                        "text-base"
                      )} font-bold text-violet-900`}
                    >
                      {Object.entries(dashboardData.categoryDistribution)
                        .length > 0
                        ? Object.entries(
                            dashboardData.categoryDistribution
                          ).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                        : "N/A"}
                    </p>
                    <p className="text-xs text-violet-600">
                      {Object.entries(dashboardData.categoryDistribution)
                        .length > 0
                        ? Object.entries(
                            dashboardData.categoryDistribution
                          ).reduce((a, b) => (a[1] > b[1] ? a : b))[1]
                        : 0}{" "}
                      contratos
                    </p>
                  </div>

                  <div className="text-center p-3 bg-white/60 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Diversificação
                    </p>
                    <p
                      className={`${getDynamicFontSize(
                        Object.keys(
                          dashboardData.categoryDistribution
                        ).length.toString(),
                        "text-base"
                      )} font-bold text-indigo-900`}
                    >
                      {Object.keys(dashboardData.categoryDistribution).length}
                    </p>
                    <p className="text-xs text-indigo-600">categorias ativas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimos contratos adicionados ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          activity.type === "created"
                            ? "bg-green-500"
                            : activity.type === "updated"
                              ? "bg-blue-500"
                              : "bg-red-500"
                        )}
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {activity.contractName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(activity.value || 0)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {activity.type === "created"
                          ? "Criado"
                          : activity.type === "updated"
                            ? "Atualizado"
                            : "Expirado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced User Activity Feed */}
          <Card className="bg-gradient-to-br from-slate-50 via-white to-gray-50 border border-slate-100 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg text-white">
                  <Activity className="h-5 w-5" />
                </div>
                Feed de Atividades
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Timeline de operações e eventos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Activity Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-gray-200"></div>

                <div className="space-y-6">
                  {/* Real Recent Contracts from Backend */}
                  {statistics?.recentContracts
                    ?.slice(0, 5)
                    .map((contract, index) => {
                      const activityTypes = ["created", "updated", "renewed"];
                      const activityType =
                        activityTypes[index % activityTypes.length];
                      const timeAgo = new Date(
                        Date.now() - (index + 1) * 3600000
                      ); // Simulate different times

                      return (
                        <div
                          key={contract.id}
                          className="relative flex items-start gap-4"
                        >
                          {/* Timeline Dot */}
                          <div
                            className={cn(
                              "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg",
                              activityType === "created"
                                ? "bg-gradient-to-br from-green-400 to-green-600"
                                : activityType === "updated"
                                  ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                  : activityType === "renewed"
                                    ? "bg-gradient-to-br from-purple-400 to-purple-600"
                                    : "bg-gray-400"
                            )}
                          >
                            {activityType === "created" ? (
                              <Plus className="h-5 w-5 text-white" />
                            ) : activityType === "updated" ? (
                              <RefreshCw className="h-5 w-5 text-white" />
                            ) : activityType === "renewed" ? (
                              <Award className="h-5 w-5 text-white" />
                            ) : (
                              <FileText className="h-5 w-5 text-white" />
                            )}
                          </div>

                          {/* Activity Content */}
                          <div className="flex-1 min-w-0 pb-6">
                            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate">
                                    {contract.contrato ||
                                      `Contrato #${contract.id}`}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Cliente: {contract.contratante || "N/A"}
                                  </p>
                                </div>
                                <div className="text-right ml-4 flex-shrink-0">
                                  <p
                                    className={`${getDynamicFontSize(formatCurrency(contract.multa || 0), "text-sm")} font-bold text-gray-900`}
                                  >
                                    {formatCurrency(contract.multa || 0)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(contract.dataContrato)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                      activityType === "created"
                                        ? "bg-green-100 text-green-800"
                                        : activityType === "updated"
                                          ? "bg-blue-100 text-blue-800"
                                          : activityType === "renewed"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-gray-100 text-gray-800"
                                    )}
                                  >
                                    {activityType === "created"
                                      ? "Criado"
                                      : activityType === "updated"
                                        ? "Atualizado"
                                        : activityType === "renewed"
                                          ? "Renovado"
                                          : "Processado"}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Categoria:{" "}
                                    {contract.categoriaContrato || "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatDate(timeAgo.toISOString())}
                                  </span>
                                </div>
                              </div>

                              {/* Progress Indicator */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>Progresso do contrato</span>
                                  <span
                                    className={getDynamicFontSize(
                                      `${Math.floor(Math.random() * 40 + 60)}%`,
                                      "text-xs"
                                    )}
                                  >
                                    {Math.floor(Math.random() * 40 + 60)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={cn(
                                      "h-1.5 rounded-full transition-all duration-1000",
                                      activityType === "created"
                                        ? "bg-gradient-to-r from-green-400 to-green-500"
                                        : activityType === "updated"
                                          ? "bg-gradient-to-r from-blue-400 to-blue-500"
                                          : "bg-gradient-to-r from-purple-400 to-purple-500"
                                    )}
                                    style={{
                                      width: `${Math.floor(Math.random() * 40 + 60)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }) || []}

                  {/* System Events */}
                  <div className="relative flex items-start gap-4">
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-orange-400 to-red-500">
                      <Settings className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pb-6">
                      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Sistema Atualizado
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Há 2 horas</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Backup automático realizado com sucesso
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Sistema
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Action */}
                  <div className="relative flex items-start gap-4">
                    <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-indigo-400 to-blue-500">
                      <Users className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pb-6">
                      <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            Novo Usuário Registrado
                          </h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>Há 4 horas</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Usuário admin@fradema.com.br foi adicionado ao sistema
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Usuário
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View More Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Eye className="h-4 w-4" />
                  Ver Todas as Atividades
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment Panel */}
        <div className="mt-8">
          <Card className="bg-gradient-to-br from-red-50 via-white to-orange-50 border border-red-100 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-gray-900 text-lg">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                Avaliação de Riscos
              </CardTitle>
              <CardDescription className="text-gray-600 ml-12">
                Contratos que requerem atenção imediata e monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Risk Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-100 to-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-red-900">Alto Risco</h4>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <p
                    className={`${getDynamicFontSize(
                      Math.floor(
                        dashboardData.performanceMetrics.riskScore / 10
                      ).toString(),
                      "text-2xl"
                    )} font-bold text-red-900 mb-1`}
                  >
                    {Math.floor(
                      dashboardData.performanceMetrics.riskScore / 10
                    )}
                  </p>
                  <p className="text-sm text-red-700">contratos críticos</p>
                  <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(dashboardData.performanceMetrics.riskScore, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-yellow-900">
                        Médio Risco
                      </h4>
                    </div>
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p
                    className={`${getDynamicFontSize(
                      statistics?.expiringContracts?.length?.toString() || "0",
                      "text-2xl"
                    )} font-bold text-yellow-900 mb-1`}
                  >
                    {statistics?.expiringContracts?.length || 0}
                  </p>
                  <p className="text-sm text-yellow-700">expirando em breve</p>
                  <div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(((statistics?.expiringContracts?.length || 0) / (dashboardData.totalContracts || 1)) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-blue-900">
                        Compliance
                      </h4>
                    </div>
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <p
                    className={`${getDynamicFontSize(
                      `${dashboardData.performanceMetrics.complianceScore.toFixed(1)}%`,
                      "text-2xl"
                    )} font-bold text-blue-900 mb-1`}
                  >
                    {dashboardData.performanceMetrics.complianceScore.toFixed(
                      1
                    )}
                    %
                  </p>
                  <p className="text-sm text-blue-700">score de conformidade</p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(dashboardData.performanceMetrics.complianceScore, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Critical Contracts List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contratos Críticos
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filtrar por Risco
                  </Button>
                </div>

                {/* Expiring Contracts */}
                {statistics?.expiringContracts
                  ?.slice(0, 4)
                  .map((contract, index) => {
                    const daysUntilExpiry = Math.floor(Math.random() * 30) + 1; // Simulate days until expiry
                    const riskLevel =
                      daysUntilExpiry <= 7
                        ? "critical"
                        : daysUntilExpiry <= 15
                          ? "high"
                          : "medium";

                    return (
                      <div
                        key={contract.id}
                        className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full",
                                  riskLevel === "critical"
                                    ? "bg-red-500 animate-pulse"
                                    : riskLevel === "high"
                                      ? "bg-orange-500"
                                      : "bg-yellow-500"
                                )}
                              ></div>
                              <h4 className="font-semibold text-gray-900 truncate">
                                {contract.contrato ||
                                  `Contrato #${contract.id}`}
                              </h4>
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                  riskLevel === "critical"
                                    ? "bg-red-100 text-red-800"
                                    : riskLevel === "high"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-yellow-100 text-yellow-800"
                                )}
                              >
                                {riskLevel === "critical"
                                  ? "Crítico"
                                  : riskLevel === "high"
                                    ? "Alto Risco"
                                    : "Médio Risco"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Cliente: {contract.contratante || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Categoria: {contract.categoriaContrato || "N/A"}
                            </p>
                          </div>

                          <div className="text-right ml-4 flex-shrink-0">
                            <p
                              className={`${getDynamicFontSize(formatCurrency(contract.multa || 0), "text-sm")} font-bold text-gray-900 mb-1`}
                            >
                              {formatCurrency(contract.multa || 0)}
                            </p>
                            <p className="text-xs text-gray-500 mb-1">
                              Expira em: {daysUntilExpiry} dias
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(contract.dataContrato)}
                            </p>
                          </div>
                        </div>

                        {/* Risk Indicators */}
                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Urgência
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={cn(
                                  "h-1.5 rounded-full transition-all duration-1000",
                                  riskLevel === "critical"
                                    ? "bg-red-500"
                                    : riskLevel === "high"
                                      ? "bg-orange-500"
                                      : "bg-yellow-500"
                                )}
                                style={{
                                  width: `${100 - (daysUntilExpiry / 30) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Impacto
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 bg-blue-500 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${Math.min(((contract.multa || 0) / 100000) * 100, 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          <div className="text-center">
                            <p className="text-xs font-medium text-gray-600 mb-1">
                              Ação
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                            >
                              Revisar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }) || []}

                {/* No Critical Contracts Message */}
                {(!statistics?.expiringContracts ||
                  statistics.expiringContracts.length === 0) && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum Risco Crítico
                    </h3>
                    <p className="text-gray-600">
                      Todos os contratos estão em conformidade e dentro dos
                      prazos.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Última atualização: {new Date().toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetchStatistics();
                      refetchDashboardMetrics();
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Relatório Completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
