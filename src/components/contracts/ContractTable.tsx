// src/components/contracts/ContractTable.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Contract } from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/formatters";
import { contractsApi } from "@/lib/api/contracts";
import { motion, useInView } from "framer-motion";
import {
  Eye,
  Edit,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Calendar,
  Building,
  DollarSign,
  Clock,
  Star,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Search,
  Plus,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import { useRef } from "react";

// Modern 2025 animation variants for table interactions
const containerVariants = {
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

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
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
  tap: {
    scale: 0.98,
    y: -4,
    transition: {
      duration: 0.1,
    },
  },
};

const loadingVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

interface ContractTableProps {
  contracts: Contract[];
  isLoading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDelete?: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  pageSize?: number;
  totalItems?: number;
}

export function ContractTable({
  contracts,
  isLoading,
  totalPages,
  currentPage,
  onPageChange,
  onDelete,
  onBulkDelete,
  pageSize = 10,
  totalItems = 0,
}: ContractTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  // Verificação de estado para debug (manter apenas em desenvolvimento)
  if (process.env.NODE_ENV === "development") {
    console.log("📋 ContractTable:", {
      contractsLength: contracts.length,
      isLoading,
      totalItems,
    });
  }

  const handleDelete = async (id: number) => {
    console.log("🔴 Delete button clicked for contract ID:", id);

    if (!onDelete) {
      console.error("❌ onDelete function is not available");
      toast.error("Função de exclusão não está disponível");
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
    );

    if (!confirmed) {
      console.log("❌ User cancelled deletion");
      return;
    }

    console.log("✅ User confirmed deletion, calling onDelete...");
    setDeletingId(id);

    try {
      await onDelete(id);
      console.log("✅ onDelete completed successfully");
    } catch (error) {
      console.error("❌ ContractTable: Erro ao excluir contrato:", error);
      toast.error(`Erro ao excluir contrato: ${(error as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = useCallback(async (contract: Contract) => {
    if (!contract.arquivoPdfCaminho) {
      toast.error("Nenhum arquivo PDF disponível");
      return;
    }

    const toastId = toast.loading("Baixando arquivo...");

    try {
      const blob = await contractsApi.downloadPdf(contract.id);
      const fileName =
        contract.arquivoPdfNomeOriginal || `contrato_${contract.id}.pdf`;

      saveAs(blob, fileName);
      toast.success("Download concluído!", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo", { id: toastId });
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Software":
        return "💻";
      case "Aluguel":
        return "🏢";
      case "TI":
        return "⚙️";
      default:
        return "📁";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Software":
        return "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-900 border border-blue-200/50 shadow-sm";
      case "Aluguel":
        return "bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-900 border border-amber-200/50 shadow-sm";
      case "TI":
        return "bg-gradient-to-r from-cyan-50 to-teal-100 text-cyan-900 border border-cyan-200/50 shadow-sm";
      default:
        return "bg-gradient-to-r from-slate-50 to-gray-100 text-slate-900 border border-slate-200/50 shadow-sm";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ativo":
        return "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-900 border border-emerald-200/50";
      case "vencido":
        return "bg-gradient-to-r from-red-50 to-rose-100 text-red-900 border border-red-200/50";
      case "pendente":
        return "bg-gradient-to-r from-orange-50 to-amber-100 text-orange-900 border border-orange-200/50";
      default:
        return "bg-gradient-to-r from-slate-50 to-gray-100 text-slate-900 border border-slate-200/50";
    }
  };

  // Renderização confirmada - contratos serão exibidos

  // Mostrar indicador de loading se estiver carregando mas com dados
  const showLoadingIndicator = isLoading && contracts.length > 0;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="w-full space-y-6"
    >
      {/* Background loading indicator */}
      {showLoadingIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Atualizando...</span>
          </div>
        </motion.div>
      )}

      {/* Modern header with info box */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div className="space-y-1 flex-1">
          <h2 className="text-2xl font-bold text-navy-900 ml-4">
            Contratos
            <span className="ml-2 text-sm font-normal text-navy-600">
              ({totalItems} total)
            </span>
          </h2>
          <p className="text-sm text-navy-600 ml-4">
            Gerencie e monitore todos os seus contratos em um só lugar
          </p>
        </div>

        {/* Info box with user guidance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism rounded-xl p-4 border border-blue-200/50 bg-blue-50/30 max-w-sm"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                💡 Dica de Navegação
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Clique no contrato</strong> para obter mais informações,
                editá-lo ou excluí-lo
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Desktop Table - Enhanced with modern styling */}
      <motion.div variants={itemVariants} className="hidden md:block">
        <div className="glass-morphism-strong rounded-2xl overflow-hidden border border-navy-100/50 shadow-xl">
          <div className="scrollbar-modern overflow-x-auto">
            <table className="min-w-full divide-y divide-navy-100">
              <thead className="bg-gradient-to-r from-navy-50 to-navy-100 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Data</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Contrato</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>Contratante</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>Contratada</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Prazo</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Vencimento</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Filial
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-navy-800 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Valor</span>
                    </div>
                  </th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-navy-800 uppercase tracking-wider">
                    PDF
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-navy-100">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-8 py-16 text-center">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center space-y-6"
                      >
                        <div className="relative">
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="w-20 h-20 bg-gradient-to-tr from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center"
                          >
                            <FileText className="w-10 h-10 text-navy-600" />
                          </motion.div>
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 w-20 h-20 bg-navy-200 rounded-2xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-navy-900">
                            Nenhum contrato encontrado
                          </h3>
                          <p className="text-sm text-navy-600 max-w-md">
                            Comece criando seu primeiro contrato para começar a
                            gerenciar seus acordos comerciais
                          </p>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="default"
                            size="lg"
                            className="mt-4 bg-gradient-to-r from-navy-700 to-navy-800 hover:from-navy-800 hover:to-navy-900 text-white shadow-lg"
                            onClick={() => router.push("/contracts/create")}
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Criar primeiro contrato
                          </Button>
                        </motion.div>
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract, index) => (
                    <motion.tr
                      key={contract.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "group cursor-pointer transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-navy-25 hover:to-transparent",
                        "border-b border-navy-100/50 last:border-b-0"
                      )}
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                      onMouseEnter={() => setHoveredRow(contract.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-tr from-navy-100 to-navy-200 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-navy-700" />
                            </div>
                          </div>
                          <div className="text-sm font-medium text-navy-900">
                            {contract.dataContrato &&
                            !isNaN(new Date(contract.dataContrato).getTime())
                              ? new Date(
                                  contract.dataContrato
                                ).toLocaleDateString("pt-BR")
                              : "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm font-semibold text-navy-900 truncate">
                            {contract.contrato}
                          </div>
                          <div className="text-xs text-navy-600 mt-1">
                            ID: #{contract.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-navy-800 truncate max-w-xs font-medium">
                          {contract.contratante}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-navy-800 truncate max-w-xs font-medium">
                          {contract.contratada}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-sm font-medium text-navy-900">
                            {contract.prazo} dias
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-navy-900">
                          {contract.dataVencimento &&
                          !isNaN(new Date(contract.dataVencimento).getTime())
                            ? new Date(
                                contract.dataVencimento
                              ).toLocaleDateString("pt-BR")
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={cn(
                            "inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold",
                            getCategoryColor(contract.categoriaContrato)
                          )}
                        >
                          <span className="mr-2">
                            {getCategoryIcon(contract.categoriaContrato)}
                          </span>
                          {contract.categoriaContrato}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-navy-900">
                          {contract.filial}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-navy-900">
                          {contract.multa
                            ? `R$ ${contract.multa.toLocaleString("pt-BR")}`
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {contract.arquivoPdfCaminho ? (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDownloadPdf(contract);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ) : (
                          <span className="text-navy-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/dashboard/${contract.id}/edit`);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                              title="Editar contrato"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(contract.id);
                              }}
                              disabled={deletingId === contract.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Excluir contrato"
                            >
                              {deletingId === contract.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                                />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </motion.div>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Mobile/Tablet Cards - Enhanced for 2025 */}
      <motion.div variants={containerVariants} className="md:hidden space-y-4">
        {contracts.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-16">
            <div className="relative">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-20 h-20 bg-gradient-to-tr from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <FileText className="w-10 h-10 text-navy-600" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-sm text-navy-600 mb-6 max-w-sm mx-auto">
              Comece criando seu primeiro contrato para começar a gerenciar seus
              acordos comerciais
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="default"
                size="lg"
                className="bg-gradient-to-r from-navy-700 to-navy-800 hover:from-navy-800 hover:to-navy-900 text-white shadow-lg"
                onClick={() => router.push("/contracts/create")}
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar primeiro contrato
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          contracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: index * 0.1 }}
              className="glass-morphism-strong rounded-2xl border border-navy-100/50 p-6 shadow-lg cursor-pointer overflow-hidden relative"
              onClick={() => router.push(`/contracts/${contract.id}`)}
            >
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-navy-25/30 pointer-events-none" />
              {/* Enhanced Header with modern design */}
              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        "inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold",
                        getCategoryColor(contract.categoriaContrato)
                      )}
                    >
                      <span className="mr-2">
                        {getCategoryIcon(contract.categoriaContrato)}
                      </span>
                      {contract.categoriaContrato}
                    </motion.span>
                    <div className="flex items-center space-x-2 text-xs text-navy-600">
                      <div className="w-1.5 h-1.5 bg-navy-400 rounded-full"></div>
                      <span>#{contract.id}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 truncate mb-1">
                    {contract.contrato}
                  </h3>
                  <p className="text-sm text-navy-600">
                    {contract.contratante} → {contract.contratada}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/contracts/${contract.id}/edit`);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl p-2"
                      title="Editar contrato"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(contract.id);
                      }}
                      disabled={deletingId === contract.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl p-2"
                      title="Excluir contrato"
                    >
                      {deletingId === contract.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                        />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Enhanced Content Grid with modern info cards */}
              <div className="relative z-10 grid grid-cols-2 gap-4 mb-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-navy-25 rounded-xl p-3 border border-navy-100/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-navy-600" />
                    <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                      Data
                    </span>
                  </div>
                  <p className="text-sm font-bold text-navy-900">
                    {contract.dataContrato &&
                    !isNaN(new Date(contract.dataContrato).getTime())
                      ? new Date(contract.dataContrato).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-navy-25 rounded-xl p-3 border border-navy-100/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-navy-600" />
                    <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                      Prazo
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <p className="text-sm font-bold text-navy-900">
                      {contract.prazo} dias
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-navy-25 rounded-xl p-3 border border-navy-100/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-navy-600" />
                    <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                      Vencimento
                    </span>
                  </div>
                  <p className="text-sm font-bold text-navy-900">
                    {contract.dataVencimento &&
                    !isNaN(new Date(contract.dataVencimento).getTime())
                      ? new Date(contract.dataVencimento).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-navy-25 rounded-xl p-3 border border-navy-100/50"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-navy-600" />
                    <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                      Valor
                    </span>
                  </div>
                  <p className="text-sm font-bold text-navy-900">
                    {contract.multa
                      ? `R$ ${contract.multa.toLocaleString("pt-BR")}`
                      : "—"}
                  </p>
                </motion.div>
              </div>

              {/* Additional info row */}
              <div className="relative z-10 flex items-center justify-between text-xs text-navy-600 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>{contract.filial}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span>Criado em {formatDate(contract.dataCriacao)}</span>
                </div>
              </div>

              {/* Enhanced Footer with modern PDF action */}
              <div className="relative z-10 pt-4 border-t border-navy-100/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {contract.arquivoPdfCaminho ? (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownloadPdf(contract);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-2 border border-red-200/50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Baixar PDF</span>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-2 text-navy-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium">Sem PDF</span>
                    </div>
                  )}
                </div>

                {/* Quick status indicator */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-navy-700">
                    Ativo
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Enhanced Pagination with modern styling */}
      {totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="glass-morphism-strong rounded-2xl p-6 border border-navy-100/50 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center sm:text-left"
            >
              <p className="text-sm text-navy-700 font-medium">
                Mostrando{" "}
                <span className="font-bold text-navy-900 bg-navy-100 px-2 py-1 rounded-lg">
                  {startItem}
                </span>{" "}
                a{" "}
                <span className="font-bold text-navy-900 bg-navy-100 px-2 py-1 rounded-lg">
                  {endItem}
                </span>{" "}
                de{" "}
                <span className="font-bold text-navy-900 bg-navy-100 px-2 py-1 rounded-lg">
                  {totalItems}
                </span>{" "}
                resultados
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <nav className="flex items-center space-x-1 bg-navy-50 p-1 rounded-xl border border-navy-200/50">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-lg disabled:opacity-50 hover:bg-white hover:shadow-sm"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-lg disabled:opacity-50 hover:bg-white hover:shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </motion.div>

                {/* Page numbers with enhanced styling */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = currentPage - 2 + i;
                  if (pageNumber < 1 || pageNumber > totalPages) return null;

                  return (
                    <motion.div
                      key={pageNumber}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={
                          currentPage === pageNumber ? "default" : "ghost"
                        }
                        size="sm"
                        onClick={() => onPageChange(pageNumber)}
                        className={cn(
                          "h-10 w-10 rounded-lg hidden sm:inline-flex font-semibold",
                          currentPage === pageNumber
                            ? "bg-gradient-to-r from-navy-700 to-navy-800 text-white shadow-lg"
                            : "hover:bg-white hover:shadow-sm"
                        )}
                      >
                        {pageNumber}
                      </Button>
                    </motion.div>
                  );
                }).filter(Boolean)}

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 rounded-lg disabled:opacity-50 hover:bg-white hover:shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 rounded-lg disabled:opacity-50 hover:bg-white hover:shadow-sm"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </nav>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
