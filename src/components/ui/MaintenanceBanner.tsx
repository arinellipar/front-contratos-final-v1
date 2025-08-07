// src/components/ui/MaintenanceBanner.tsx
import React from "react";
import { AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "./Button";

interface MaintenanceBannerProps {
  error?: any;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function MaintenanceBanner({
  error,
  onRetry,
  isRetrying = false,
}: MaintenanceBannerProps) {
  const getErrorType = () => {
    if (!error) return null;

    const status = error?.response?.status || error?.status;

    if (status === 500) {
      return {
        type: "server-error",
        title: "Servidor em Manutenção",
        message:
          "O backend está temporariamente indisponível. Isso pode indicar que as migrações do banco de dados estão sendo aplicadas.",
        color: "orange",
        suggestions: [
          "Aguarde alguns minutos e tente novamente",
          "Verifique se há atualizações sendo aplicadas no Azure",
          "Entre em contato com o administrador se o problema persistir",
        ],
      };
    }

    if (status === 401) {
      return {
        type: "auth-error",
        title: "Problema de Autenticação",
        message:
          "Sua sessão pode ter expirado ou há um problema com a autenticação.",
        color: "red",
        suggestions: [
          "Faça logout e login novamente",
          "Limpe o cache do navegador",
          "Verifique se o backend de autenticação está funcionando",
        ],
      };
    }

    if (status === 404) {
      return {
        type: "not-found",
        title: "Endpoint Não Encontrado",
        message: "A API não foi encontrada ou pode estar sendo implantada.",
        color: "blue",
        suggestions: [
          "Verifique se o backend foi implantado corretamente",
          "Confirme se a URL da API está correta",
          "Aguarde se há uma implantação em andamento",
        ],
      };
    }

    return {
      type: "unknown",
      title: "Erro de Conexão",
      message: "Ocorreu um erro inesperado ao conectar com o servidor.",
      color: "gray",
      suggestions: [
        "Verifique sua conexão com a internet",
        "Tente recarregar a página",
        "Entre em contato com o suporte se necessário",
      ],
    };
  };

  const errorInfo = getErrorType();

  if (!errorInfo) return null;

  const colorClasses = {
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    red: "bg-red-50 border-red-200 text-red-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    gray: "bg-gray-50 border-gray-200 text-gray-800",
  };

  const iconColorClasses = {
    orange: "text-orange-500",
    red: "text-red-500",
    blue: "text-blue-500",
    gray: "text-gray-500",
  };

  return (
    <div
      className={`border-l-4 p-4 mb-6 rounded-r-lg ${colorClasses[errorInfo.color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle
            className={`h-5 w-5 ${iconColorClasses[errorInfo.color as keyof typeof iconColorClasses]}`}
          />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{errorInfo.title}</h3>
          <div className="mt-2 text-sm">
            <p>{errorInfo.message}</p>
          </div>

          {errorInfo.suggestions && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-2">Sugestões:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
                />
                {isRetrying ? "Tentando..." : "Tentar Novamente"}
              </Button>
            )}

            <Button
              onClick={() => window.open("/connection-test", "_blank")}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Teste de Conectividade
            </Button>
          </div>

          {error && (
            <details className="mt-3">
              <summary className="text-sm font-medium cursor-pointer hover:underline">
                Detalhes Técnicos
              </summary>
              <pre className="mt-2 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(
                  {
                    status: error?.response?.status || error?.status,
                    statusText:
                      error?.response?.statusText || error?.statusText,
                    url: error?.config?.url || error?.url,
                    method: error?.config?.method || error?.method,
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
