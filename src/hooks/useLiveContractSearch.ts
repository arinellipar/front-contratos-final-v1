// src/hooks/useLiveContractSearch.ts
import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { Contract } from "@/lib/types/contract";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: number;
  type: "exact_match" | "contractor" | "contracted" | "object" | "category";
  contract: Contract;
  matchedField: string;
  matchedValue: string;
  highlightedText: string;
}

interface UseLiveContractSearchOptions {
  minSearchLength?: number;
  debounceMs?: number;
  maxResults?: number;
  enableAutoSearch?: boolean;
  searchFields?: (
    | "contrato"
    | "contratante"
    | "contratada"
    | "objeto"
    | "categoriaContrato"
  )[];
}

interface UseLiveContractSearchReturn {
  // State
  searchQuery: string;
  results: SearchResult[];
  isLoading: boolean;
  error: Error | null;
  hasResults: boolean;
  totalCount: number;

  // Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  search: (query?: string) => void;

  // UI State
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;

  // Utilities
  getHighlightedText: (text: string, query: string) => string;
  selectResult: (result: SearchResult) => void;
}

export function useLiveContractSearch(
  options: UseLiveContractSearchOptions = {}
): UseLiveContractSearchReturn {
  const {
    minSearchLength = 2,
    debounceMs = 300,
    maxResults = 10,
    enableAutoSearch = true,
    searchFields = [
      "contrato",
      "contratante",
      "contratada",
      "objeto",
      "categoriaContrato",
    ],
  } = options;

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  // Determine if search should be executed
  const shouldSearch = useMemo(() => {
    return (
      enableAutoSearch &&
      debouncedQuery.length >= minSearchLength &&
      debouncedQuery.trim() !== ""
    );
  }, [debouncedQuery, enableAutoSearch, minSearchLength]);

  // Search query
  const {
    data: searchData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["live-contract-search", debouncedQuery],
    queryFn: async () => {
      console.log("🔍 Executando busca para:", debouncedQuery);

      // Buscar todos os contratos ativos e filtrar no frontend para melhor performance
      const response = await contractsApi.getAll({
        pageSize: 1000, // Buscar muitos contratos para filtrar localmente
        page: 1,
      });

      // Filtrar apenas contratos ativos
      const activeContracts = response.data.filter(
        (contract) => contract.status === 1
      );

      const query = debouncedQuery.toLowerCase().trim();
      const results: SearchResult[] = [];

      // Função para destacar texto
      const highlightText = (text: string, searchTerm: string): string => {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, "gi");
        return text.replace(regex, "<mark>$1</mark>");
      };

      // Buscar em cada contrato ativo
      activeContracts.forEach((contract) => {
        // Verificar cada campo de busca
        searchFields.forEach((field) => {
          const fieldValue = contract[field]?.toString().toLowerCase() || "";

          if (fieldValue.includes(query)) {
            // Determinar o tipo de match
            let matchType: SearchResult["type"] = "exact_match";
            let matchedField = field;

            switch (field) {
              case "contrato":
                matchType = "exact_match";
                break;
              case "contratante":
                matchType = "contractor";
                break;
              case "contratada":
                matchType = "contracted";
                break;
              case "objeto":
                matchType = "object";
                break;
              case "categoriaContrato":
                matchType = "category";
                break;
            }

            // Verificar se já existe um resultado para este contrato
            const existingIndex = results.findIndex(
              (r) => r.contract.id === contract.id
            );

            if (existingIndex === -1) {
              // Adicionar novo resultado
              results.push({
                id: contract.id,
                type: matchType,
                contract,
                matchedField,
                matchedValue: contract[field]?.toString() || "",
                highlightedText: highlightText(
                  contract[field]?.toString() || "",
                  query
                ),
              });
            } else {
              // Atualizar resultado existente se este match for mais relevante
              const existing = results[existingIndex];
              if (
                matchType === "exact_match" ||
                (matchType === "contractor" && existing.type !== "exact_match")
              ) {
                results[existingIndex] = {
                  id: contract.id,
                  type: matchType,
                  contract,
                  matchedField,
                  matchedValue: contract[field]?.toString() || "",
                  highlightedText: highlightText(
                    contract[field]?.toString() || "",
                    query
                  ),
                };
              }
            }
          }
        });
      });

      // Ordenar resultados por relevância
      const sortedResults = results
        .sort((a, b) => {
          // Prioridades: exact_match > contractor > contracted > object > category
          const typePriority = {
            exact_match: 5,
            contractor: 4,
            contracted: 3,
            object: 2,
            category: 1,
          };

          const aPriority = typePriority[a.type] || 0;
          const bPriority = typePriority[b.type] || 0;

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          // Se mesmo tipo, ordenar alfabeticamente
          return a.matchedValue.localeCompare(b.matchedValue, "pt-BR");
        })
        .slice(0, maxResults);

      console.log(
        `✅ Encontrados ${sortedResults.length} resultados de ${activeContracts.length} contratos`
      );

      return {
        results: sortedResults,
        totalCount: results.length,
        searchTerm: debouncedQuery,
      };
    },
    enabled: shouldSearch,
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 2 * 60 * 1000, // Manter em cache por 2 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar na janela
  });

  // Extract results
  const results = searchData?.results || [];
  const totalCount = searchData?.totalCount || 0;
  const hasResults = results.length > 0;

  // Utility functions
  const getHighlightedText = useCallback(
    (text: string, query: string): string => {
      if (!query) return text;
      const regex = new RegExp(`(${query})`, "gi");
      return text.replace(
        regex,
        '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>'
      );
    },
    []
  );

  const selectResult = useCallback((result: SearchResult) => {
    console.log("📋 Resultado selecionado:", result);
    // Esta função pode ser customizada para navegar para o contrato
    // ou executar outras ações específicas
    if (typeof window !== "undefined") {
      window.location.href = `/dashboard/${result.contract.id}`;
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setShowDropdown(false);
    setSelectedIndex(-1);
  }, []);

  const search = useCallback(
    (query?: string) => {
      const searchTerm = query || searchQuery;
      if (searchTerm.length >= minSearchLength) {
        setSearchQuery(searchTerm);
        refetch();
      }
    },
    [searchQuery, minSearchLength, refetch]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDropdown || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            selectResult(results[selectedIndex]);
            setShowDropdown(false);
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
  }, [showDropdown, results, selectedIndex, selectResult]);

  // Auto-show dropdown when there are results
  useEffect(() => {
    if (hasResults && searchQuery.length >= minSearchLength) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [hasResults, searchQuery, minSearchLength]);

  return {
    // State
    searchQuery,
    results,
    isLoading,
    error: error as Error | null,
    hasResults,
    totalCount,

    // Actions
    setSearchQuery,
    clearSearch,
    search,

    // UI State
    showDropdown,
    setShowDropdown,

    // Utilities
    getHighlightedText,
    selectResult,
  };
}
