// src/hooks/useAdvancedSearch.ts
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { Contract, ContractCategory } from "@/lib/types/contract";
import { useDebounce } from "@/hooks/useDebounce";

// Interfaces
export interface SearchResult {
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
  snippet: string;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "recent" | "popular" | "category" | "contractor" | "branch" | "saved";
  icon?: string;
  count?: number;
  metadata?: Record<string, unknown>;
}

export interface SearchFilters {
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
  sortBy: "relevance" | "date" | "value" | "alphabetical";
  sortOrder: "asc" | "desc";
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  popularQueries: string[];
  searchSuccessRate: number;
  lastSearchTime: number;
}

interface UseAdvancedSearchOptions {
  maxResults?: number;
  debounceMs?: number;
  enableSuggestions?: boolean;
  enableHistory?: boolean;
  enableAnalytics?: boolean;
  fuzzyThreshold?: number;
  cacheTime?: number;
}

interface UseAdvancedSearchReturn {
  // Search state
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;

  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  error: Error | null;

  // Results metadata
  totalResults: number;
  searchTime: number;
  hasResults: boolean;

  // Utility functions
  highlightText: (text: string, query: string) => string;
  getResultIcon: (category: string) => string;
  formatFiltersForDisplay: () => string[];

  // Advanced features
  saveSearch: (name: string) => void;
  exportResults: (format: "csv" | "json" | "pdf") => void;
  getAnalytics: () => SearchAnalytics;
}

// Search Engine Class
class AdvancedSearchEngine {
  private contracts: Contract[] = [];
  private index: Map<string, Set<number>> = new Map();
  private analytics: SearchAnalytics = {
    totalSearches: 0,
    averageResponseTime: 0,
    popularQueries: [],
    searchSuccessRate: 0,
    lastSearchTime: 0,
  };

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
    "as",
    "os",
    "das",
    "dos",
    "nas",
    "nos",
    "um",
    "uma",
    "uns",
    "umas",
    "que",
  ]);

  setContracts(contracts: Contract[]) {
    this.contracts = contracts.filter((c) => c.status === 1); // Only active
    this.buildIndex();
  }

  private buildIndex() {
    this.index.clear();

    this.contracts.forEach((contract, idx) => {
      const searchableFields = [
        contract.contrato,
        contract.contratante,
        contract.contratada,
        contract.objeto,
        contract.categoriaContrato,
        contract.filial,
        contract.observacoes || "",
      ];

      const searchableText = searchableFields.join(" ").toLowerCase();
      const tokens = this.tokenize(searchableText);

      tokens.forEach((token) => {
        if (!this.index.has(token)) {
          this.index.set(token, new Set());
        }
        this.index.get(token)!.add(idx);
      });

      // Index individual words from compound fields
      searchableFields.forEach((field, fieldIdx) => {
        if (typeof field === "string") {
          const fieldTokens = this.tokenize(field.toLowerCase());
          fieldTokens.forEach((token) => {
            const fieldKey = `${fieldIdx}_${token}`;
            if (!this.index.has(fieldKey)) {
              this.index.set(fieldKey, new Set());
            }
            this.index.get(fieldKey)!.add(idx);
          });
        }
      });
    });
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u017F]/g, " ") // Keep accented chars
      .split(/\s+/)
      .filter((token) => token.length > 1 && !this.stopWords.has(token))
      .slice(0, 50); // Limit tokens to prevent memory issues
  }

  private calculateLevenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private fuzzyMatch(query: string, text: string, threshold = 0.7): boolean {
    if (text.includes(query)) return true;

    if (query.length < 3 || text.length < 3) return false;

    const distance = this.calculateLevenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= threshold;
  }

  search(
    query: string,
    filters: Partial<SearchFilters> = {},
    options: { maxResults?: number; fuzzyThreshold?: number } = {}
  ): { results: SearchResult[]; searchTime: number; totalResults: number } {
    const startTime = Date.now();

    if (!query.trim()) {
      return { results: [], searchTime: 0, totalResults: 0 };
    }

    const { maxResults = 50, fuzzyThreshold = 0.7 } = options;
    const queryTokens = this.tokenize(query);
    const results = new Map<number, SearchResult>();

    // Search algorithm
    queryTokens.forEach((token) => {
      // Exact matches (highest priority)
      if (this.index.has(token)) {
        this.index.get(token)!.forEach((contractIdx) => {
          this.addOrUpdateResult(
            results,
            contractIdx,
            token,
            query,
            "exact",
            10
          );
        });
      }

      // Partial matches
      this.index.forEach((contractIndices, indexedToken) => {
        if (indexedToken.includes(token) && indexedToken !== token) {
          contractIndices.forEach((contractIdx) => {
            this.addOrUpdateResult(
              results,
              contractIdx,
              token,
              query,
              "partial",
              6
            );
          });
        }
      });

      // Fuzzy matches (lowest priority)
      this.index.forEach((contractIndices, indexedToken) => {
        if (this.fuzzyMatch(token, indexedToken, fuzzyThreshold)) {
          contractIndices.forEach((contractIdx) => {
            this.addOrUpdateResult(
              results,
              contractIdx,
              token,
              query,
              "fuzzy",
              3
            );
          });
        }
      });
    });

    // Apply filters and sort
    let filteredResults = Array.from(results.values())
      .filter((result) => this.applyFilters(result, filters))
      .sort((a, b) => {
        const sortBy = filters.sortBy || "relevance";
        const sortOrder = filters.sortOrder || "desc";

        let comparison = 0;

        switch (sortBy) {
          case "relevance":
            comparison = b.relevanceScore - a.relevanceScore;
            break;
          case "date":
            comparison =
              new Date(b.contract.dataContrato).getTime() -
              new Date(a.contract.dataContrato).getTime();
            break;
          case "value":
            comparison = (b.contract.multa || 0) - (a.contract.multa || 0);
            break;
          case "alphabetical":
            comparison = a.contract.contrato.localeCompare(
              b.contract.contrato,
              "pt-BR"
            );
            break;
        }

        return sortOrder === "desc" ? comparison : -comparison;
      });

    const totalResults = filteredResults.length;
    filteredResults = filteredResults.slice(0, maxResults);

    const searchTime = Date.now() - startTime;

    // Update analytics
    this.updateAnalytics(query, searchTime, totalResults > 0);

    return {
      results: filteredResults,
      searchTime,
      totalResults,
    };
  }

  private addOrUpdateResult(
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
      // Update match type to the best one
      if (
        matchType === "exact" ||
        (matchType === "partial" && existingResult.matchType === "fuzzy")
      ) {
        existingResult.matchType = matchType;
      }
    } else {
      const highlightedText = this.generateHighlights(contract, originalQuery);
      const snippet = this.generateSnippet(contract, originalQuery);

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
        snippet,
      });
    }
  }

  private generateHighlights(
    contract: Contract,
    query: string
  ): { [field: string]: string } {
    const highlightQuery = (text: string) => {
      if (!text || !query) return text;

      const tokens = this.tokenize(query);
      let highlightedText = text;

      tokens.forEach((token) => {
        const regex = new RegExp(`(${this.escapeRegExp(token)})`, "gi");
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded font-medium">$1</mark>'
        );
      });

      return highlightedText;
    };

    return {
      contrato: highlightQuery(contract.contrato),
      contratante: highlightQuery(contract.contratante),
      contratada: highlightQuery(contract.contratada),
      objeto: highlightQuery(contract.objeto),
      categoriaContrato: highlightQuery(contract.categoriaContrato),
      filial: highlightQuery(String(contract.filial)),
      observacoes: highlightQuery(contract.observacoes || ""),
    };
  }

  private generateSnippet(contract: Contract, query: string): string {
    const fields = [contract.objeto, contract.observacoes || ""];
    const queryTokens = this.tokenize(query);

    for (const field of fields) {
      if (!field) continue;

      const lowerField = field.toLowerCase();
      for (const token of queryTokens) {
        const index = lowerField.indexOf(token.toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(field.length, index + token.length + 50);
          const snippet = field.substring(start, end);
          return (
            (start > 0 ? "..." : "") +
            snippet +
            (end < field.length ? "..." : "")
          );
        }
      }
    }

    return (
      contract.objeto.substring(0, 100) +
      (contract.objeto.length > 100 ? "..." : "")
    );
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private calculateDateScore(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const daysDiff = Math.abs(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 100 - (daysDiff / 365) * 100); // More recent = higher score
  }

  private calculateValueScore(value: number): number {
    return Math.min(100, Math.log10(Math.max(1, value)) * 20);
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

    // Contractor filter
    if (
      filters.contractors?.length &&
      !filters.contractors.some(
        (contractor) =>
          contract.contratante
            .toLowerCase()
            .includes(contractor.toLowerCase()) ||
          contract.contratada.toLowerCase().includes(contractor.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  }

  private updateAnalytics(
    query: string,
    responseTime: number,
    hasResults: boolean
  ) {
    this.analytics.totalSearches++;
    this.analytics.lastSearchTime = responseTime;

    // Update average response time
    this.analytics.averageResponseTime =
      (this.analytics.averageResponseTime + responseTime) / 2;

    // Update success rate
    const successCount = hasResults ? 1 : 0;
    this.analytics.searchSuccessRate =
      (this.analytics.searchSuccessRate * (this.analytics.totalSearches - 1) +
        successCount) /
      this.analytics.totalSearches;

    // Update popular queries (simplified)
    if (hasResults && !this.analytics.popularQueries.includes(query)) {
      this.analytics.popularQueries.push(query);
      if (this.analytics.popularQueries.length > 10) {
        this.analytics.popularQueries.shift();
      }
    }
  }

  getAnalytics(): SearchAnalytics {
    return { ...this.analytics };
  }
}

// Search History Manager
class SearchHistoryManager {
  private key = "fradema_search_history";
  private maxItems = 20;

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

// Main Hook Implementation
export function useAdvancedSearch(
  options: UseAdvancedSearchOptions = {}
): UseAdvancedSearchReturn {
  const {
    maxResults = 20,
    debounceMs = 300,
    enableSuggestions = true,
    enableHistory = true,
    enableAnalytics = false,
    fuzzyThreshold = 0.7,
    cacheTime = 5 * 60 * 1000,
  } = options;

  // State
  const [query, setQuery] = useState("");
  const [filters, setFiltersState] = useState<SearchFilters>({
    categories: [],
    dateRange: {},
    valueRange: {},
    status: [],
    branches: [],
    contractors: [],
    sortBy: "relevance",
    sortOrder: "desc",
  });

  // Refs
  const searchEngine = useRef(new AdvancedSearchEngine());
  const historyManager = useRef(new SearchHistoryManager());

  // Debounced query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Fetch contracts data
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ["contracts-search-all"],
    queryFn: () => contractsApi.getAll({ pageSize: 1000 }),
    staleTime: cacheTime,
    refetchOnWindowFocus: false,
  });

  // Update search engine when data changes
  useEffect(() => {
    if (contractsData?.data) {
      searchEngine.current.setContracts(contractsData.data);
    }
  }, [contractsData]);

  // Perform search
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim() || !contractsData?.data) {
      return { results: [], searchTime: 0, totalResults: 0 };
    }

    return searchEngine.current.search(debouncedQuery, filters, {
      maxResults,
      fuzzyThreshold,
    });
  }, [debouncedQuery, filters, contractsData, maxResults, fuzzyThreshold]);

  // Generate suggestions
  const suggestions = useMemo((): SearchSuggestion[] => {
    if (!enableSuggestions || query.trim()) return [];

    const history = enableHistory ? historyManager.current.getHistory() : [];
    const categories = contractsData?.data
      ? [...new Set(contractsData.data.map((c) => c.categoriaContrato))]
      : [];

    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    history.slice(0, 3).forEach((item, idx) => {
      suggestions.push({
        id: `history-${idx}`,
        text: item,
        type: "recent",
        icon: "🕒",
      });
    });

    // Categories
    categories.slice(0, 4).forEach((category, idx) => {
      const count =
        contractsData?.data?.filter((c) => c.categoriaContrato === category)
          .length || 0;
      suggestions.push({
        id: `category-${idx}`,
        text: category,
        type: "category",
        icon: getCategoryIcon(category),
        count,
      });
    });

    // Popular suggestions
    if (enableAnalytics) {
      const analytics = searchEngine.current.getAnalytics();
      analytics.popularQueries.slice(0, 3).forEach((query, idx) => {
        suggestions.push({
          id: `popular-${idx}`,
          text: query,
          type: "popular",
          icon: "🔥",
        });
      });
    }

    return suggestions;
  }, [query, enableSuggestions, enableHistory, enableAnalytics, contractsData]);

  // Utility functions
  const highlightText = useCallback((text: string, query: string): string => {
    if (!query || !text) return text;

    const tokens = query.split(/\s+/).filter((t) => t.length > 0);
    let highlightedText = text;

    tokens.forEach((token) => {
      const regex = new RegExp(
        `(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
      );
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      );
    });

    return highlightedText;
  }, []);

  const getResultIcon = useCallback((category: string): string => {
    const iconMap: Record<string, string> = {
      Software: "💻",
      Aluguel: "🏢",
      TI: "⚙️",
      Consultoria: "👥",
      Licenças: "📄",
      Outros: "📁",
    };
    return iconMap[category] || "📄";
  }, []);

  const setFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({
      categories: [],
      dateRange: {},
      valueRange: {},
      status: [],
      branches: [],
      contractors: [],
      sortBy: "relevance",
      sortOrder: "desc",
    });
  }, []);

  const formatFiltersForDisplay = useCallback((): string[] => {
    const displayFilters: string[] = [];

    if (filters.categories.length > 0) {
      displayFilters.push(`Categorias: ${filters.categories.join(", ")}`);
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      const start =
        filters.dateRange.start?.toLocaleDateString("pt-BR") || "...";
      const end = filters.dateRange.end?.toLocaleDateString("pt-BR") || "...";
      displayFilters.push(`Período: ${start} - ${end}`);
    }

    if (filters.valueRange.min || filters.valueRange.max) {
      const min = filters.valueRange.min
        ? `R$ ${filters.valueRange.min.toLocaleString("pt-BR")}`
        : "0";
      const max = filters.valueRange.max
        ? `R$ ${filters.valueRange.max.toLocaleString("pt-BR")}`
        : "∞";
      displayFilters.push(`Valor: ${min} - ${max}`);
    }

    if (filters.branches.length > 0) {
      displayFilters.push(`Filiais: ${filters.branches.join(", ")}`);
    }

    if (filters.contractors.length > 0) {
      displayFilters.push(`Empresas: ${filters.contractors.join(", ")}`);
    }

    return displayFilters;
  }, [filters]);

  const saveSearch = useCallback(
    (name: string) => {
      if (query.trim()) {
        historyManager.current.addSearch(query.trim());
        // TODO: Implement saved searches functionality
        console.log(`Search "${query}" saved as "${name}"`);
      }
    },
    [query]
  );

  const exportResults = useCallback(
    (format: "csv" | "json" | "pdf") => {
      // TODO: Implement export functionality
      console.log(
        `Exporting ${searchResults.results.length} results as ${format}`
      );
    },
    [searchResults.results]
  );

  const getAnalytics = useCallback((): SearchAnalytics => {
    return searchEngine.current.getAnalytics();
  }, []);

  // Add search to history when query changes
  useEffect(() => {
    if (debouncedQuery.trim() && enableHistory) {
      historyManager.current.addSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, enableHistory]);

  return {
    // Search state
    query,
    setQuery,
    results: searchResults.results,
    suggestions,
    filters,
    setFilters,
    resetFilters,

    // Loading states
    isLoading,
    isSearching: isLoading,
    error: null,

    // Results metadata
    totalResults: searchResults.totalResults,
    searchTime: searchResults.searchTime,
    hasResults: searchResults.results.length > 0,

    // Utility functions
    highlightText,
    getResultIcon,
    formatFiltersForDisplay,

    // Advanced features
    saveSearch,
    exportResults,
    getAnalytics,
  };
}

// Helper function
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    Software: "💻",
    Aluguel: "🏢",
    TI: "⚙️",
    Consultoria: "👥",
    Licenças: "📄",
    Outros: "📁",
  };
  return iconMap[category] || "📁";
}
