"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ContractCategory,
  ContractFilters as IContractFilters,
} from "@/lib/types/contract";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  X,
  Download,
  Calendar,
  Building,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ContractFiltersProps {
  filters: IContractFilters;
  onFilterChange: (filters: Partial<IContractFilters>) => void;
  onExport?: () => void;
  isExporting?: boolean;
  totalItems?: number;
}

// Performance-optimized debounced input hook
const useDebounced = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Advanced filter state management with optimistic updates
const useFilterState = (
  initialFilters: IContractFilters,
  onFilterChange: (filters: Partial<IContractFilters>) => void
) => {
  const [localFilters, setLocalFilters] =
    useState<IContractFilters>(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounced search input for performance optimization
  const debouncedSearch = useDebounced(localFilters.contratante || "", 500);

  // Effect to sync debounced search with parent state
  useEffect(() => {
    if (debouncedSearch !== undefined) {
      onFilterChange({ contratante: debouncedSearch || undefined });
    }
  }, [debouncedSearch, onFilterChange]);

  // Optimized filter update with batching
  const updateFilter = useCallback(
    (updates: Partial<IContractFilters>) => {
      setLocalFilters((prev) => ({ ...prev, ...updates }));
      onFilterChange({ ...updates, page: 1 }); // Reset to first page on filter change
    },
    [onFilterChange]
  );

  // Memoized active filters count for performance
  const activeFiltersCount = useMemo(() => {
    const activeKeys = [
      "contratante",
      "dataInicio",
      "dataFim",
      "categoriaContrato",
      "filial",
    ] as const;

    return activeKeys.reduce((count, key) => {
      const value = localFilters[key];
      return count + (value && value !== "" ? 1 : 0);
    }, 0);
  }, [localFilters]);

  return {
    localFilters,
    setLocalFilters,
    isExpanded,
    setIsExpanded,
    updateFilter,
    activeFiltersCount,
  };
};

export function ContractFilters({
  filters,
  onFilterChange,
  onExport,
  isExporting = false,
  totalItems = 0,
}: ContractFiltersProps) {
  const {
    localFilters,
    setLocalFilters,
    isExpanded,
    setIsExpanded,
    updateFilter,
    activeFiltersCount,
  } = useFilterState(filters, onFilterChange);

  // Memoized category options for performance
  const categoryOptions = useMemo(
    () => [
      { value: ContractCategory.Software, label: "💻 Software", icon: "💻" },
      { value: ContractCategory.Aluguel, label: "🏢 Aluguel", icon: "🏢" },
      { value: ContractCategory.TI, label: "⚙️ TI", icon: "⚙️" },
      { value: ContractCategory.Outros, label: "📁 Outros", icon: "📁" },
    ],
    []
  );

  // Optimized reset handler with batch updates
  const handleReset = useCallback(() => {
    const resetFilters = {
      contratante: "",
      dataInicio: undefined,
      dataFim: undefined,
      categoriaContrato: undefined,
      filial: "",
      page: 1,
    };

    setLocalFilters((prev) => ({ ...prev, ...resetFilters }));
    onFilterChange(resetFilters);
  }, [onFilterChange, setLocalFilters]);

  // Performance-optimized search input handler
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalFilters((prev) => ({ ...prev, contratante: value }));
    },
    [setLocalFilters]
  );

  // Date formatting utility with validation
  const formatDateForInput = useCallback(
    (dateString: string | undefined): string => {
      if (!dateString) return "";
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        // Otherwise, parse and format
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      } catch {
        return "";
      }
    },
    []
  );

  // Active filters with removal functionality
  const ActiveFilters = React.memo(() => {
    if (activeFiltersCount === 0) return null;

    const activeFilters = [];

    if (localFilters.contratante) {
      activeFilters.push({
        key: "contratante",
        label: `Contratante: ${localFilters.contratante}`,
        remove: () => updateFilter({ contratante: "" }),
      });
    }

    if (localFilters.categoriaContrato) {
      const category = categoryOptions.find(
        (opt) => opt.value === localFilters.categoriaContrato
      );
      activeFilters.push({
        key: "categoriaContrato",
        label: `Categoria: ${category?.label || localFilters.categoriaContrato}`,
        remove: () => updateFilter({ categoriaContrato: undefined }),
      });
    }

    if (localFilters.filial) {
      activeFilters.push({
        key: "filial",
        label: `Filial: ${localFilters.filial}`,
        remove: () => updateFilter({ filial: "" }),
      });
    }

    if (localFilters.dataInicio || localFilters.dataFim) {
      const startDate = localFilters.dataInicio
        ? new Date(localFilters.dataInicio).toLocaleDateString()
        : "...";
      const endDate = localFilters.dataFim
        ? new Date(localFilters.dataFim).toLocaleDateString()
        : "...";

      activeFilters.push({
        key: "dateRange",
        label: `Período: ${startDate} - ${endDate}`,
        remove: () =>
          updateFilter({ dataInicio: undefined, dataFim: undefined }),
      });
    }

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">
          Filtros ativos:
        </span>
        {activeFilters.map((filter) => (
          <Badge
            key={filter.key}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            {filter.label}
            <button
              onClick={filter.remove}
              className="ml-1 hover:text-gray-600"
              aria-label={`Remover filtro ${filter.label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    );
  });

  ActiveFilters.displayName = "ActiveFilters";

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Filtros de Pesquisa</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="info" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            {onExport && (
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exportando..." : "Exportar Excel"}
              </Button>
            )}

            {/* Toggle Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {isExpanded ? "Ocultar" : "Filtros"}
            </Button>
          </div>
        </div>

        {totalItems > 0 && (
          <CardDescription>
            {totalItems} contrato{totalItems !== 1 ? "s" : ""} encontrado
            {totalItems !== 1 ? "s" : ""}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <ActiveFilters />

        {/* Quick Search - Always Visible */}
        <div className="mb-4">
          <Label
            htmlFor="quickSearch"
            className="text-sm font-medium mb-2 block"
          >
            Pesquisa Rápida
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="quickSearch"
              type="text"
              value={localFilters.contratante || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por contratante..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Categoria
                </Label>
                <Select
                  value={localFilters.categoriaContrato || "all"} // Use "all" instead of ""
                  onValueChange={(value) =>
                    updateFilter({
                      categoriaContrato:
                        value === "all"
                          ? undefined
                          : (value as ContractCategory), // Change logic here
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>{" "}
                    {/* Use "all" instead of "" */}
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Filial
                </Label>
                <Input
                  type="text"
                  value={localFilters.filial || ""}
                  onChange={(e) => updateFilter({ filial: e.target.value })}
                  placeholder="Nome da filial..."
                />
              </div>

              {/* Page Size */}
              <div className="space-y-2">
                <Label>Itens por página</Label>
                <Select
                  value={String(localFilters.pageSize || 10)}
                  onValueChange={(value) =>
                    updateFilter({ pageSize: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Início
                </Label>
                <Input
                  type="date"
                  value={formatDateForInput(localFilters.dataInicio)}
                  onChange={(e) =>
                    updateFilter({
                      dataInicio: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data Fim
                </Label>
                <Input
                  type="date"
                  value={formatDateForInput(localFilters.dataFim)}
                  onChange={(e) =>
                    updateFilter({
                      dataFim: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpar filtros
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => onFilterChange({ page: 1 })}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Aplicar filtros
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
