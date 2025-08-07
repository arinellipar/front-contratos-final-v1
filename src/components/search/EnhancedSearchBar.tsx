// src/components/search/EnhancedSearchBar.tsx
"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { Contract, ContractCategory } from "@/lib/types/contract";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  Search,
  X,
  Filter,
  Calendar,
  Building,
  Tag,
  Star,
  Clock,
  ChevronRight,
  Command,
  ArrowRight,
  BookmarkPlus,
  History,
  TrendingUp,
  FileText,
  Users,
  MapPin,
  DollarSign,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils/formatters";

// Interfaces
interface SearchResult {
  id: number;
  contract: Contract;
  relevanceScore: number;
  matchType: "exact" | "partial" | "fuzzy";
  matchedFields: string[];
  highlightedText: {
    [field: string]: string;
  };
  category: string;
  dateScore: number;
  valueScore: number;
}

interface SearchFilters {
  categories: ContractCategory[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  valueRange: {
    min?: number;
    max?: number;
  };
  status: string[];
  branches: string[];
  contractors: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "popular" | "category" | "contractor" | "branch";
  icon: React.ReactNode;
  count?: number;
}

interface EnhancedSearchBarProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showHistory?: boolean;
  maxResults?: number;
  onResultSelect?: (contract: Contract) => void;
  onSearchSubmit?: (query: string, filters: SearchFilters) => void;
}

// Advanced search algorithm with fuzzy matching
class SearchEngine {
  private contracts: Contract[] = [];
  private index: Map<string, Set<number>> = new Map();
  private stopWords = new Set([
    "de",
    "da",
    "do",
    "em",
    "na",
    "no",
    "com",
    "para",
    "por",
    "e",
    "o",
    "a",
  ]);

  setContracts(contracts: Contract[]) {
    this.contracts = contracts.filter((c) => c.status === 1); // Only active contracts
    this.buildIndex();
  }

  private buildIndex() {
    this.index.clear();

    this.contracts.forEach((contract, idx) => {
      const searchableText = [
        contract.contrato,
        contract.contratante,
        contract.contratada,
        contract.objeto,
        contract.categoriaContrato,
        contract.filial,
        contract.observacoes,
      ]
        .join(" ")
        .toLowerCase();

      // Tokenize and index
      const tokens = this.tokenize(searchableText);
      tokens.forEach((token) => {
        if (!this.index.has(token)) {
          this.index.set(token, new Set());
        }
        this.index.get(token)!.add(idx);
      });
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !this.stopWords.has(token));
  }

  private calculateLevenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private fuzzyMatch(query: string, text: string, threshold = 0.7): boolean {
    if (text.includes(query)) return true;

    const distance = this.calculateLevenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= threshold;
  }

  search(query: string, filters: Partial<SearchFilters> = {}): SearchResult[] {
    if (!query.trim()) return [];

    const queryTokens = this.tokenize(query);
    const results = new Map<number, SearchResult>();

    // Find matches
    queryTokens.forEach((token) => {
      // Exact matches
      if (this.index.has(token)) {
        this.index.get(token)!.forEach((contractIdx) => {
          this.addResult(results, contractIdx, token, query, "exact", 10);
        });
      }

      // Partial matches
      this.index.forEach((contractIndices, indexedToken) => {
        if (indexedToken.includes(token) || token.includes(indexedToken)) {
          contractIndices.forEach((contractIdx) => {
            this.addResult(results, contractIdx, token, query, "partial", 5);
          });
        }
      });

      // Fuzzy matches
      this.index.forEach((contractIndices, indexedToken) => {
        if (this.fuzzyMatch(token, indexedToken, 0.8)) {
          contractIndices.forEach((contractIdx) => {
            this.addResult(results, contractIdx, token, query, "fuzzy", 2);
          });
        }
      });
    });

    // Apply filters and sort
    return Array.from(results.values())
      .filter((result) => this.applyFilters(result, filters))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private addResult(
    results: Map<number, SearchResult>,
    contractIdx: number,
    matchedToken: string,
    originalQuery: string,
    matchType: "exact" | "partial" | "fuzzy",
    baseScore: number
  ) {
    const contract = this.contracts[contractIdx];
    if (!contract) return;

    const existingResult = results.get(contractIdx);

    if (existingResult) {
      existingResult.relevanceScore += baseScore;
      existingResult.matchedFields = [
        ...new Set([...existingResult.matchedFields, matchedToken]),
      ];
    } else {
      const highlightedText = this.generateHighlights(contract, originalQuery);

      results.set(contractIdx, {
        id: contract.id,
        contract,
        relevanceScore: baseScore,
        matchType,
        matchedFields: [matchedToken],
        highlightedText,
        category: contract.categoriaContrato,
        dateScore: this.calculateDateScore(contract.dataContrato),
        valueScore: this.calculateValueScore(contract.multa || 0),
      });
    }
  }

  private generateHighlights(
    contract: Contract,
    query: string
  ): { [field: string]: string } {
    const highlightQuery = (text: string) => {
      if (!text || !query) return text;

      const regex = new RegExp(`(${query.split(" ").join("|")})`, "gi");
      return text.replace(
        regex,
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      );
    };

    return {
      contrato: highlightQuery(contract.contrato),
      contratante: highlightQuery(contract.contratante),
      contratada: highlightQuery(contract.contratada),
      objeto: highlightQuery(contract.objeto),
      categoriaContrato: highlightQuery(contract.categoriaContrato),
      filial: highlightQuery(String(contract.filial)),
    };
  }

  private calculateDateScore(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = Math.abs(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // More recent contracts get higher scores
    return Math.max(0, 100 - daysDiff / 30);
  }

  private calculateValueScore(value: number): number {
    // Normalize value score (higher values get higher scores)
    return Math.min(100, Math.log10(value + 1) * 20);
  }

  private applyFilters(
    result: SearchResult,
    filters: Partial<SearchFilters>
  ): boolean {
    const { contract } = result;

    // Category filter
    if (
      filters.categories?.length &&
      !filters.categories.includes(
        contract.categoriaContrato as ContractCategory
      )
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const contractDate = new Date(contract.dataContrato);
      if (filters.dateRange.start && contractDate < filters.dateRange.start)
        return false;
      if (filters.dateRange.end && contractDate > filters.dateRange.end)
        return false;
    }

    // Value range filter
    if (filters.valueRange?.min || filters.valueRange?.max) {
      const contractValue = contract.multa || 0;
      if (filters.valueRange.min && contractValue < filters.valueRange.min)
        return false;
      if (filters.valueRange.max && contractValue > filters.valueRange.max)
        return false;
    }

    // Branch filter
    if (
      filters.branches?.length &&
      !filters.branches.includes(String(contract.filial))
    ) {
      return false;
    }

    return true;
  }
}

// Search History Manager
class SearchHistoryManager {
  private key = "fradema_search_history";
  private maxItems = 10;

  getHistory(): string[] {
    try {
      const history = localStorage.getItem(this.key);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  addSearch(query: string) {
    if (!query.trim()) return;

    const history = this.getHistory();
    const filtered = history.filter((item) => item !== query);
    const newHistory = [query, ...filtered].slice(0, this.maxItems);

    try {
      localStorage.setItem(this.key, JSON.stringify(newHistory));
    } catch (error) {
      console.warn("Failed to save search history:", error);
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.warn("Failed to clear search history:", error);
    }
  }
}

// Main Component
export function EnhancedSearchBar({
  placeholder = "Buscar contratos por nome, empresa, objeto, categoria...",
  className,
  showFilters = true,
  showSuggestions = true,
  showHistory = true,
  maxResults = 8,
  onResultSelect,
  onSearchSubmit,
}: EnhancedSearchBarProps) {
  // State
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    dateRange: {},
    valueRange: {},
    status: [],
    branches: [],
    contractors: [],
  });

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchEngine = useRef(new SearchEngine());
  const historyManager = useRef(new SearchHistoryManager());

  // Hooks
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  // Fetch contracts data
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ["contracts-search"],
    queryFn: () => contractsApi.getAll({ pageSize: 1000 }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Update search engine when data changes
  useEffect(() => {
    if (contractsData?.data) {
      searchEngine.current.setContracts(contractsData.data);
    }
  }, [contractsData]);

  // Search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return searchEngine.current
      .search(debouncedQuery, filters)
      .slice(0, maxResults);
  }, [debouncedQuery, filters, maxResults]);

  // Search suggestions
  const suggestions = useMemo((): SearchSuggestion[] => {
    if (query.trim()) return [];

    const history = showHistory ? historyManager.current.getHistory() : [];
    const categorySuggestions: SearchSuggestion[] = [
      {
        id: "cat-software",
        text: "Software",
        type: "category",
        icon: <Tag className="w-4 h-4" />,
        count: 15,
      },
      {
        id: "cat-aluguel",
        text: "Aluguel",
        type: "category",
        icon: <Building className="w-4 h-4" />,
        count: 8,
      },
      {
        id: "cat-ti",
        text: "TI",
        type: "category",
        icon: <Tag className="w-4 h-4" />,
        count: 12,
      },
    ];

    const historySuggestions: SearchSuggestion[] = history
      .slice(0, 3)
      .map((item, idx) => ({
        id: `history-${idx}`,
        text: item,
        type: "recent",
        icon: <History className="w-4 h-4" />,
      }));

    const popularSuggestions: SearchSuggestion[] = [
      {
        id: "pop-1",
        text: "contratos vencendo",
        type: "popular",
        icon: <TrendingUp className="w-4 h-4" />,
      },
      {
        id: "pop-2",
        text: "software license",
        type: "popular",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ];

    return [
      ...historySuggestions,
      ...categorySuggestions,
      ...popularSuggestions,
    ];
  }, [query, showHistory]);

  // Event handlers
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setSelectedIndex(-1);

      if (value.length > 0) {
        setShowDropdown(true);
      }
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (query.trim()) {
        historyManager.current.addSearch(query.trim());

        if (onSearchSubmit) {
          onSearchSubmit(query.trim(), filters);
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }

        setShowDropdown(false);
      }
    },
    [query, filters, onSearchSubmit, router]
  );

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      historyManager.current.addSearch(query.trim());

      if (onResultSelect) {
        onResultSelect(result.contract);
      } else {
        router.push(`/dashboard/${result.contract.id}`);
      }

      setShowDropdown(false);
      setQuery("");
    },
    [query, onResultSelect, router]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      setShowDropdown(false);

      // Auto-submit for category suggestions
      if (suggestion.type === "category") {
        setTimeout(() => {
          if (onSearchSubmit) {
            onSearchSubmit(suggestion.text, filters);
          } else {
            router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
          }
        }, 100);
      }
    },
    [filters, onSearchSubmit, router]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown) return;

      const totalItems = searchResults.length + suggestions.length;

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
            if (selectedIndex < searchResults.length) {
              handleResultSelect(searchResults[selectedIndex]);
            } else {
              const suggestionIndex = selectedIndex - searchResults.length;
              handleSuggestionSelect(suggestions[suggestionIndex]);
            }
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
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
    searchResults,
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

  // Get result icon based on category
  const getResultIcon = (category: string) => {
    switch (category) {
      case "Software":
        return <Tag className="w-4 h-4 text-blue-500" />;
      case "Aluguel":
        return <Building className="w-4 h-4 text-green-500" />;
      case "TI":
        return <Tag className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get suggestion icon
  const getSuggestionIcon = (type: string, icon: React.ReactNode) => {
    const iconMap = {
      recent: <History className="w-4 h-4 text-gray-400" />,
      popular: <TrendingUp className="w-4 h-4 text-orange-400" />,
      category: <Tag className="w-4 h-4 text-blue-400" />,
      contractor: <Users className="w-4 h-4 text-green-400" />,
      branch: <MapPin className="w-4 h-4 text-purple-400" />,
    };
    return iconMap[type as keyof typeof iconMap] || icon;
  };

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length > 0) {
                setShowDropdown(true);
              } else if (suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className="w-full h-11 pl-10 pr-24 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500" />
            )}

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {showFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={cn(
                  "h-7 px-2",
                  showFiltersPanel && "bg-blue-50 text-blue-600"
                )}
              >
                <Filter className="w-4 h-4" />
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-1 ml-1">
              <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-300 rounded">
                <Command className="h-3 w-3 inline" />K
              </kbd>
            </div>
          </div>
        </div>
      </form>

      {/* Filters Panel */}
      {showFiltersPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-xl shadow-lg border border-gray-200 z-40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <div className="space-y-1">
                {Object.values(ContractCategory).map((cat) => (
                  <label key={cat} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters((f) => ({
                            ...f,
                            categories: [...f.categories, cat],
                          }));
                        } else {
                          setFilters((f) => ({
                            ...f,
                            categories: f.categories.filter((c) => c !== cat),
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={
                    filters.dateRange.start?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dateRange: {
                        ...f.dateRange,
                        start: e.target.value
                          ? new Date(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={
                    filters.dateRange.end?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      dateRange: {
                        ...f.dateRange,
                        end: e.target.value
                          ? new Date(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  placeholder="Data final"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (R$)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  value={filters.valueRange.min || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      valueRange: {
                        ...f.valueRange,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  placeholder="Valor mínimo"
                />
                <input
                  type="number"
                  value={filters.valueRange.max || ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      valueRange: {
                        ...f.valueRange,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  placeholder="Valor máximo"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  categories: [],
                  dateRange: {},
                  valueRange: {},
                  status: [],
                  branches: [],
                  contractors: [],
                })
              }
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowFiltersPanel(false)}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[500px] overflow-y-auto"
        >
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                {searchResults.length} resultado
                {searchResults.length !== 1 ? "s" : ""} encontrado
                {searchResults.length !== 1 ? "s" : ""}
              </div>

              {searchResults.map((result, index) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "w-full px-3 py-3 text-left rounded-lg transition-colors group",
                    selectedIndex === index ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getResultIcon(result.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className="text-sm font-medium text-gray-900 truncate"
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contrato ||
                              result.contract.contrato,
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">
                            {Math.round(result.relevanceScore)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        <span
                          dangerouslySetInnerHTML={{
                            __html:
                              result.highlightedText.contratante ||
                              result.contract.contratante,
                          }}
                        />
                        <ArrowRight className="w-3 h-3" />
                        <span
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
                          <Tag className="w-3 h-3" />
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
                    selectedIndex === searchResults.length + index
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {getSuggestionIcon(suggestion.type, suggestion.icon)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {suggestion.text}
                        </span>
                        {suggestion.count && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">
                        {suggestion.type === "recent" && "Pesquisa recente"}
                        {suggestion.type === "popular" && "Pesquisa popular"}
                        {suggestion.type === "category" && "Categoria"}
                        {suggestion.type === "contractor" && "Contratante"}
                        {suggestion.type === "branch" && "Filial"}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.trim() && searchResults.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Nenhum resultado encontrado
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Tente buscar com termos diferentes ou ajuste os filtros
              </p>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" onClick={handleClear}>
                  Limpar busca
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFiltersPanel(true)}
                >
                  Ajustar filtros
                </Button>
              </div>
            </div>
          )}

          {/* Search History Clear */}
          {showHistory && historyManager.current.getHistory().length > 0 && (
            <div className="border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={() => {
                  historyManager.current.clearHistory();
                  setShowDropdown(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Limpar histórico de buscas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
