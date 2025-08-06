// src/components/contracts/ContractTable.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Contract } from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/formatters";
import { contractsApi } from "@/lib/api/contracts";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

// CSS para line-clamp e scrollbar
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

    .scrollbar-thin::-webkit-scrollbar {
    height: 4px;
  }

  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Aluguel":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "TI":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="w-full">
      <style dangerouslySetInnerHTML={{ __html: lineClampStyles }} />
      {/* Desktop Table - Visible on md and larger screens */}
      <div className="hidden md:block overflow-x-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-max divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Data
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Contrato
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Contratante
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Contratada
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Prazo
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Vencimento
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Categoria
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Filial
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Valor
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                PDF
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhum contrato encontrado</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => router.push("/contracts/create")}
                    >
                      Criar primeiro contrato
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {contract.dataContrato &&
                    !isNaN(new Date(contract.dataContrato).getTime())
                      ? new Date(contract.dataContrato).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {contract.contrato}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {contract.contratante}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {contract.contratada}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {contract.prazo} dias
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {contract.dataVencimento &&
                    !isNaN(new Date(contract.dataVencimento).getTime())
                      ? new Date(contract.dataVencimento).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border",
                        getCategoryColor(contract.categoriaContrato)
                      )}
                    >
                      <span className="mr-1">
                        {getCategoryIcon(contract.categoriaContrato)}
                      </span>
                      {contract.categoriaContrato}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {contract.filial}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                    {contract.multa
                      ? `R$ ${contract.multa.toLocaleString("pt-BR")}`
                      : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    {contract.arquivoPdfCaminho ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadPdf(contract)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/contracts/${contract.id}/edit`);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Editar contrato"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(contract.id);
                        }}
                        disabled={deletingId === contract.id}
                        className="text-red-700"
                        title="Excluir contrato"
                      >
                        {deletingId === contract.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards - Visible on screens smaller than md */}
      <div className="md:hidden space-y-4">
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-500">Nenhum contrato encontrado</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/contracts/create")}
            >
              Criar primeiro contrato
            </Button>
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/contracts/${contract.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                        getCategoryColor(contract.categoriaContrato)
                      )}
                    >
                      <span className="mr-1">
                        {getCategoryIcon(contract.categoriaContrato)}
                      </span>
                      {contract.categoriaContrato}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{contract.id}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {contract.contrato}
                  </h3>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/contracts/${contract.id}/edit`);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                    title="Editar contrato"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(contract.id);
                    }}
                    disabled={deletingId === contract.id}
                    className="text-red-600 hover:text-red-700"
                    title="Excluir contrato"
                  >
                    {deletingId === contract.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {/* Left Column */}
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Contratante:
                    </span>
                    <p className="text-gray-900 truncate">
                      {contract.contratante}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Contratada:
                    </span>
                    <p className="text-gray-900 truncate">
                      {contract.contratada}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Data:
                    </span>
                    <p className="text-gray-900">
                      {contract.dataContrato &&
                      !isNaN(new Date(contract.dataContrato).getTime())
                        ? new Date(contract.dataContrato).toLocaleDateString(
                            "pt-BR"
                          )
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Prazo:
                    </span>
                    <p className="text-gray-900">{contract.prazo} dias</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Vencimento:
                    </span>
                    <p className="text-gray-900">
                      {contract.dataVencimento &&
                      !isNaN(new Date(contract.dataVencimento).getTime())
                        ? new Date(contract.dataVencimento).toLocaleDateString(
                            "pt-BR"
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Filial:
                    </span>
                    <p className="text-gray-900">{contract.filial}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      Valor:
                    </span>
                    <p className="text-gray-900">
                      {contract.multa
                        ? `R$ ${contract.multa.toLocaleString("pt-BR")}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {contract.arquivoPdfCaminho ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadPdf(contract)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span className="text-xs">PDF</span>
                    </Button>
                  ) : (
                    <span className="text-gray-400 text-xs">Sem PDF</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Criado em {formatDate(contract.dataCriacao)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startItem}</span> a{" "}
                <span className="font-medium">{endItem}</span> de{" "}
                <span className="font-medium">{totalItems}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className="rounded-l-md"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = currentPage - 2 + i;
                  if (pageNumber < 1 || pageNumber > totalPages) return null;

                  return (
                    <Button
                      key={pageNumber}
                      variant={
                        currentPage === pageNumber ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => onPageChange(pageNumber)}
                      className="hidden sm:inline-flex"
                    >
                      {pageNumber}
                    </Button>
                  );
                }).filter(Boolean)}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-r-md"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
