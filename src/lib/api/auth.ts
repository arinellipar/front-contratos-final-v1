// src/lib/api/auth.ts - Versão Corrigida

import axios from "axios";
import { apiClient } from "./client";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "@/lib/types/user";

/**
 * Interface estendida para dados de registro
 * Implementa validação no cliente antes do envio
 */
interface ExtendedRegisterData extends RegisterData {
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Serviço de autenticação com tratamento robusto de erros
 */
export const authApi = {
  /**
   * Login de usuário com credenciais
   * @param credentials - Credenciais de login (email e senha)
   * @returns Promise<AuthResponse> - Resposta com tokens e dados do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );

      // Armazena tokens de forma segura
      if (response.token) {
        this.storeTokens(response.token, response.refreshToken);
      }

      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        const errorMessage = apiError?.message || "Erro ao fazer login";
        console.error("Login error:", errorMessage);
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Registro de novo usuário com validação completa
   * @param data - Dados do formulário de registro
   * @returns Promise<AuthResponse> - Resposta com tokens e dados do usuário
   * @throws ApiError - Em caso de falha na validação ou registro
   */
  async register(data: ExtendedRegisterData): Promise<AuthResponse> {
    try {
      // Verificar se os campos existem
      if (!data.password || !data.confirmPassword) {
        throw new Error("Senha e confirmação de senha são obrigatórias");
      }

      // Limpar espaços em branco dos campos de senha
      const cleanPassword = data.password.trim();
      const cleanConfirmPassword = data.confirmPassword.trim();

      // Validação prévia no cliente
      if (cleanPassword !== cleanConfirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (!data.acceptTerms) {
        throw new Error("Você deve aceitar os termos de uso");
      }

      // Remove campos não esperados pelo backend e ajusta nomes
      const { confirmPassword, acceptTerms, ...registerPayload } = data;

      // Ajusta o payload para o formato esperado pelo backend
      const payload = {
        email: registerPayload.email,
        password: cleanPassword,
        confirmPassword: cleanConfirmPassword,
        nomeCompleto: registerPayload.nomeCompleto,
      };

      // Log para debugging (remover em produção)
      console.debug("Register payload:", {
        ...payload,
        password: "[REDACTED]",
      });

      // Requisição para o endpoint de registro
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        payload
      );

      // Validação da resposta
      if (!response.token) {
        throw new Error("Resposta de registro inválida: token ausente");
      }

      // Armazena tokens de forma segura
      this.storeTokens(response.token, response.refreshToken);

      // Retorna resposta completa
      return response;
    } catch (error) {
      // Tratamento específico de erros
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        // Mapeia erros comuns do backend
        if (apiError?.message?.includes("email already exists")) {
          throw new Error("Este email já está cadastrado");
        }

        if (apiError?.message?.includes("password requirements")) {
          throw new Error("A senha não atende aos requisitos mínimos");
        }

        console.error("Register error:", apiError?.message || "Unknown error");

        // Re-throw com mensagem mais amigável
        throw new Error(apiError?.message || "Erro ao criar conta");
      }

      // Re-throw erros de validação do cliente
      throw error;
    }
  },

  /**
   * Armazenamento seguro de tokens
   * Implementa múltiplas estratégias de storage
   */
  storeTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === "undefined") return;

    try {
      // Estratégia 1: SessionStorage (mais seguro para SPA)
      sessionStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        sessionStorage.setItem("refreshToken", refreshToken);
      }

      // Estratégia 2: Cookie seguro (para SSR)
      if (process.env.NEXT_PUBLIC_USE_SECURE_COOKIES === "true") {
        document.cookie = `accessToken=${accessToken}; Path=/; SameSite=Strict; Secure`;
        if (refreshToken) {
          document.cookie = `refreshToken=${refreshToken}; Path=/; SameSite=Strict; Secure; HttpOnly`;
        }
      }

      // Dispara evento customizado para sincronização entre abas
      window.dispatchEvent(
        new CustomEvent("auth-tokens-updated", {
          detail: { hasTokens: true },
        })
      );
    } catch (error) {
      console.error("Failed to store tokens:", error);
      throw new Error("Erro ao armazenar credenciais de autenticação");
    }
  },
};
