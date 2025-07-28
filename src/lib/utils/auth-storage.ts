interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken?: string): void;
  clearTokens(): void;
  isTokenExpired(token: string): boolean;
}

// Extender Window para incluir apiClient
declare global {
  interface Window {
    apiClient?: any;
  }
}

class AuthStorage implements TokenStorage {
  private readonly ACCESS_TOKEN_KEY = "accessToken";
  private readonly REFRESH_TOKEN_KEY = "refreshToken";

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === "undefined") return;

    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    window.dispatchEvent(
      new CustomEvent("auth:tokens-updated", {
        detail: { accessToken, refreshToken },
      })
    );

    // Inicia refresh automático quando tokens são salvos
    if (typeof window !== "undefined" && window.apiClient) {
      window.apiClient.startAutoRefresh();
    }
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;

    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);

    window.dispatchEvent(new CustomEvent("auth:tokens-cleared"));
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutesFromNow = currentTime + 5 * 60;
      return payload.exp < fiveMinutesFromNow;
    } catch {
      return true;
    }
  }
}

export const authStorage = new AuthStorage();
