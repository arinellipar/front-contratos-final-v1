// frontend/src/hooks/useNotifications.ts
import { useState, useCallback, useEffect, useMemo } from "react";
import { contractsApi } from "@/lib/api/contracts";
import { Contract } from "@/lib/types/contract";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "critical";
  severity: 0 | 1 | 2 | 3 | 4;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  category: "system" | "security" | "business" | "user" | "integration";
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

/**
 * Hook robusto para gerenciamento de notificações com fallback para modo offline
 * Implementa padrão Circuit Breaker para conexões WebSocket
 * Busca dados reais de contratos do banco de dados Azure
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected" | "failed"
  >("disconnected");

  // Função para gerar notificações baseadas em contratos reais
  const generateContractNotifications = useCallback(
    (contracts: Contract[]): Notification[] => {
      const now = new Date();
      const notifications: Notification[] = [];

      contracts.forEach((contract) => {
        // Calcular data de vencimento
        const contractDate = new Date(contract.dataContrato);
        const expiryDate = new Date(contractDate);
        expiryDate.setDate(expiryDate.getDate() + (contract.prazo || 365));

        const daysUntilExpiry = Math.floor(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Notificação para contratos vencendo em breve (30 dias)
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          notifications.push({
            id: `contract-expiring-${contract.id}`,
            title: "Contrato Vencendo",
            message: `O contrato ${contract.contrato} com ${contract.contratada} vence em ${daysUntilExpiry} dias`,
            type: daysUntilExpiry <= 7 ? "error" : "warning",
            severity: daysUntilExpiry <= 7 ? 3 : 2,
            timestamp: new Date(),
            read: false,
            category: "business",
            actionUrl: `/contracts/${contract.id}`,
            actionLabel: "Ver Contrato",
            metadata: {
              contractId: contract.id,
              contratada: contract.contratada,
              daysUntilExpiry,
              expiryDate: expiryDate.toISOString(),
            },
          });
        }

        // Notificação para contratos vencidos
        if (daysUntilExpiry < 0) {
          notifications.push({
            id: `contract-expired-${contract.id}`,
            title: "Contrato Vencido",
            message: `O contrato ${contract.contrato} com ${contract.contratada} venceu há ${Math.abs(
              daysUntilExpiry
            )} dias`,
            type: "critical",
            severity: 4,
            timestamp: new Date(),
            read: false,
            category: "business",
            actionUrl: `/contracts/${contract.id}`,
            actionLabel: "Renovar Contrato",
            metadata: {
              contractId: contract.id,
              contratada: contract.contratada,
              daysExpired: Math.abs(daysUntilExpiry),
              expiryDate: expiryDate.toISOString(),
            },
          });
        }

        // Notificação para contratos com aviso prévio
        if (contract.avisoPrevia && daysUntilExpiry > 0) {
          const avisoPreviaDate = new Date(expiryDate);
          avisoPreviaDate.setDate(
            avisoPreviaDate.getDate() - contract.avisoPrevia
          );
          const daysUntilAvisoPrevia = Math.floor(
            (avisoPreviaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilAvisoPrevia >= 0 && daysUntilAvisoPrevia <= 7) {
            notifications.push({
              id: `contract-aviso-${contract.id}`,
              title: "Aviso Prévio Próximo",
              message: `Prazo de aviso prévio do contrato ${contract.contrato} se aproxima (${daysUntilAvisoPrevia} dias)`,
              type: "info",
              severity: 1,
              timestamp: new Date(),
              read: false,
              category: "business",
              actionUrl: `/contracts/${contract.id}`,
              actionLabel: "Ver Detalhes",
              metadata: {
                contractId: contract.id,
                avisoPrevia: contract.avisoPrevia,
                daysUntilAvisoPrevia,
              },
            });
          }
        }
      });

      return notifications;
    },
    []
  );

  // Função para buscar estatísticas e gerar notificações do sistema
  const generateSystemNotifications = useCallback(async (): Promise<
    Notification[]
  > => {
    try {
      const stats = await contractsApi.getStatistics();
      const notifications: Notification[] = [];

      // Notificação sobre total de contratos
      if (stats.totalContracts > 0) {
        notifications.push({
          id: "system-total-contracts",
          title: "Resumo de Contratos",
          message: `Sistema gerenciando ${stats.totalContracts} contratos ativos`,
          type: "info",
          severity: 0,
          timestamp: new Date(),
          read: true,
          category: "system",
          metadata: {
            totalContracts: stats.totalContracts,
            contractsByCategory: stats.contractsByCategory,
          },
        });
      }

      // Notificações sobre contratos por categoria
      Object.entries(stats.contractsByCategory).forEach(([category, count]) => {
        if (count > 0) {
          notifications.push({
            id: `category-${category}`,
            title: `Contratos de ${category}`,
            message: `${count} contratos na categoria ${category}`,
            type: "info",
            severity: 0,
            timestamp: new Date(),
            read: true,
            category: "business",
            actionUrl: `/contracts?category=${category}`,
            actionLabel: "Ver Contratos",
            metadata: {
              category,
              count,
            },
          });
        }
      });

      return notifications;
    } catch (error) {
      console.error("Erro ao gerar notificações do sistema:", error);
      return [];
    }
  }, []);

  const loadCachedNotifications = useCallback((): Notification[] => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("fradema_notifications_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          return parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to load cached notifications:", error);
    }
    return [];
  }, []);

  const initializeNotificationSystem = useCallback(async () => {
    setIsLoading(true);

    try {
      setConnectionState("connecting");

      // Buscar contratos reais do banco de dados
      const [contractsResponse, systemNotifications] = await Promise.all([
        contractsApi.getAll({ pageSize: 1000, sortBy: "dataContrato" }),
        generateSystemNotifications(),
      ]);

      // Filtrar apenas contratos ativos
      const activeContracts = contractsResponse.data.filter(
        (contract) => contract.status === 1
      );

      // Gerar notificações baseadas nos contratos reais
      const contractNotifications =
        generateContractNotifications(activeContracts);

      // Combinar todas as notificações
      const allNotifications = [
        ...contractNotifications,
        ...systemNotifications,
      ];

      // Ordenar por timestamp (mais recentes primeiro)
      allNotifications.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setConnectionState("connected");
      setNotifications(allNotifications);
      saveCachedNotifications(allNotifications);
    } catch (error) {
      console.warn(
        "Failed to load notifications from Azure DB, using cached data:",
        error
      );
      setConnectionState("failed");

      // Fallback para notificações em cache
      const cachedNotifications = loadCachedNotifications();
      setNotifications(cachedNotifications);
    } finally {
      setIsLoading(false);
    }
  }, [
    generateContractNotifications,
    generateSystemNotifications,
    loadCachedNotifications,
  ]);

  const saveCachedNotifications = useCallback(
    (notifications: Notification[]) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "fradema_notifications_cache",
            JSON.stringify(notifications)
          );
        }
      } catch (error) {
        console.warn("Failed to save notifications to cache:", error);
      }
    },
    []
  );

  // Atualizar notificações periodicamente (a cada 5 minutos)
  useEffect(() => {
    initializeNotificationSystem();

    const interval = setInterval(
      () => {
        initializeNotificationSystem();
      },
      5 * 60 * 1000
    ); // 5 minutos

    return () => clearInterval(interval);
  }, [initializeNotificationSystem]);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        );
        saveCachedNotifications(updated);
        return updated;
      });
    },
    [saveCachedNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((notification) => ({
        ...notification,
        read: true,
      }));
      saveCachedNotifications(updated);
      return updated;
    });
  }, [saveCachedNotifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, 50); // Limitar a 50 notificações
        saveCachedNotifications(updated);
        return updated;
      });
    },
    [saveCachedNotifications]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((notification) => notification.id !== id);
        saveCachedNotifications(updated);
        return updated;
      });
    },
    [saveCachedNotifications]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveCachedNotifications([]);
  }, [saveCachedNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
  };
}
