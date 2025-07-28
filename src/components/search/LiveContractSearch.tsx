// src/components/search/LiveContractSearch.tsx
"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useLiveContractSearch } from "@/hooks/useLiveContractSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Loader2,
  FileText,
  Building,
  Tag,
  Folder,
  ChevronRight,
  Clock,
  Filter,
  Command,
} from "lucide-react";
import { formatDate } from "@/lib/utils/formatters";

interface LiveContractSearchProps {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showAdvancedFilters?: boolean;
  onSelectContract?: (contractId: number) => void;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  showDropdown?: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "exact_match":
      return FileText;
    case "contractor":
    case "contracted":
      return Building;
    case "object":
      return Tag;
    case "category":
      return Folder;
    default:
      return FileText;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "exact_match":
      return "Contrato";
    case "contractor":
      return "Contratante";
    case "contracted":
      return "Contratada";
    case "object":
      return "Objeto";
    case "category":
      return "Categoria";
    default:
      return "Contrato";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "exact_match":
      return "text-blue-600 bg-blue-50";
    case "contractor":
      return "text-green-600 bg-green-50";
    case "contracted":
      return "text-purple-600 bg-purple-50";
    case "object":
      return "text-orange-600 bg-orange-50";
    case "category":
      return "text-gray-600 bg-gray-50";
    default:
      return "text-blue-600 bg-blue-50";
  }
};

export function LiveContractSearch({
  placeholder = "Buscar contratos pelo nome, empresa, objeto...",
  className,
  size = "md",
  showAdvancedFilters = false,
  onSelectContract,
  onSearch,
  autoFocus = false,
  showDropdown: controlledShowDropdown,
}: LiveContractSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    results,
    isLoading,
    hasResults,
    totalCount,
    setSearchQuery,
    clearSearch,
    showDropdown,
    setShowDropdown,
    selectResult,
    getHighlightedText,
  } = useLiveContractSearch({
    minSearchLength: 1, // Buscar desde o primeiro caractere
    debounceMs: 250, // Resposta mais rápida
    maxResults: 8,
    enableAutoSearch: true,
  });

  // Use controlled dropdown state if provided
  const displayDropdown = controlledShowDropdown ?? showDropdown;

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (value.length > 0) {
        setShowDropdown(true);
      }
    },
    [setSearchQuery, setShowDropdown]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (onSearch) {
        onSearch(searchQuery);
      }

      if (hasResults && results.length > 0) {
        selectResult(results[0]);
      }

      setShowDropdown(false);
    },
    [searchQuery, onSearch, hasResults, results, selectResult, setShowDropdown]
  );

  // Handle result selection
  const handleSelectResult = useCallback(
    (result: any) => {
      if (onSelectContract) {
        onSelectContract(result.contract.id);
      } else {
        selectResult(result);
      }
      setShowDropdown(false);
    },
    [onSelectContract, selectResult, setShowDropdown]
  );

  // Handle clear search
  const handleClear = useCallback(() => {
    clearSearch();
    inputRef.current?.focus();
  }, [clearSearch]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (displayDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [displayDropdown, setShowDropdown]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Size classes
  const sizeClasses = {
    sm: "h-8 text-sm",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
              iconSizes[size]
            )}
          />

          <Input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className={cn(
              "w-full pl-10 pr-20",
              sizeClasses[size],
              "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            )}
            autoComplete="off"
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <Loader2
                className={cn("animate-spin text-gray-400", iconSizes[size])}
              />
            )}

            {searchQuery && !isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className={cn("text-gray-400", iconSizes[size])} />
              </button>
            )}

            {showAdvancedFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2"
              >
                <Filter className={iconSizes[size]} />
              </Button>
            )}

            {size === "lg" && (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                <kbd className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded">
                  <Command className="h-3 w-3 inline" />K
                </kbd>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Results Dropdown */}
      {displayDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
        >
          {isLoading && searchQuery.length > 0 ? (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Buscando contratos...</p>
            </div>
          ) : hasResults ? (
            <>
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                  {totalCount > results.length
                    ? `${results.length} de ${totalCount} resultados`
                    : `${results.length} resultado${results.length !== 1 ? "s" : ""}`}
                </div>

                {results.map((result, index) => {
                  const Icon = getTypeIcon(result.type);
                  const typeColor = getTypeColor(result.type);

                  return (
                    <button
                      key={`${result.id}-${result.type}`}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      onMouseEnter={() => {}} // Pode adicionar hover state aqui
                      className="w-full px-3 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            typeColor
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: getHighlightedText(
                                    result.contract.contrato ||
                                      `Contrato #${result.contract.id}`,
                                    searchQuery
                                  ),
                                }}
                              />
                            </p>
                            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                              {getTypeLabel(result.type)}
                            </span>
                          </div>

                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">
                              {result.contract.contratante}
                            </span>
                            {" → "}
                            <span className="font-medium">
                              {result.contract.contratada}
                            </span>
                          </p>

                          <p
                            className="text-xs text-gray-500 truncate"
                            dangerouslySetInnerHTML={{
                              __html: getHighlightedText(
                                result.contract.objeto,
                                searchQuery
                              ),
                            }}
                          />

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(result.contract.dataContrato)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {result.contract.categoriaContrato}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {totalCount > results.length && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSearch) {
                        onSearch(searchQuery);
                      }
                      setShowDropdown(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver todos os {totalCount} resultados →
                  </button>
                </div>
              )}
            </>
          ) : searchQuery.length > 0 ? (
            <div className="p-8 text-center">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                Nenhum contrato encontrado
              </p>
              <p className="text-xs text-gray-500">
                Tente buscar por outros termos
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-center mb-4">
                <Search className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Digite para buscar contratos
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded text-center">
                  <strong>Busque por:</strong>
                  <br />
                  Número, Nome
                </div>
                <div className="p-2 bg-gray-50 rounded text-center">
                  <strong>Ou por:</strong>
                  <br />
                  Empresa, Objeto
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
