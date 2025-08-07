import { useState, useCallback } from "react";

interface UseNumberFormatReturn {
  formattedValue: string;
  rawValue: number;
  handleChange: (value: string) => void;
  isValid: boolean;
  error?: string;
}

interface UseNumberFormatOptions {
  allowDecimals?: boolean;
  maxDecimals?: number;
  min?: number;
  max?: number;
  initialValue?: number;
}

/**
 * Hook para formatação de números que aceita tanto ponto quanto vírgula
 * como separadores de milhares e vírgula para decimais
 */
export function useNumberFormat(
  options: UseNumberFormatOptions = {}
): UseNumberFormatReturn {
  const {
    allowDecimals = true,
    maxDecimals = 2,
    min = 0,
    max = 999999999.99,
    initialValue = 0,
  } = options;

  const [formattedValue, setFormattedValue] = useState<string>(
    initialValue > 0
      ? formatNumber(initialValue, allowDecimals, maxDecimals)
      : ""
  );
  const [rawValue, setRawValue] = useState<number>(initialValue);
  const [error, setError] = useState<string>();

  const handleChange = useCallback(
    (value: string) => {
      // Remove espaços em branco
      const cleanValue = value.trim();

      // Se valor vazio, reset
      if (!cleanValue) {
        setFormattedValue("");
        setRawValue(0);
        setError(undefined);
        return;
      }

      // Parse do valor inserido
      const parsed = parseNumber(cleanValue);

      if (isNaN(parsed)) {
        setError("Valor inválido");
        return;
      }

      // Validações
      if (parsed < min) {
        setError(
          `Valor deve ser maior que ${formatNumber(min, allowDecimals, maxDecimals)}`
        );
        return;
      }

      if (parsed > max) {
        setError(
          `Valor deve ser menor que ${formatNumber(max, allowDecimals, maxDecimals)}`
        );
        return;
      }

      // Limpar erro se chegou até aqui
      setError(undefined);

      // Atualizar valores
      setRawValue(parsed);
      setFormattedValue(formatNumber(parsed, allowDecimals, maxDecimals));
    },
    [allowDecimals, maxDecimals, min, max]
  );

  return {
    formattedValue,
    rawValue,
    handleChange,
    isValid: !error && rawValue >= min && rawValue <= max,
    error,
  };
}

/**
 * Converte string para número, aceitando diferentes formatos
 * Exemplos suportados:
 * - "60000" -> 60000
 * - "60.000" -> 60000
 * - "60,000" -> 60000
 * - "60.000,50" -> 60000.50
 * - "60,000.50" -> 60000.50
 */
function parseNumber(value: string): number {
  // Remove espaços
  let clean = value.replace(/\s/g, "");

  // Casos especiais: apenas ponto ou vírgula
  if (clean === "." || clean === ",") {
    return 0;
  }

  // Detectar formato brasileiro (vírgula como decimal)
  // Se tem vírgula e ela está mais à direita que qualquer ponto
  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");

  if (lastComma > lastDot && lastComma > 0) {
    // Formato brasileiro: 60.000,50
    const parts = clean.split(",");
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/\./g, ""); // Remove pontos
      const decimalPart = parts[1];
      clean = `${integerPart}.${decimalPart}`;
    }
  } else if (lastDot > lastComma && lastDot > 0) {
    // Formato internacional: 60,000.50
    const parts = clean.split(".");
    if (parts.length === 2) {
      const integerPart = parts[0].replace(/,/g, ""); // Remove vírgulas
      const decimalPart = parts[1];
      clean = `${integerPart}.${decimalPart}`;
    }
  } else {
    // Apenas separadores de milhares ou número simples
    // Remove todos os pontos e vírgulas que não sejam decimais
    clean = clean.replace(/[.,]/g, "");
  }

  return parseFloat(clean);
}

/**
 * Formata número para exibição com separadores de milhares e decimais
 */
function formatNumber(
  value: number,
  allowDecimals: boolean = true,
  maxDecimals: number = 2
): string {
  if (!value || isNaN(value)) return "";

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: allowDecimals ? maxDecimals : 0,
    useGrouping: true,
  };

  // Usar formatação brasileira
  return value.toLocaleString("pt-BR", options);
}

/**
 * Hook simplificado para valores monetários
 */
export function useCurrencyFormat(initialValue: number = 0) {
  return useNumberFormat({
    allowDecimals: true,
    maxDecimals: 2,
    min: 0,
    max: 999999999.99,
    initialValue,
  });
}

/**
 * Hook simplificado para números inteiros (ex: parcelas)
 */
export function useIntegerFormat(
  min: number = 1,
  max: number = 60,
  initialValue: number = 1
) {
  return useNumberFormat({
    allowDecimals: false,
    maxDecimals: 0,
    min,
    max,
    initialValue,
  });
}
