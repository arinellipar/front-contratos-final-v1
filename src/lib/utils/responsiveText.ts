// Utilitário para compatibilidade com a função getDynamicFontSize existente
export const getDynamicFontSize = (
  text: string,
  baseSize: string = "text-3xl"
) => {
  const length = text.length;

  // Mapeamento de tamanhos base para diferentes escalas
  const sizeMap = {
    "text-xs": ["text-xs", "text-xs", "text-xs", "text-xs"],
    "text-sm": ["text-sm", "text-xs", "text-xs", "text-xs"],
    "text-base": ["text-base", "text-sm", "text-xs", "text-xs"],
    "text-lg": ["text-lg", "text-base", "text-sm", "text-xs"],
    "text-xl": ["text-xl", "text-lg", "text-base", "text-sm"],
    "text-2xl": ["text-2xl", "text-xl", "text-lg", "text-base"],
    "text-3xl": ["text-3xl", "text-2xl", "text-xl", "text-lg"],
    "text-4xl": ["text-4xl", "text-3xl", "text-2xl", "text-xl"],
    "text-5xl": ["text-5xl", "text-4xl", "text-3xl", "text-2xl"],
    "text-6xl": ["text-6xl", "text-5xl", "text-4xl", "text-3xl"],
  };

  // Determinar o índice baseado no comprimento do texto
  let sizeIndex = 0;
  if (length <= 6) {
    sizeIndex = 0; // Tamanho original para textos curtos
  } else if (length <= 10) {
    sizeIndex = 1; // Tamanho médio para textos médios
  } else if (length <= 15) {
    sizeIndex = 2; // Tamanho menor para textos longos
  } else {
    sizeIndex = 3; // Menor tamanho para textos muito longos
  }

  // Obter o tamanho apropriado baseado no tamanho base
  const availableSizes =
    sizeMap[baseSize as keyof typeof sizeMap] || sizeMap["text-3xl"];
  return availableSizes[sizeIndex] || baseSize;
};
