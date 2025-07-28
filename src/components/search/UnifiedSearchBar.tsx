// src/components/search/UnifiedSearchBar.tsx
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
  Loader2,
  ChevronRight,
  Command,
  ArrowRight,
  History,
  TrendingUp,
  Star,
  Calendar,
  Building,
  DollarSign,
  MapPin,
  FileText,
  Clock,
  Filter,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";

interface UnifiedSearchBarProps {
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "full";
  showSuggestions?: boolean;
  showFilters?: boolean;
  showHistory?: boolean;
  onResultSelect?: (contractId: number) => void;
  onSearchSubmit?: (query: string) => void;
  autoFocus?: boolean;
  maxResults?: number;
}

// Variantes de tamanho
const sizeVariants = {
  sm: {
    container: "h-9",
    input: "h-9 text-sm pl-9 pr-16",
    icon: "w-4 h-4",
    dropdown: "max-h-[300px]",
  },
  md: {
    container: "h-11",
    input: "h-11 text-sm pl-10 pr-20",
    icon: "w-4 h-4",
    dropdown: "max-h-[400px]",
  },
  lg: {
    container: "h-12",
    input: "h-12 text-base pl-12 pr-24",
    icon: "w-5 h-5",
    dropdown: "max-h-[500px]",
  },
};

export function UnifiedSearchBar({
  placeholder = "Buscar contratos por nome, empresa, objeto...",
  className,
  size = "md",
  variant = "default",
  showSuggestions = true,
  showFilters = false,
  showHistory = true,
  onResultSelect,
  onSearchSubmit,
  autoFocus = false,
  maxResults = 8,
}: UnifiedSearchBarProps) {
  const router = useRouter();

  // State
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search hook
  const {
    query,
    setQuery,
    results,
    suggestions,
    isLoading,
    isSearching,
    totalResults,
    searchTime,
    hasResults,
    highlightText,
    getResultIcon,
  } = useAdvancedSearch({
    maxResults,
    debounceMs: 250,
    enableSuggestions: showSuggestions,
    enableHistory: showHistory,
    enableAnalytics: true,
  });

  // Size configuration
  const sizeConfig = sizeVariants[size];

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedIndex(-1);

      if (value.length > 0 || suggestions.length > 0) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
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
      if (onResultSelect) {
        onResultSelect(result.contract.id);
      } else {
        router.push(`/dashboard/${result.contract.id}`);
      }
      setShowDropdown(false);
      setQuery("");
    },
    [onResultSelect, router, setQuery]
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
          } else {
            handleSubmit(e as any);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showDropdown && inputRef.current === document.activeElement) {
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
    handleSubmit,
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
        return <History className={sizeConfig.icon + " text-gray-400"} />;
      case "popular":
        return <TrendingUp className={sizeConfig.icon + " text-orange-400"} />;
      case "category":
        return <Building className={sizeConfig.icon + " text-blue-400"} />;
      case "saved":
        return <Star className={sizeConfig.icon + " text-yellow-400"} />;
      default:
        return <Search className={sizeConfig.icon + " text-gray-400"} />;
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn("relative", sizeConfig.container)}>
          <Search
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
              sizeConfig.icon
            )}
          />

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
            className={cn(
              "w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white",
              sizeConfig.input,
              variant === "compact" && "rounded-lg",
              variant === "full" && "rounded-2xl shadow-sm"
            )}
            autoComplete="off"
            spellCheck={false}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {(isLoading || isSearching) && (
              <Loader2
                className={cn("animate-spin text-gray-400", sizeConfig.icon)}
              />
            )}

            {query && !(isLoading || isSearching) && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className={cn("text-gray-400", sizeConfig.icon)} />
              </button>
            )}

            {showFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                <Filter className={sizeConfig.icon} />
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
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50",
            sizeConfig.dropdown,
            "overflow-y-auto"
          )}
        >
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2 flex items-center justify-between">
                <span>
                  {results.length} resultado{results.length !== 1 ? "s" : ""}
                </span>
                {searchTime > 0 && (
                  <span className="text-gray-400">
                    {searchTime.toFixed(0)}ms
                  </span>
                )}
              </div>

              {results.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full px-3 py-3 text-left rounded-lg transition-all duration-200 group",
                    selectedIndex === index
                      ? "bg-blue-50 ring-2 ring-blue-200"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <span className="text-lg">
                        {getResultIcon(result.category)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className="text-sm font-semibold text-gray-900 truncate"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contrato ||
                              result.contract.contrato,
                          }}
                        />
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(result.relevanceScore)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <span
                          className="truncate max-w-[120px]"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contratante ||
                              result.contract.contratante,
                          }}
                        />
                        <ArrowRight className="w-3 h-3 flex-shrink-0" />
                        <span
                          className="truncate max-w-[120px]"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contratada ||
                              result.contract.contratada,
                          }}
                        />
                      </div>

                      <p
                        className="text-xs text-gray-500 truncate mb-2"
                        dangerouslySetInnerHTML={{
                          __html:
                            result.highlightedText.objeto ||
                            result.contract.objeto,
                        }}
                      />

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(result.contract.dataContrato)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {result.contract.categoriaContrato}
                        </span>
                        {result.contract.multa && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(result.contract.multa)}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </div>
                </button>
              ))}

              {totalResults > results.length && (
                <div className="px-3 py-2 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSearchSubmit) {
                        onSearchSubmit(query);
                      } else {
                        router.push(`/search?q=${encodeURIComponent(query)}`);
                      }
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
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                Sugestões
              </div>

              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left rounded-lg transition-colors group",
                    selectedIndex === results.length + index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getSuggestionIcon(suggestion.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {suggestion.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">
                        {suggestion.type === "recent" && "Busca recente"}
                        {suggestion.type === "popular" && "Busca popular"}
                        {suggestion.type === "category" && "Categoria"}
                        {suggestion.type === "saved" && "Busca salva"}
                      </p>
                    </div>

                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim() &&
            results.length === 0 &&
            !isLoading &&
            !isSearching && (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Tente buscar com outros termos
                </p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" variant="ghost" onClick={handleClear}>
                    Limpar busca
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`);
                      setShowDropdown(false);
                    }}
                  >
                    Busca avançada
                  </Button>
                </div>
              </div>
            )}

          {/* Loading state */}
          {(isLoading || isSearching) && query.trim() && (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Buscando contratos...</p>
            </div>
          )}

          {/* Quick Actions */}
          {variant === "full" && !query.trim() && (
            <div className="border-t border-gray-100 p-3">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Ações Rápidas
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/dashboard/create");
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Busca Avançada
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
