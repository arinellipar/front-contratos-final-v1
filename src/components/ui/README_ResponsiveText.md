# Sistema de Texto Responsivo

Este sistema permite que números e textos sejam automaticamente redimensionados para caberem em seus containers, evitando overflow e mantendo a legibilidade.

## Componentes

### 1. `useResponsiveText` Hook

Hook personalizado que detecta o tamanho do container e ajusta o texto dinamicamente.

```typescript
import { useResponsiveText } from '@/hooks/useResponsiveText';

const { fontSize, textRef, containerRef } = useResponsiveText(text, {
  baseSize: "text-3xl",
  minSize: "text-xs",
  maxSize: "text-6xl"
});
```

**Parâmetros:**
- `text`: string - O texto a ser exibido
- `options`: UseResponsiveTextOptions
  - `baseSize`: string - Tamanho base da fonte (padrão: "text-3xl")
  - `minSize`: string - Tamanho mínimo da fonte (padrão: "text-xs")
  - `maxSize`: string - Tamanho máximo da fonte (padrão: "text-6xl")

**Retorna:**
- `fontSize`: string - Classe CSS do tamanho da fonte atual
- `textRef`: RefObject - Referência para o elemento de texto
- `containerRef`: RefObject - Referência para o container
- `getDynamicFontSize`: function - Função utilitária

### 2. `ResponsiveText` Component

Componente reutilizável para texto responsivo.

```typescript
import { ResponsiveText } from '@/components/ui/ResponsiveText';

<ResponsiveText
  baseFontSize="text-3xl"
  className="text-blue-900"
  containerClassName="w-full"
  as="p"
>
  R$ 123.456.789,00
</ResponsiveText>
```

**Props:**
- `children`: string | number - O texto a ser exibido
- `baseFontSize`: string - Tamanho base da fonte (padrão: "text-3xl")
- `className`: string - Classes CSS adicionais para o texto
- `containerClassName`: string - Classes CSS para o container
- `as`: string - Elemento HTML a ser renderizado (padrão: "p")

### 3. `MetricCard` Component

Card de métricas com texto responsivo integrado.

```typescript
import { MetricCard } from '@/components/ui/MetricCard';
import { Target } from 'lucide-react';

<MetricCard
  title="Taxa de Renovação"
  value="100.0%"
  subtitle="Contratos renovados"
  icon={Target}
  iconColor="text-green-300"
  iconBgColor="bg-green-500/20"
  progressValue={100}
  progressColor="bg-gradient-to-r from-green-400 to-green-500"
  baseFontSize="text-3xl"
/>
```

**Props:**
- `title`: string - Título do card
- `value`: string | number - Valor principal
- `subtitle`: string - Subtítulo opcional
- `icon`: LucideIcon - Ícone do card
- `iconColor`: string - Cor do ícone
- `iconBgColor`: string - Cor de fundo do ícone
- `progressValue`: number - Valor da barra de progresso (opcional)
- `progressColor`: string - Cor da barra de progresso
- `className`: string - Classes CSS adicionais
- `baseFontSize`: string - Tamanho base da fonte

## Função Utilitária

### `getDynamicFontSize`

Função utilitária para compatibilidade com código existente.

```typescript
import { getDynamicFontSize } from '@/lib/utils/responsiveText';

const fontSize = getDynamicFontSize("R$ 123.456.789,00", "text-3xl");
```

**Parâmetros:**
- `text`: string - O texto a ser analisado
- `baseSize`: string - Tamanho base da fonte (padrão: "text-3xl")

**Retorna:**
- `string` - Classe CSS do tamanho da fonte apropriado

## Lógica de Redimensionamento

O sistema usa a seguinte lógica para determinar o tamanho da fonte:

1. **Textos Curtos (≤6 caracteres)**: Mantém o tamanho base
2. **Textos Médios (7-10 caracteres)**: Reduz uma escala
3. **Textos Longos (11-15 caracteres)**: Reduz duas escalas
4. **Textos Muito Longos (>15 caracteres)**: Reduz três escalas

### Escalas de Tamanho

```typescript
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
```

## Detecção de Overflow

O hook `useResponsiveText` também detecta quando o texto está transbordando do container e reduz automaticamente o tamanho da fonte:

- **Largura**: Reduz se o texto exceder 95% da largura do container
- **Altura**: Reduz se o texto exceder 80% da altura do container

## Exemplo de Uso

```typescript
import React from 'react';
import { ResponsiveText } from '@/components/ui/ResponsiveText';
import { MetricCard } from '@/components/ui/MetricCard';
import { Target } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {/* Usando ResponsiveText diretamente */}
      <div className="bg-white p-4 rounded">
        <ResponsiveText baseFontSize="text-3xl" className="text-blue-900">
          R$ 123.456.789,00
        </ResponsiveText>
      </div>

      {/* Usando MetricCard */}
      <MetricCard
        title="Taxa de Renovação"
        value="100.0%"
        subtitle="Contratos renovados"
        icon={Target}
        iconColor="text-green-300"
        iconBgColor="bg-green-500/20"
        progressValue={100}
        progressColor="bg-gradient-to-r from-green-400 to-green-500"
      />
    </div>
  );
};
```

## Migração de Código Existente

Para migrar código que usa a função `getDynamicFontSize`:

**Antes:**
```typescript
<p className={`${getDynamicFontSize(value)} font-bold`}>
  {value}
</p>
```

**Depois:**
```typescript
<ResponsiveText baseFontSize="text-3xl" className="font-bold">
  {value}
</ResponsiveText>
```

## Benefícios

1. **Responsividade Automática**: O texto se ajusta automaticamente ao tamanho do container
2. **Performance**: Usa ResizeObserver para detectar mudanças eficientemente
3. **Acessibilidade**: Mantém a legibilidade em diferentes tamanhos de tela
4. **Reutilização**: Componentes podem ser usados em qualquer lugar da aplicação
5. **Compatibilidade**: Função utilitária mantém compatibilidade com código existente