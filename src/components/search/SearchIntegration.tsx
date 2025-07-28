// src/components/search/SearchIntegration.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Filter,
  Clock,
  TrendingUp,
  Star,
  Command,
  ChevronRight,
  Loader2,
  ArrowRight,
  BookmarkPlus,
  History,
  Tag,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  MoreHorizontal,
  FileText,
  Download,
  Share2,
  Settings,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";

// Header Search Component (Compact version for header)
interface HeaderSearchProps {
  placeholder?: string;
  className?: string;
  onSearchSubmit?: (query: string) => void;
  showQuickActions?: boolean;
}

export function HeaderSearch({
  placeholder = "Buscar contratos, empresas, categorias...",
  className,
  onSearchSubmit,
  showQuickActions = true,
}: HeaderSearchProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    results,
    suggestions,
    isLoading,
    isSearching,
    totalResults,
    searchTime,
    highlightText,
    getResultIcon,
  } = useAdvancedSearch({
    maxResults: 6,
    debounceMs: 200,
    enableSuggestions: true,
    enableHistory: true,
  });

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedIndex(-1);

      if (value.length > 0 || suggestions.length > 0) {
        setShowDropdown(true);
      }
    },
    [setQuery, suggestions.length]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (query.trim()) {
        if (onSearchSubmit) {
          onSearchSubmit(query.trim());
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
        setShowDropdown(false);
      }
    },
    [query, onSearchSubmit, router]
  );

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: any) => {
      router.push(`/dashboard/${result.contract.id}`);
      setShowDropdown(false);
      setQuery("");
    },
    [router, setQuery]
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      setQuery(suggestion.text);
      setShowDropdown(false);

      setTimeout(() => {
        if (onSearchSubmit) {
          onSearchSubmit(suggestion.text);
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
        }
      }, 100);
    },
    [onSearchSubmit, router, setQuery]
  );

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, [setQuery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;

      const totalItems = results.length + suggestions.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (selectedIndex < results.length) {
              handleResultSelect(results[selectedIndex]);
            } else {
              const suggestionIndex = selectedIndex - results.length;
              handleSuggestionSelect(suggestions[suggestionIndex]);
            }
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showDropdown) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [
    showDropdown,
    selectedIndex,
    results,
    suggestions,
    handleResultSelect,
    handleSuggestionSelect,
  ]);

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

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "recent":
        return <History className="w-4 h-4 text-gray-400" />;
      case "popular":
        return <TrendingUp className="w-4 h-4 text-orange-400" />;
      case "category":
        return <Tag className="w-4 h-4 text-blue-400" />;
      case "saved":
        return <Star className="w-4 h-4 text-yellow-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={cn("relative w-full max-w-lg", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />

          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length > 0 || suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className="w-full h-10 pl-10 pr-16 text-sm border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg bg-white/80 backdrop-blur-sm"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {(isLoading || isSearching) && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            )}

            {query && !(isLoading || isSearching) && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 ml-1">
              <kbd className="px-1.5 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">
                <Command className="h-2.5 w-2.5 inline" />K
              </kbd>
            </div>
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
        >
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-2 flex items-center justify-between">
                <span>
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </span>
                {searchTime > 0 && (
                  <span className="text-slate-400">
                    {searchTime.toFixed(0)}ms
                  </span>
                )}
              </div>

              {results.slice(0, 4).map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left rounded-lg transition-colors group",
                    selectedIndex === index ? "bg-blue-50" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">
                        {getResultIcon(result.category)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className="text-sm font-medium text-slate-900 truncate"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contrato ||
                              result.contract.contrato,
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                        <span
                          className="truncate max-w-[100px]"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contratante ||
                              result.contract.contratante,
                          }}
                        />
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span
                          className="truncate max-w-[100px]"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contratada ||
                              result.contract.contratada,
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(result.contract.dataContrato)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {result.contract.categoriaContrato}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>
                </button>
              ))}

              {results.length > 4 && (
                <div className="px-3 py-2 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setShowDropdown(false);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                  >
                    Ver todos os {totalResults} resultados
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {!query.trim() && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-2">
                Sugestões
              </div>

              {suggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full px-3 py-2 text-left rounded-lg transition-colors group",
                    selectedIndex === results.length + index
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getSuggestionIcon(suggestion.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {suggestion.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 capitalize">
                        {suggestion.type === "recent" && "Recente"}
                        {suggestion.type === "popular" && "Popular"}
                        {suggestion.type === "category" && "Categoria"}
                        {suggestion.type === "saved" && "Salva"}
                      </p>
                    </div>

                    <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="border-t border-slate-100 p-2">
              <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Ações Rápidas
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/dashboard/create");
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Novo Contrato
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/search");
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Busca Avançada
                </button>
              </div>
            </div>
          )}

          {/* No results */}
          {query.trim() &&
            results.length === 0 &&
            !isLoading &&
            !isSearching && (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-slate-900 mb-1">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Tente buscar com outros termos
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    setShowDropdown(false);
                  }}
                  className="text-xs"
                >
                  Busca Avançada
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

// Full Search Page Component
interface FullSearchPageProps {
  initialQuery?: string;
  className?: string;
}

export function FullSearchPage({
  initialQuery = "",
  className,
}: FullSearchPageProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const {
    query,
    setQuery,
    results,
    suggestions,
    filters,
    setFilters,
    resetFilters,
    isLoading,
    isSearching,
    totalResults,
    searchTime,
    highlightText,
    getResultIcon,
    formatFiltersForDisplay,
    saveSearch,
    exportResults,
    getAnalytics,
  } = useAdvancedSearch({
    maxResults: 50,
    debounceMs: 300,
    enableSuggestions: true,
    enableHistory: true,
    enableAnalytics: true,
  });

  // Initialize with query from URL
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query, setQuery]);

  const activeFiltersCount = formatFiltersForDisplay().length;

  return (
    <div className={cn("min-h-screen bg-slate-50", className)}>
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar contratos, empresas, categorias..."
                  className="w-full h-12 pl-11 pr-20 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  autoComplete="off"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {(isLoading || isSearching) && (
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  )}
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2",
                showFilters && "bg-blue-50 text-blue-600 border-blue-200"
              )}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setViewMode(viewMode === "list" ? "grid" : "list")
                }
                title={`Visualização em ${viewMode === "list" ? "grade" : "lista"}`}
              >
                {viewMode === "list" ? (
                  <MoreHorizontal className="w-4 h-4" />
                ) : (
                  <MoreHorizontal className="w-4 h-4 rotate-90" />
                )}
              </Button>

              {results.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => exportResults("csv")}
                    title="Exportar resultados"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {query.trim() && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const name = prompt("Nome para salvar a busca:");
                        if (name) saveSearch(name);
                      }}
                      title="Salvar busca"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Search Stats */}
          {query.trim() && (
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-4">
                <span>
                  {isSearching
                    ? "Buscando..."
                    : `${totalResults} resultado${totalResults !== 1 ? "s" : ""}`}
                </span>
                {searchTime > 0 && !isSearching && (
                  <span className="text-slate-400">
                    ({searchTime.toFixed(0)}ms)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Limpar filtros
                  </button>
                )}

                <select
                  value={`${filters.sortBy}_${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("_");
                    setFilters({
                      sortBy: sortBy as any,
                      sortOrder: sortOrder as any,
                    });
                  }}
                  className="text-sm border-slate-300 rounded-lg"
                >
                  <option value="relevance_desc">Mais relevante</option>
                  <option value="date_desc">Mais recente</option>
                  <option value="date_asc">Mais antigo</option>
                  <option value="value_desc">Maior valor</option>
                  <option value="value_asc">Menor valor</option>
                  <option value="alphabetical_asc">A-Z</option>
                  <option value="alphabetical_desc">Z-A</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formatFiltersForDisplay().map((filter, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {filter}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 sticky top-24">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Filtros Avançados
                </h3>

                {/* Category Filters */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Categoria
                  </h4>
                  <div className="space-y-2">
                    {["Software", "Aluguel", "TI", "Outros"].map((category) => (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                categories: [
                                  ...filters.categories,
                                  category as any,
                                ],
                              });
                            } else {
                              setFilters({
                                categories: filters.categories.filter(
                                  (c) => c !== category
                                ),
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Período
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Data inicial
                      </label>
                      <input
                        type="date"
                        value={
                          filters.dateRange.start
                            ? filters.dateRange.start
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFilters({
                            dateRange: {
                              ...filters.dateRange,
                              start: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Data final
                      </label>
                      <input
                        type="date"
                        value={
                          filters.dateRange.end
                            ? filters.dateRange.end.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setFilters({
                            dateRange: {
                              ...filters.dateRange,
                              end: e.target.value
                                ? new Date(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Value Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">
                    Valor (R$)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Valor mínimo
                      </label>
                      <input
                        type="number"
                        value={filters.valueRange.min || ""}
                        onChange={(e) =>
                          setFilters({
                            valueRange: {
                              ...filters.valueRange,
                              min: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Valor máximo
                      </label>
                      <input
                        type="number"
                        value={filters.valueRange.max || ""}
                        onChange={(e) =>
                          setFilters({
                            valueRange: {
                              ...filters.valueRange,
                              max: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            },
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Sem limite"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="flex-1"
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="flex-1"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {query.trim() ? (
              results.length > 0 ? (
                <div
                  className={cn(
                    "space-y-4",
                    viewMode === "grid" &&
                      "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
                  )}
                >
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        window.open(
                          `/dashboard/${result.contract.id}`,
                          "_blank"
                        )
                      }
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">
                            {getResultIcon(result.category)}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3
                              className="text-lg font-semibold text-slate-900"
                              dangerouslySetInnerHTML={{
                                __html:
                                  result.highlightedText.contrato ||
                                  result.contract.contrato,
                              }}
                            />
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-slate-500">
                                  {Math.round(result.relevanceScore)}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {result.matchType}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                            <span
                              dangerouslySetInnerHTML={{
                                __html:
                                  result.highlightedText.contratante ||
                                  result.contract.contratante,
                              }}
                            />
                            <ArrowRight className="w-4 h-4" />
                            <span
                              dangerouslySetInnerHTML={{
                                __html:
                                  result.highlightedText.contratada ||
                                  result.contract.contratada,
                              }}
                            />
                          </div>

                          <p
                            className="text-sm text-slate-600 mb-4 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html:
                                result.highlightedText.objeto ||
                                result.contract.objeto,
                            }}
                          />

                          <div className="flex items-center gap-6 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(result.contract.dataContrato)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              {result.contract.categoriaContrato}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {result.contract.filial}
                            </span>
                            {result.contract.multa && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {formatCurrency(result.contract.multa)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Nenhum resultado encontrado
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Tente ajustar sua busca ou remover alguns filtros
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => setQuery("")}>
                      Limpar busca
                    </Button>
                    <Button variant="outline" onClick={resetFilters}>
                      Remover filtros
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Buscando contratos...</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Busca Avançada de Contratos
                </h3>
                <p className="text-slate-600 mb-6">
                  Digite um termo para começar a busca
                </p>

                {/* Popular Searches */}
                {suggestions.length > 0 && (
                  <div className="max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                      Sugestões populares
                    </h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions
                        .filter((s) => s.type === "popular")
                        .slice(0, 6)
                        .map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => setQuery(suggestion.text)}
                            className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            {suggestion.text}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
