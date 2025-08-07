// src/lib/api/client.ts

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestConfig,
} from "axios";
import { getSession } from "next-auth/react";
import { toastManager } from "../utils/toast-manager";
import { authStorage } from "../utils/auth-storage";
import { ApiError } from "../utils/api";

// Extend the Session type to include custom properties
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
  }
}

// Extend the InternalAxiosRequestConfig to include metadata
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
    _retry?: boolean;
    _retryCount?: number;
  }
}

/**
 * Token refresh state management
 */
interface TokenRefreshState {
  isRefreshing: boolean;
  refreshPromise: Promise<string> | null;
  subscribers: Array<(token: string) => void>;
}

interface ErrorState {
  lastErrorTime: number;
  errorCount: number;
  suppressUntil: number;
}

/**
 * Lista de endpoints que não requerem autenticação
 */
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
  "/health",
  "/system/config",
] as const;

/**
 * Verifica se um endpoint é público
 */
const isPublicEndpoint = (url: string): boolean => {
  return PUBLIC_ENDPOINTS.some(
    (endpoint) => url.startsWith(endpoint) || url.includes(endpoint)
  );
};

class ApiClient {
  private client: AxiosInstance;
  private queryClient: any = null;
  private tokenRefreshState: TokenRefreshState = {
    isRefreshing: false,
    refreshPromise: null,
    subscribers: [],
  };
  private errorState: ErrorState = {
    lastErrorTime: 0,
    errorCount: 0,
    suppressUntil: 0,
  };
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // URL do backend - via proxy interno para evitar CORS em dev
    // Em produção, podemos manter chamadas diretas caso a origem seja a mesma
    const directApiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net/api/v1";
    // Usar proxy em desenvolvimento para resolver CORS definitivamente
    const useProxy = process.env.NODE_ENV === "development";
    const apiUrl = useProxy ? "/api/proxy" : directApiUrl;

    console.log("🔌 API Client initialized with URL:", apiUrl);

    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        "X-Client-Version": process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
        "X-Client-Platform": "web",
      },
      withCredentials: false,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Generate request ID
        config.headers["X-Request-ID"] = this.generateRequestId();

        // Add timestamp for metrics
        config.metadata = { startTime: Date.now() };

        // Skip auth for public endpoints
        const isPublic = isPublicEndpoint(config.url || "");

        if (!isPublic) {
          try {
            let accessToken = authStorage.getAccessToken();

            if (!accessToken) {
              const session = await getSession();
              accessToken = session?.accessToken || null;
              if (accessToken) {
                authStorage.setTokens(accessToken, session?.refreshToken);
              }
            }

            // Check if token is expiring soon
            if (accessToken && authStorage.isTokenExpiringSoon(accessToken)) {
              console.log("🔄 Token expiring soon, refreshing proactively...");
              const refreshToken = authStorage.getRefreshToken();
              if (refreshToken) {
                try {
                  const newToken = await this.refreshToken(
                    accessToken,
                    refreshToken
                  );
                  if (newToken) {
                    accessToken = newToken;
                  }
                } catch (error) {
                  console.warn("⚠️ Proactive refresh failed:", error);
                }
              }
            }

            if (accessToken) {
              config.headers.Authorization = `Bearer ${accessToken}`;
            }
          } catch (error) {
            console.warn("Failed to get session:", error);
          }
        }

        // CSRF token for mutating operations
        if (
          ["POST", "PUT", "DELETE", "PATCH"].includes(
            config.method?.toUpperCase() || ""
          )
        ) {
          const csrfToken = this.getCsrfToken();
          if (csrfToken) {
            config.headers["X-CSRF-Token"] = csrfToken;
          }
        }

        return config;
      },
      (error) => {
        this.logError("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Performance metrics
        if (response.config.metadata?.startTime) {
          const duration = Date.now() - response.config.metadata.startTime;
          this.logPerformance(response.config, duration);
        }
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;

        // Skip retry for public endpoints
        const isPublic = isPublicEndpoint(originalRequest?.url || "");

        // Handle network errors
        if (!error.response) {
          this.handleNetworkError(error);
          return Promise.reject(error);
        }

        // Handle 401 for protected routes
        if (
          error.response.status === 401 &&
          !originalRequest._retry &&
          !isPublic
        ) {
          originalRequest._retry = true;
          return this.handleUnauthorizedError(originalRequest);
        }

        // Retry logic for transient failures
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        // Rate limiting
        if (error.response.status === 429) {
          return this.handleRateLimitError(error, originalRequest);
        }

        // Handle validation errors
        if (error.response.status === 400 || error.response.status === 422) {
          this.handleValidationError(error.response.data);
        } else {
          this.handleApiError(error);
        }

        return Promise.reject(error);
      }
    );
  }

  private handleValidationError(data?: any): void {
    if (this.shouldSuppressError()) {
      return;
    }

    if (!data) {
      toastManager.error("Erro de validação desconhecido");
      return;
    }

    if (data.errors && typeof data.errors === "object") {
      const errorMessages = Object.entries(data.errors).flatMap(
        ([field, messages]) => {
          if (Array.isArray(messages)) {
            return messages.map((msg) => `${field}: ${msg}`);
          }
          return [`${field}: ${messages}`];
        }
      );

      if (errorMessages.length > 0) {
        toastManager.error(errorMessages[0]);
        console.error("Validation errors:", errorMessages);
      }
    } else if (data.message) {
      toastManager.error(data.message);
    } else {
      toastManager.error("Dados inválidos fornecidos");
    }
  }

  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const headers: any = { ...config?.headers };

      if (data instanceof FormData) {
        // Let browser set Content-Type with boundary for FormData
        delete headers["Content-Type"];
      } else if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const response = await this.client.post<T>(url, data, {
        ...config,
        headers,
      });

      // Sincronização forçada mais agressiva
      if (this.queryClient) {
        const resource = url.split("/")[1];
        // Invalida queries relacionadas ao recurso (mais eficiente que removeQueries)
        this.queryClient.invalidateQueries({ queryKey: [resource] });
        // Invalida queries específicas que podem estar relacionadas
        if (resource === "contracts") {
          this.queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
          this.queryClient.invalidateQueries({
            queryKey: ["contracts-statistics"],
          });
          this.queryClient.invalidateQueries({
            queryKey: ["dashboard-metrics"],
          });
          this.queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("POST Error Details:", {
          url,
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      }
      throw error;
    }
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCsrfToken(): string | null {
    if (typeof document !== "undefined") {
      const token = document.querySelector('meta[name="csrf-token"]');
      return token?.getAttribute("content") || null;
    }
    return null;
  }

  private logError(context: string, error: any): void {
    console.error(`[ApiClient] ${context}:`, error);
  }

  private logPerformance(
    config: InternalAxiosRequestConfig,
    duration: number
  ): void {
    if (duration > 1000) {
      console.warn(
        `Slow API call: ${config.method} ${config.url} took ${duration}ms`
      );
    }
  }

  private shouldSuppressError(): boolean {
    const now = Date.now();

    if (now < this.errorState.suppressUntil) {
      return true;
    }

    if (now - this.errorState.lastErrorTime < 1000) {
      this.errorState.errorCount++;
      if (this.errorState.errorCount > 3) {
        this.errorState.suppressUntil = now + 5000;
        return true;
      }
    } else {
      this.errorState.errorCount = 1;
    }

    this.errorState.lastErrorTime = now;
    return false;
  }

  private handleNetworkError(error: AxiosError): void {
    if (this.shouldSuppressError()) {
      return;
    }
    console.error("Network error:", error);
    toastManager.error(
      "Erro de conexão. Verifique sua internet e tente novamente."
    );
  }

  private async handleUnauthorizedError(
    originalRequest: InternalAxiosRequestConfig
  ): Promise<any> {
    if (this.shouldSuppressError()) {
      return Promise.reject(new Error("Unauthorized"));
    }

    console.log("🔐 401 received, attempting token refresh...");

    try {
      const session = await getSession();
      if (session?.accessToken && session?.refreshToken) {
        const newToken = await this.refreshToken(
          session.accessToken,
          session.refreshToken
        );

        if (newToken && originalRequest.headers) {
          console.log("✅ Token refresh successful, retrying request...");
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return this.client.request(originalRequest);
        }
      }
    } catch (refreshError) {
      console.error("❌ Token refresh failed:", refreshError);
      authStorage.clearTokens();
    }

    console.log("🔒 Authentication failed, redirecting to login...");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    return Promise.reject(new Error("Unauthorized"));
  }

  private shouldRetry(
    error: AxiosError,
    config: InternalAxiosRequestConfig
  ): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const maxRetries = 3;
    return (
      retryableStatuses.includes(error.response?.status || 0) &&
      (config._retryCount || 0) < maxRetries
    );
  }

  private async retryRequest(
    originalRequest: InternalAxiosRequestConfig
  ): Promise<any> {
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
    const delay = Math.pow(2, originalRequest._retryCount) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.client.request(originalRequest);
  }

  private async handleRateLimitError(
    error: AxiosError,
    originalRequest: InternalAxiosRequestConfig
  ): Promise<any> {
    const retryAfter = error.response?.headers["retry-after"];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

    if (!this.shouldSuppressError()) {
      toastManager.warning(
        `Rate limit atingido. Tentando novamente em ${delay / 1000} segundos...`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.client.request(originalRequest);
  }

  private async refreshToken(
    accessToken?: string,
    refreshToken?: string
  ): Promise<string | null> {
    if (this.tokenRefreshState.isRefreshing) {
      return new Promise((resolve) => {
        this.tokenRefreshState.subscribers.push(resolve);
      });
    }

    if (!refreshToken) {
      return null;
    }

    this.tokenRefreshState.isRefreshing = true;
    this.tokenRefreshState.refreshPromise = this.performTokenRefresh(
      accessToken,
      refreshToken
    );

    try {
      const newToken = await this.tokenRefreshState.refreshPromise;

      this.tokenRefreshState.subscribers.forEach((callback) =>
        callback(newToken)
      );
      this.tokenRefreshState.subscribers = [];

      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.tokenRefreshState.subscribers.forEach((callback) => callback(""));
      this.tokenRefreshState.subscribers = [];
      return null;
    } finally {
      this.tokenRefreshState.isRefreshing = false;
      this.tokenRefreshState.refreshPromise = null;
    }
  }

  private async performTokenRefresh(
    accessToken?: string,
    refreshToken?: string
  ): Promise<string> {
    try {
      console.log("🔄 Starting token refresh...");

      const response = await axios.post(
        `${this.client.defaults.baseURL}/auth/refresh`,
        {
          accessToken,
          refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const { token: newAccessToken, refreshToken: newRefreshToken } =
        response.data;

      if (!newAccessToken) {
        throw new Error("New access token not received");
      }

      authStorage.setTokens(newAccessToken, newRefreshToken);
      console.log("✅ Token refresh completed successfully");

      return newAccessToken;
    } catch (error: any) {
      console.error("❌ Token refresh failed:", error);

      if (error.response?.status === 401) {
        authStorage.clearTokens();
      }

      throw error;
    }
  }

  private handleApiError(error: AxiosError): void {
    // Be selective about when to surface toasts to the user
    const status = error.response?.status || 0;
    const method = (error.config?.method || "").toUpperCase();
    const url = error.config?.url || "";

    // Many GET endpoints in dashboard can legitimately fail (e.g., migrations not applied)
    // and upstream callers handle it gracefully. Avoid noisy toasts for these cases.
    const isReadOnly = method === "GET";
    const isContractsRead = /\/contracts(\/|\?|$)/.test(url || "");

    if (
      isReadOnly &&
      (status >= 500 || status === 404) &&
      (isContractsRead || true)
    ) {
      // Log but don't toast
      console.warn("Silenced API error (read-only):", { status, method, url });
      return;
    }

    if (this.shouldSuppressError()) {
      return;
    }

    console.error("API error:", error);
    const message =
      (error.response?.data as any)?.message || "Ocorreu um erro inesperado";
    toastManager.error(message);
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);

    // Sincronização forçada mais agressiva
    if (this.queryClient) {
      const resource = url.split("/")[1];
      // Invalida queries relacionadas ao recurso (mais eficiente que removeQueries)
      this.queryClient.invalidateQueries({ queryKey: [resource] });
      // Invalida queries específicas que podem estar relacionadas
      if (resource === "contracts") {
        this.queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
        this.queryClient.invalidateQueries({
          queryKey: ["contracts-statistics"],
        });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    }

    return response.data;
  }

  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);

    // Sincronização forçada mais agressiva
    if (this.queryClient) {
      const resource = url.split("/")[1];
      // Invalida queries relacionadas ao recurso (mais eficiente que removeQueries)
      this.queryClient.invalidateQueries({ queryKey: [resource] });
      // Invalida queries específicas que podem estar relacionadas
      if (resource === "contracts") {
        this.queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
        this.queryClient.invalidateQueries({
          queryKey: ["contracts-statistics"],
        });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    }

    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);

    // Sincronização forçada mais agressiva
    if (this.queryClient) {
      const resource = url.split("/")[1];
      // Invalida queries relacionadas ao recurso (mais eficiente que removeQueries)
      this.queryClient.invalidateQueries({ queryKey: [resource] });
      // Invalida queries específicas que podem estar relacionadas
      if (resource === "contracts") {
        this.queryClient.invalidateQueries({ queryKey: ["contracts-count"] });
        this.queryClient.invalidateQueries({
          queryKey: ["contracts-statistics"],
        });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
        this.queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    }

    return response.data;
  }

  public setQueryClient(queryClient: any): void {
    this.queryClient = queryClient;
  }

  public startAutoRefresh(): void {
    this.scheduleNextRefresh();
  }

  public stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleNextRefresh(): void {
    this.stopAutoRefresh();

    const token = authStorage.getAccessToken();
    if (!token) {
      console.log("🔍 No token found, not scheduling refresh");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const tokenExp = payload.exp;
      const timeUntilExpiry = tokenExp - currentTime;

      // Refresh 10 minutes before expiration
      const refreshTime = Math.max(timeUntilExpiry - 600, 60) * 1000;

      console.log(
        `⏰ Scheduling refresh in ${Math.round(refreshTime / 1000)} seconds`
      );

      this.refreshTimer = setTimeout(async () => {
        console.log("🔄 Executing scheduled auto-refresh...");
        try {
          const refreshToken = authStorage.getRefreshToken();
          if (refreshToken) {
            await this.refreshToken(token, refreshToken);
            console.log("✅ Auto-refresh completed");
            this.scheduleNextRefresh();
          }
        } catch (error) {
          console.error("❌ Auto-refresh failed:", error);
        }
      }, refreshTime);
    } catch (error) {
      console.error("❌ Error scheduling refresh:", error);
    }
  }

  // Public method to get the axios instance (useful for testing)
  public getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export type for dependency injection
export type { ApiClient };
