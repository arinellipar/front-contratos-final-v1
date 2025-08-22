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

      // Calculate derived properties with date validation
      const contractStartDate = new Date(baseContract.dataContrato);

      // Validate contract start date
      if (isNaN(contractStartDate.getTime())) {
        throw new Error(
          `Invalid contract start date: ${baseContract.dataContrato}`
        );
      }

      const expiryDate = addDays(
        contractStartDate,
        baseContract.prazo || 365 // Default to 365 days if prazo is not defined
      );

      // Validate expiry date
      if (isNaN(expiryDate.getTime())) {
        throw new Error(
          `Invalid expiry date calculated from start date: ${baseContract.dataContrato} and prazo: ${baseContract.prazo}`
        );
      }

      const daysRemaining = differenceInDays(expiryDate, new Date());

      // Validate daysRemaining
      if (isNaN(daysRemaining)) {
        throw new Error(
          `Invalid daysRemaining calculated. ExpiryDate: ${expiryDate}, Current: ${new Date()}`
        );
      }

      const isExpired = daysRemaining < 0;
      const isExpiringSoon = daysRemaining <= 30 && daysRemaining >= 0;

      let status: ContractStatus;
      if (isExpired) {
        status = ContractStatus.EXPIRED;
      } else if (isExpiringSoon) {
        status = ContractStatus.EXPIRING_SOON;
      } else {
        status = ContractStatus.ACTIVE;
      }

      const extendedContract: ExtendedContract = {
        ...baseContract,
        // Ensure all required properties exist with defaults if missing
        contrato: baseContract.contrato || "",
        contratada: baseContract.contratada || "",
        prazo: baseContract.prazo || 365,
        categoriaContrato: (baseContract as any).categoriaContrato || "Geral",
        filial: baseContract.filial || "",
        dataContrato:
          typeof baseContract.dataContrato === "string"
            ? baseContract.dataContrato
            : (baseContract.dataContrato as any) instanceof Date
              ? (baseContract.dataContrato as Date).toISOString()
              : new Date(baseContract.dataContrato as any).toISOString(),
        // Add computed properties with fallbacks
        status,
        daysRemaining: isNaN(daysRemaining) ? 0 : daysRemaining,
        expiryDate,
        isExpired,
        isExpiringSoon,
        userId: "",
      };

      return extendedContract;
    },
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  /**
   * Delete mutation with optimistic updates
   */
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("Invalid contract ID");
      return contractsApi.delete(contractId);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["contracts"] });

      // Snapshot the previous value
      const previousContracts = queryClient.getQueryData(["contracts"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["contracts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((c: Contract) => c.id !== contractId),
        };
      });

      return { previousContracts };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContracts) {
        queryClient.setQueryData(["contracts"], context.previousContracts);
      }
      toast.error("Erro ao excluir contrato");
    },
    onSuccess: () => {
      toast.success("Contrato excluído com sucesso!");
      router.push("/dashboard");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  /**
   * Download PDF handler
   */
  const handleDownloadPdf = useCallback(async () => {
    if (!contract?.arquivoPdfCaminho || !contractId) {
      toast.error("Nenhum arquivo PDF disponível");
      return;
    }

    const toastId = toast.loading("Baixando arquivo...");

    try {
      const blob = await contractsApi.downloadPdf(contractId);
      const fileName =
        contract.arquivoPdfNomeOriginal || `contrato_${contractId}.pdf`;

      saveAs(blob, fileName);
      toast.success("Download concluído!", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo", { id: toastId });
    }
  }, [contract, contractId]);

  /**
   * Share contract handler
   */
  const handleShare = useCallback(async () => {
    if (!shareOptions.email) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    const toastId = toast.loading("Compartilhando contrato...");

    try {
      // Simulate API call - you would implement this in your backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(`Contrato compartilhado com ${shareOptions.email}`, {
        id: toastId,
      });
      setIsShareDialogOpen(false);
      setShareOptions({ email: "", permissions: "view" });
    } catch (error) {
      toast.error("Erro ao compartilhar contrato", { id: toastId });
    }
  }, [shareOptions]);

  /**
   * Print handler
   */
  const handlePrint = useCallback(() => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  }, []);

  /**
   * Copy contract link to clipboard
   */
  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/contracts/${contractId}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  }, [contractId]);

  /**
   * Get status badge configuration
   */
  const getStatusBadge = (status: ContractStatus) => {
    const config = {
      [ContractStatus.ACTIVE]: {
        label: "Ativo",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border-green-200",
      },
      [ContractStatus.EXPIRED]: {
        label: "Expirado",
        icon: XCircle,
        className: "bg-red-100 text-red-800 border-red-200",
      },
      [ContractStatus.EXPIRING_SOON]: {
        label: "Expirando em Breve",
        icon: AlertTriangle,
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      [ContractStatus.RENEWED]: {
        label: "Renovado",
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
    };

    return config[status] || config[ContractStatus.ACTIVE];
  };

  /**
   * Get category icon and color
   */
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "Software":
        return { icon: "💻", color: "bg-blue-100 text-blue-800" };
      case "Aluguel":
        return { icon: "🏢", color: "bg-yellow-100 text-yellow-800" };
      case "TI":
        return { icon: "⚙️", color: "bg-cyan-100 text-cyan-800" };
      default:
        return { icon: "📁", color: "bg-gray-100 text-gray-800" };
    }
  };

  /**
   * Handle tab change with URL update
   */
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);

    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url);
  }, []);

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
        {/* Header skeleton */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
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
            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type guard for contract
  if (!contract) return null;

  const statusConfig = getStatusBadge(contract.status);
  const StatusIcon = statusConfig.icon;
  const categoryInfo = getCategoryInfo(contract.categoriaContrato);

  return (
    <div className={cn("min-h-screen", isPrintView && "print:bg-white")}>
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
            {/* Quick Actions */}
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

            {hasPermission("contracts:update") && (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/${contract.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}

            {hasPermission("contracts:delete") && (
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
                      Tem certeza que deseja excluir este contrato? Esta ação
                      não pode ser desfeita e todos os dados associados serão
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
            )}
          </div>
        }
      />

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Status Alert */}
            {contract.status === ContractStatus.EXPIRED && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Contrato Expirado
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Este contrato expirou em {formatDate(contract.expiryDate)}
                      . Considere renovar ou criar um novo contrato.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {contract.status === ContractStatus.EXPIRING_SOON && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Contrato Expirando em Breve
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Este contrato expira em{" "}
                      {!isNaN(contract.daysRemaining)
                        ? contract.daysRemaining
                        : "?"}{" "}
                      dias ({formatDate(contract.expiryDate)}). Considere
                      iniciar o processo de renovação.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Informações do Contrato
                        </CardTitle>
                        <CardDescription>
                          Criado em {formatDate(contract.dataCriacao)}
                          {contract.dataAtualizacao && (
                            <>
                              {" "}
                              • Atualizado em{" "}
                              {formatRelativeTime(contract.dataAtualizacao)}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={cn("gap-1", statusConfig.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contract Parties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Contratante
                        </label>
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {contract.contratante}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500">
                          Contratada
                        </label>
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {contract.contratada}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contract Object */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Objeto do Contrato
                      </label>
                      <p className="text-gray-900">{contract.objeto}</p>
                    </div>

                    {/* Full Contract Text */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">
                        Descrição Completa
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {contract.contrato}
                        </p>
                      </div>
                    </div>

                    {/* Additional Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Categoria
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{categoryInfo.icon}</span>
                          <Badge className={categoryInfo.color}>
                            {contract.categoriaContrato}
                          </Badge>
                        </div>
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
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            {contract.observacoes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <FileText className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contract.arquivoPdfNomeOriginal ||
                                  "Contrato Original"}
                              </p>
                              <p className="text-sm text-gray-500">
                                PDF
                                {contract.arquivoPdfTamanho && (
                                  <>
                                    {" "}
                                    •{" "}
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
                        {hasPermission("contracts:update") && (
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
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <Card>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Dates Card */}
            <Card>
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
                    {format(
                      new Date(contract.dataContrato),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Vencimento
                  </label>
                  <p className="font-medium">
                    {contract.expiryDate &&
                    !isNaN(contract.expiryDate.getTime())
                      ? format(contract.expiryDate, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "Data inválida"}
                  </p>
                  {contract.daysRemaining > 0 ? (
                    <p className="text-sm text-gray-500">
                      Em {contract.daysRemaining} dias
                    </p>
                  ) : contract.daysRemaining < 0 &&
                    !isNaN(contract.daysRemaining) ? (
                    <p className="text-sm text-red-500">
                      Expirado há {Math.abs(contract.daysRemaining)} dias
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">
                      Status de expiração indisponível
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Prazo Total
                  </label>
                  <p className="font-medium">{contract.prazo} dias</p>
                </div>

                {contract.dataAtualizacao && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">
                      Última Atualização
                    </label>
                    <p className="font-medium">
                      {formatRelativeTime(contract.dataAtualizacao)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Terms Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Termos Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {!contract.multa &&
                  !contract.rescisao &&
                  !contract.avisoPrevia && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum termo financeiro especificado
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/create`)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar Contrato
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/contracts`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Todos os Contratos
                </Button>

                {contract.isExpiringSoon && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(`/dashboard/create`)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Renovar Contrato
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
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
