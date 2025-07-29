/**
 * @fileoverview Advanced Authentication Hooks for Fradema Contracts System
 * @module @/lib/auth/hooks
 * @description Enterprise-grade authentication state management with comprehensive
 * session handling, role-based access control, and advanced security features
 * @version 1.0.0
 * @author Fradema Development Team
 */

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isDevelopment = process.env.NODE_ENV === "development";
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  console.log("🔐 useAuth - bypassAuth:", bypassAuth);
  console.log(
    "🔐 useAuth - NEXT_PUBLIC_BYPASS_AUTH:",
    process.env.NEXT_PUBLIC_BYPASS_AUTH
  );

  // Usuário fake para desenvolvimento
  const fakeUser = {
    id: "dev-user-123",
    email: "dev@fradema.com.br",
    name: "Usuário Desenvolvimento",
    nomeCompleto: "Usuário Desenvolvimento",
    image: null,
    roles: ["Admin", "Manager", "User"],
    permissions: [
      "users:manage",
      "contracts:manage",
      "contracts:delete",
      "contracts:export",
      "reports:view",
    ],
  };

  // Função para login fake em desenvolvimento
  const loginFake = async () => {
    if (bypassAuth) {
      console.log("🔓 Using fake login for development");
      // Simula um login bem-sucedido
      return { success: true, user: fakeUser };
    }
    return { success: false };
  };

  // Função para verificar se pode acessar sem autenticação
  const canAccessWithoutAuth = (path: string) => {
    if (bypassAuth) {
      return true;
    }
    return false;
  };

  // Função para obter o usuário atual (real ou fake)
  const getCurrentUser = () => {
    if (bypassAuth && !session) {
      return fakeUser;
    }
    return session?.user;
  };

  // Função para verificar se está autenticado
  const isAuthenticated = () => {
    if (bypassAuth) {
      return true;
    }
    return !!session;
  };

  // Função para verificar se o usuário tem um papel específico
  const hasRole = (role: string): boolean => {
    if (bypassAuth) {
      return true; // Em modo de bypass, tem todos os papéis
    }
    const user = getCurrentUser() as any;
    return user?.roles?.includes(role) || false;
  };

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    console.log("🔐 hasPermission called with:", permission);
    console.log("🔐 bypassAuth:", bypassAuth);

    if (bypassAuth) {
      console.log(
        "🔐 Bypass auth is active, returning true for all permissions"
      );
      return true; // Em modo de bypass, tem todas as permissões
    }

    const user = getCurrentUser() as any;
    console.log("🔐 Current user:", user);

    // Se o usuário tem permissões explícitas, use-as
    if (user?.permissions && Array.isArray(user.permissions)) {
      console.log("🔐 User has explicit permissions:", user.permissions);
      const hasPermission = user.permissions.includes(permission);
      console.log("🔐 Has permission (explicit):", hasPermission);
      return hasPermission;
    }

    // Caso contrário, derive permissões das roles
    const userPermissions = getUserPermissions(user);
    console.log("🔐 Derived permissions from roles:", userPermissions);

    const hasPermission = userPermissions.includes(permission);
    console.log("🔐 Has permission (derived):", hasPermission);

    return hasPermission;
  };

  // Mapeamento de roles para permissões
  const rolePermissions: Record<string, string[]> = {
    Administrator: [
      "users:manage",
      "contracts:manage",
      "contracts:delete",
      "contracts:export",
      "reports:view",
      "system:admin",
    ],
    Manager: [
      "contracts:manage",
      "contracts:delete",
      "contracts:export",
      "reports:view",
    ],
    User: [
      "contracts:read",
      "contracts:create",
      "contracts:update",
      "contracts:delete",
    ],
    Viewer: ["contracts:read", "reports:view", "contracts:delete"],
  };

  // Função para obter permissões baseadas nas roles do usuário
  const getUserPermissions = (user: any): string[] => {
    if (!user?.roles || !Array.isArray(user.roles)) {
      return [];
    }

    const permissions = new Set<string>();

    user.roles.forEach((role: string) => {
      const rolePerms = rolePermissions[role] || [];
      rolePerms.forEach((perm) => permissions.add(perm));
    });

    return Array.from(permissions);
  };

  return {
    session,
    status,
    user: getCurrentUser(),
    isAuthenticated: isAuthenticated(),
    loginFake,
    canAccessWithoutAuth,
    signIn,
    signOut,
    isDevelopment,
    bypassAuth,
    hasRole,
    hasPermission,
    getUserPermissions,
  };
}

// Hook para proteção de rotas com bypass
export function useProtectedRoute(redirectTo = "/login") {
  const { isAuthenticated, canAccessWithoutAuth, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated && !canAccessWithoutAuth("/")) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, canAccessWithoutAuth, status, router, redirectTo]);

  return { isAuthenticated, status };
}

// Hook para requerer autenticação (compatibilidade)
export function useRequireAuth() {
  const { isAuthenticated, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, status, router]);

  return {
    isLoading: status === "loading",
    isAuthenticated,
  };
}
