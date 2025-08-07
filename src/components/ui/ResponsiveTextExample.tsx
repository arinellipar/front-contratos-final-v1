import React from "react";
import { ResponsiveText } from "./ResponsiveText";
import { MetricCard } from "./MetricCard";
import { Target, DollarSign, Shield, AlertTriangle } from "lucide-react";

export const ResponsiveTextExample: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Exemplo de Texto Responsivo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exemplos com diferentes tamanhos de texto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Textos Curtos (≤6 caracteres)
            </h3>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">100%</ResponsiveText>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">R$ 1.750</ResponsiveText>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Textos Médios (7-10 caracteres)
            </h3>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">
                R$ 45.780,00
              </ResponsiveText>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">1.234.567</ResponsiveText>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Textos Longos (11-15 caracteres)
            </h3>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">
                R$ 123.456.789,00
              </ResponsiveText>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">
                99.999.999.999
              </ResponsiveText>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Textos Muito Longos (&gt;15 caracteres)
            </h3>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">
                R$ 1.234.567.890,00
              </ResponsiveText>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <ResponsiveText baseFontSize="text-3xl">
                999.999.999.999.999
              </ResponsiveText>
            </div>
          </div>
        </div>
      </div>

      {/* Exemplo dos cards de métricas */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          Cards de Métricas Responsivos
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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

          <MetricCard
            title="Valor Médio"
            value="R$ 1.750,00"
            subtitle="Por contrato"
            icon={DollarSign}
            iconColor="text-yellow-300"
            iconBgColor="bg-yellow-500/20"
            progressValue={75}
            progressColor="bg-gradient-to-r from-yellow-400 to-yellow-500"
            baseFontSize="text-2xl"
          />

          <MetricCard
            title="Compliance"
            value="100.0%"
            subtitle="Score de conformidade"
            icon={Shield}
            iconColor="text-blue-300"
            iconBgColor="bg-blue-500/20"
            progressValue={100}
            progressColor="bg-gradient-to-r from-blue-400 to-blue-500"
          />

          <MetricCard
            title="Risco"
            value="50.0%"
            subtitle="Score de risco"
            icon={AlertTriangle}
            iconColor="text-red-300"
            iconBgColor="bg-red-500/20"
            progressValue={50}
            progressColor="bg-gradient-to-r from-red-400 to-red-500"
          />
        </div>
      </div>

      {/* Exemplo com containers de diferentes tamanhos */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          Teste com Containers de Diferentes Tamanhos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-100 p-4 rounded w-full">
            <h4 className="text-sm font-medium mb-2">Container Pequeno</h4>
            <ResponsiveText baseFontSize="text-2xl" containerClassName="w-full">
              R$ 123.456.789,00
            </ResponsiveText>
          </div>

          <div className="bg-gray-100 p-4 rounded w-full">
            <h4 className="text-sm font-medium mb-2">Container Médio</h4>
            <ResponsiveText baseFontSize="text-2xl" containerClassName="w-full">
              R$ 123.456.789,00
            </ResponsiveText>
          </div>

          <div className="bg-gray-100 p-4 rounded w-full">
            <h4 className="text-sm font-medium mb-2">Container Grande</h4>
            <ResponsiveText baseFontSize="text-2xl" containerClassName="w-full">
              R$ 123.456.789,00
            </ResponsiveText>
          </div>
        </div>
      </div>
    </div>
  );
};
