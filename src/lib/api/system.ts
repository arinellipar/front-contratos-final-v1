// src/lib/api/system.ts
import { apiClient } from "./client";

/**
 * System API service for health checks and system operations
 */
export const systemApi = {
  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    return apiClient.get("/health");
  },

  /**
   * Get system configuration (public settings)
   */
  async getConfig(): Promise<{
    version: string;
    features: Record<string, boolean>;
    maintenance: boolean;
  }> {
    try {
      return await apiClient.get("/system/config");
    } catch (error) {
      // Retornar configuração padrão enquanto o endpoint não existe
      console.warn("System config endpoint not available, using defaults");
      return {
        version: "1.0.0",
        features: {
          contracts: true,
          users: true,
          reports: true,
        },
        maintenance: false,
      };
    }
  },

  /**
   * Get system statistics (admin)
   */
  async getStatistics(): Promise<{
    users: number;
    contracts: number;
    storage: {
      used: number;
      total: number;
    };
    lastBackup: string;
  }> {
    try {
      return await apiClient.get("/system/statistics");
    } catch (error) {
      // Retornar estatísticas vazias enquanto o endpoint não existe
      console.warn("System statistics endpoint not available, using defaults");
      return {
        users: 0,
        contracts: 0,
        storage: {
          used: 0,
          total: 100 * 1024 * 1024 * 1024, // 100GB
        },
        lastBackup: new Date().toISOString(),
      };
    }
  },

  /**
   * Get enhanced system metrics for dashboard
   */
  async getDashboardSystemMetrics(): Promise<{
    users: number;
    contracts: number;
    storage: {
      used: number;
      total: number;
      usagePercentage: number;
      formattedUsed: string;
      formattedTotal: string;
    };
    lastBackup: string;
    systemHealth: "healthy" | "warning" | "critical";
    uptime: string;
  }> {
    try {
      const stats = await this.getStatistics();

      const usagePercentage = (stats.storage.used / stats.storage.total) * 100;
      const formatBytes = (bytes: number) => {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        if (bytes === 0) return "0 Bytes";
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (
          Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
        );
      };

      const systemHealth: "healthy" | "warning" | "critical" =
        usagePercentage > 90
          ? "critical"
          : usagePercentage > 75
            ? "warning"
            : "healthy";

      return {
        ...stats,
        storage: {
          ...stats.storage,
          usagePercentage,
          formattedUsed: formatBytes(stats.storage.used),
          formattedTotal: formatBytes(stats.storage.total),
        },
        systemHealth,
        uptime: new Date().toISOString(),
      };
    } catch (error) {
      // Retornar dados mockados temporariamente enquanto o backend não implementa esses endpoints
      console.warn("System statistics endpoint not available, using mock data");

      const mockData = {
        users: 0,
        contracts: 0,
        storage: {
          used: 0,
          total: 100 * 1024 * 1024 * 1024, // 100GB
          usagePercentage: 0,
          formattedUsed: "0 Bytes",
          formattedTotal: "100 GB",
        },
        lastBackup: new Date().toISOString(),
        systemHealth: "healthy" as const,
        uptime: new Date().toISOString(),
      };

      return mockData;
    }
  },

  /**
   * Trigger system backup (admin)
   */
  async backup(): Promise<{
    backupId: string;
    status: string;
  }> {
    return apiClient.post("/system/backup");
  },
};
