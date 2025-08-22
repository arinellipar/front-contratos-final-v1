// src/app/(dashboard)/contracts/[id]/page.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/hooks";
import { contractsApi } from "@/lib/api/contracts";
import { Contract } from "@/lib/types/contract";
import { PageHeader } from "@/components/layout/Pageheader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Download,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  Clock,
  Building,
  MapPin,
  Tag,
  Share2,
  Printer,
  Mail,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  BarChart3,
  ArrowLeft,
  Users,
  Target,
  CreditCard,
  TrendingUp,
  Shield,
  Briefcase,
} from "lucide-react";
import {
  formatDate,
  formatCurrency,
  formatRelativeTime,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

// Modern 2025 animation variants
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
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Contract status enumeration
 */
enum ContractStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  EXPIRING_SOON = "expiring_soon",
  RENEWED = "renewed",
}

/**
 * Extended contract interface with computed properties
 */
interface ExtendedContract extends Omit<Contract, "status"> {
  status: ContractStatus;
  daysRemaining: number;
  expiryDate: Date;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

/**
 * Share options interface
 */
interface ShareOptions {
  email: string;
  message?: string;
  permissions: "view" | "edit";
  expiresAt?: Date;
}

/**
 * Contract Detail Page Component
 */
export default function ContractDetailPage() {
  // Navigation and routing hooks
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Authentication and permissions
  const { hasPermission } = useAuth();

  // Extract contract ID with validation
  const contractId = useMemo(() => {
    const id = params.id as string;
    const numericId = parseInt(id, 10);
    return isNaN(numericId) ? null : numericId;
  }, [params.id]);

  // Component state
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "details"
  );
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    email: "",
    permissions: "view",
  });
  const [isPrintView, setIsPrintView] = useState(false);

  /**
   * Contract data fetching with React Query
   */
  const {
    data: contract,
    isLoading,
    error,
    refetch,
  } = useQuery<ExtendedContract, Error>({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Invalid contract ID");

      const baseContract = await contractsApi.getById(contractId);

      // Calculate contract status and metadata
      const currentDate = new Date();
      const contractDate = new Date(baseContract.dataContrato);

      // Ensure valid dates
      const validContractDate = !isNaN(contractDate.getTime())
        ? contractDate
        : new Date();

      const prazo = baseContract.prazo || 0;
      const expiryDate = addDays(validContractDate, prazo);
      const daysRemaining = differenceInDays(expiryDate, currentDate);

      let status: ContractStatus;
      if (daysRemaining < 0) {
        status = ContractStatus.EXPIRED;
      } else if (daysRemaining <= 30) {
        status = ContractStatus.EXPIRING_SOON;
      } else {
        status = ContractStatus.ACTIVE;
      }

      return {
        ...baseContract,
        status,
        daysRemaining,
        expiryDate,
        isExpired: daysRemaining < 0,
        isExpiringSoon: daysRemaining <= 30 && daysRemaining >= 0,
      } as ExtendedContract;
    },
    enabled: !!contractId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  /**
   * Delete contract mutation
   */
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!contractId) throw new Error("Invalid contract ID");
      return contractsApi.delete(contractId);
    },
    onSuccess: () => {
      toast.success("Contrato excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Erro ao excluir contrato");
    },
  });

  /**
   * Event handlers
   */
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url.toString());
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!contractId || !contract?.arquivoPdfCaminho) return;

    try {
      const blob = await contractsApi.downloadPdf(contractId);
      const filename =
        contract.arquivoPdfNomeOriginal || `contrato-${contractId}.pdf`;
      saveAs(blob, filename);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao fazer download do PDF");
    }
  }, [contractId, contract]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  }, []);

  const handlePrint = useCallback(() => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 500);
  }, []);

  const handleShare = useCallback(() => {
    // Implementation for sharing functionality
    toast.success("Funcionalidade de compartilhamento em desenvolvimento");
    setIsShareDialogOpen(false);
  }, []);

  /**
   * Helper functions for UI elements
   */
  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return {
          label: "Ativo",
          className: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case ContractStatus.EXPIRED:
        return {
          label: "Expirado",
          className: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
        };
      case ContractStatus.EXPIRING_SOON:
        return {
          label: "Expira em breve",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Desconhecido",
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: Info,
        };
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { color: string; icon: any }> = {
      Software: { color: "bg-blue-100 text-blue-800", icon: Shield },
      Consultoria: { color: "bg-purple-100 text-purple-800", icon: Users },
      Manutenção: { color: "bg-orange-100 text-orange-800", icon: Target },
      default: { color: "bg-gray-100 text-gray-800", icon: Tag },
    };

    return categoryMap[category] || categoryMap.default;
  };

  /**
   * Error state rendering
   */
  if (error || !contractId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Erro ao carregar contrato
              </h2>
              <p className="text-gray-600 mb-4">
                {error?.message ||
                  "Contrato não encontrado ou erro ao carregar dados."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * Loading state rendering
   */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusBadge(contract.status);
  const StatusIcon = statusConfig.icon;
  const categoryInfo = getCategoryInfo(contract.categoriaContrato);

  return (
    <motion.div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40",
        isPrintView && "print:bg-white"
      )}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <PageHeader
        title={`Contrato #${contract.id}`}
        description={`${contract.contratante} - ${contract.objeto}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Contratos", href: "/dashboard" },
          { label: `Contrato #${contract.id}` },
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              title="Copiar link"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handlePrint}
              title="Imprimir"
            >
              <Printer className="h-4 w-4" />
            </Button>

            <Dialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Compartilhar">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Compartilhar Contrato</DialogTitle>
                  <DialogDescription>
                    Envie um link de acesso para este contrato por email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={shareOptions.email}
                      onChange={(e) =>
                        setShareOptions({
                          ...shareOptions,
                          email: e.target.value,
                        })
                      }
                      placeholder="exemplo@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Permissões</label>
                    <select
                      value={shareOptions.permissions}
                      onChange={(e) =>
                        setShareOptions({
                          ...shareOptions,
                          permissions: e.target.value as "view" | "edit",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="view">Apenas visualização</option>
                      <option value="edit">Edição</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsShareDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleShare}>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-gray-300 mx-2" />

            {/* Primary Actions */}
            {contract.arquivoPdfCaminho && (
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${contract.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este contrato? Esta ação não
                    pode ser desfeita e todos os dados associados serão
                    permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {/* Main Content */}
      <div className="px-6 lg:px-8 py-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={pageVariants}
        >
          {/* Main Column */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            variants={cardVariants}
          >
            {/* Contract Status Alert */}
            {contract.status === ContractStatus.EXPIRED && (
              <motion.div
                className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 p-6 rounded-xl shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Contrato Expirado
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      Este contrato expirou há{" "}
                      {Math.abs(contract.daysRemaining)} dias . Considere
                      renovar ou criar um novo contrato.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {contract.status === ContractStatus.EXPIRING_SOON && (
              <motion.div
                className="bg-yellow-50/80 backdrop-blur-sm border-l-4 border-yellow-400 p-6 rounded-xl shadow-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Contrato Expirando
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Este contrato expira em {contract.daysRemaining} dias. É
                      recomendado iniciar o processo de renovação.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Modern Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-200"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-2xl">
                            <FileText className="h-6 w-6 text-blue-600" />
                            Detalhes do Contrato
                          </CardTitle>
                          <CardDescription className="mt-2 text-base">
                            Informações completas sobre este acordo
                          </CardDescription>
                          {contract.categoriaContrato && (
                            <Badge className={cn("mt-2", categoryInfo.color)}>
                              <categoryInfo.icon className="h-3 w-3 mr-1" />
                              {contract.categoriaContrato}
                            </Badge>
                          )}
                        </div>
                        <Badge className={cn("gap-1", statusConfig.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Parties Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Contratante
                          </label>
                          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                            <p className="font-semibold text-blue-900">
                              {contract.contratante}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Contratada
                          </label>
                          <div className="bg-green-50/50 border border-green-200/50 rounded-lg p-4">
                            <p className="font-semibold text-green-900">
                              {contract.contratada}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contract Object */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Objeto do Contrato
                        </label>
                        <p className="text-gray-900 leading-relaxed">
                          {contract.objeto}
                        </p>
                      </div>

                      {/* Full Contract Text */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Descrição Completa
                        </label>
                        <div className="bg-gray-50/50 border border-gray-200/50 rounded-lg p-4">
                          <p className="text-gray-900 leading-relaxed">
                            {contract.contrato}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Categoria
                          </label>
                          <Badge className={categoryInfo.color}>
                            <categoryInfo.icon className="h-3 w-3 mr-1" />
                            {contract.categoriaContrato}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Filial
                          </label>
                          <p className="font-medium">{contract.filial}</p>
                        </div>
                      </div>

                      {/* Observations */}
                      {contract.observacoes && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Observações
                          </label>
                          <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-lg p-4">
                            <p className="text-yellow-800 leading-relaxed">
                              {contract.observacoes}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos do Contrato
                    </CardTitle>
                    <CardDescription>
                      Arquivos e documentos relacionados a este contrato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contract.arquivoPdfCaminho ? (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <FileText className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contract.arquivoPdfNomeOriginal ||
                                  "contrato.pdf"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {contract.arquivoPdfTamanho && (
                                  <>
                                    Tamanho:{" "}
                                    {formatFileSize(contract.arquivoPdfTamanho)}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadPdf}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">
                          Nenhum documento anexado a este contrato
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() =>
                            router.push(`/dashboard/${contract.id}/edit`)
                          }
                        >
                          Anexar Documento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Histórico de Alterações
                    </CardTitle>
                    <CardDescription>
                      Registro de todas as alterações realizadas neste contrato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Histórico em desenvolvimento
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Modern Sidebar */}
          <motion.div
            className="space-y-6"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Key Dates Card */}
            <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Data do Contrato
                  </label>
                  <p className="font-medium">
                    {contract.dataContrato &&
                    !isNaN(new Date(contract.dataContrato).getTime())
                      ? format(
                          new Date(contract.dataContrato),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )
                      : "Data não disponível"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Data de Vencimento
                  </label>
                  <p className="font-medium">
                    {contract.expiryDate &&
                    !isNaN(contract.expiryDate.getTime())
                      ? format(contract.expiryDate, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "Data não disponível"}
                  </p>
                  {contract.daysRemaining > 0 && (
                    <p className="text-sm text-gray-600">
                      Em {contract.daysRemaining} dias
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Prazo
                  </label>
                  <p className="font-medium">{contract.prazo} dias</p>
                </div>

                {contract.dataAtualizacao && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Última Atualização
                    </label>
                    <p className="text-sm text-gray-600">
                      {formatRelativeTime(contract.dataAtualizacao)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Terms Card */}
            <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Termos Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.valorTotalContrato && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Valor Total do Contrato
                    </label>
                    <p className="font-medium text-xl text-green-600">
                      {formatCurrency(contract.valorTotalContrato)}
                    </p>
                  </div>
                )}

                {contract.multa && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Multa Contratual
                    </label>
                    <p className="font-medium text-lg">
                      {formatCurrency(contract.multa)}
                    </p>
                  </div>
                )}

                {contract.rescisao && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Prazo de Rescisão
                    </label>
                    <p className="font-medium">{contract.rescisao} dias</p>
                  </div>
                )}

                {contract.avisoPrevia && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Aviso Prévio
                    </label>
                    <p className="font-medium">{contract.avisoPrevia} dias</p>
                  </div>
                )}

                {!contract.valorTotalContrato &&
                  !contract.multa &&
                  !contract.rescisao &&
                  !contract.avisoPrevia && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum termo financeiro especificado
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/${contract.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Contrato
                </Button>

                {contract.arquivoPdfCaminho && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}

                {contract.status === ContractStatus.EXPIRING_SOON && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Implementation for contract renewal
                      toast.success(
                        "Funcionalidade de renovação em desenvolvimento"
                      );
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Renovar Contrato
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * Helper function to format file size
 */
function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}
