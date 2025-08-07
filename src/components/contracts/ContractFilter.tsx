// src/components/contracts/ContractFilters.tsx
"use client";

import { useState } from "react";
import {
  ContractCategory,
  Filial,
  ContractFilters as IContractFilters,
} from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { Search, Filter, X, Download } from "lucide-react";

interface ContractFiltersProps {
  filters: IContractFilters;
  onFilterChange: (filters: Partial<IContractFilters>) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export function ContractFilters({
  filters,
  onFilterChange,
  onExport,
  isExporting = false,
}: ContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    onFilterChange({
      contratante: "",
      dataInicio: undefined,
      dataFim: undefined,
      categoriaContrato: undefined,
      filial: undefined,
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.contratante ||
    filters.dataInicio ||
    filters.dataFim ||
    filters.categoriaContrato ||
    filters.filial;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Pesquisa
        </h3>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Contratante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contratante
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.contratante || ""}
                  onChange={(e) =>
                    onFilterChange({ contratante: e.target.value })
                  }
                  placeholder="Nome do contratante..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={filters.categoriaContrato || ""}
                onChange={(e) =>
                  onFilterChange({
                    categoriaContrato: e.target.value as ContractCategory,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as categorias</option>
                <option value="Software">💻 Software</option>
                <option value="Aluguel">🏢 Aluguel</option>
                <option value="TI">⚙️ TI</option>
                <option value="Outros">📁 Outros</option>
              </select>
            </div>

            {/* Filial */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filial
              </label>
              <input
                type="text"
                value={filters.filial || ""}
                onChange={(e) =>
                  onFilterChange({
                    filial: e.target.value
                      ? (Number(e.target.value) as Filial)
                      : undefined,
                  })
                }
                placeholder="Nome da filial..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={
                  filters.dataInicio
                    ? new Date(filters.dataInicio).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onFilterChange({
                    dataInicio: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={
                  filters.dataFim
                    ? new Date(filters.dataFim).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  onFilterChange({
                    dataFim: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Itens por página
              </label>
              <select
                value={filters.pageSize || 10}
                onChange={(e) =>
                  onFilterChange({ pageSize: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                leftIcon={<X className="w-4 h-4" />}
              >
                Limpar filtros
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => onFilterChange({ page: 1 })}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && !isExpanded && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.contratante && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Contratante: {filters.contratante}
              <button
                onClick={() => onFilterChange({ contratante: "" })}
                className="ml-2 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.categoriaContrato && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Categoria: {filters.categoriaContrato}
              <button
                onClick={() => onFilterChange({ categoriaContrato: undefined })}
                className="ml-2 hover:text-green-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.filial && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Filial: {filters.filial}
              <button
                onClick={() => onFilterChange({ filial: undefined })}
                className="ml-2 hover:text-purple-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(filters.dataInicio || filters.dataFim) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Período:{" "}
              {filters.dataInicio
                ? new Date(filters.dataInicio).toLocaleDateString()
                : "..."}{" "}
              -
              {filters.dataFim
                ? new Date(filters.dataFim).toLocaleDateString()
                : "..."}
              <button
                onClick={() =>
                  onFilterChange({ dataInicio: undefined, dataFim: undefined })
                }
                className="ml-2 hover:text-orange-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
