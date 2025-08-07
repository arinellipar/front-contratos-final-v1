/**
 * @fileoverview Sidebar Component Otimizado para Integração com Header Fixo
 * @module components/layout/Sidebar
 * @description Implementação enterprise do Sidebar com coordenação de z-index,
 * posicionamento relativo ao header fixo e gestão de estado responsivo
 */

"use client";

import React, { useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { useQuery } from "@tanstack/react-query";
import { contractsApi } from "@/lib/api/contracts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import {
  FileText,
  Plus,
  BarChart3,
  Settings,
  Users,
  Home,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Shield,
  Database,
  Bell,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

/**
 * Interface de item de navegação com controle de acesso enterprise
 */
interface NavigationItem {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly description: string;
  readonly badge?: string | number;
  readonly requiredRoles?: string[];
  readonly requiredPermissions?: string[];
  readonly children?: NavigationItem[];
  readonly external?: boolean;
  readonly disabled?: boolean;
}

/**
 * Props interface do Sidebar com suporte a colapso
 */
interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

/**
 * Configuração de navegação enterprise com RBAC
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Visão geral do sistema",
  },
  {
    id: "contracts",
    name: "Contratos",
    href: "/contracts",
    icon: FileText,
    description: "Gerenciar contratos",
  },
  {
    id: "new-contract",
    name: "Novo Contrato",
    href: "/contracts/create",
    icon: Plus,
    description: "Criar novo contrato",
  },
  {
    id: "calendar",
    name: "Calendário",
    href: "/calendar",
    icon: Calendar,
    description: "Visualizar agenda de contratos",
  },
  {
    id: "reports",
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3,
    description: "Relatórios e estatísticas",
    requiredRoles: ["Manager", "Admin"],
  },
  {
    id: "users",
    name: "Usuários",
    href: "/users",
    icon: Users,
    description: "Gerenciar usuários",
    requiredRoles: ["Admin"],
    requiredPermissions: ["users:manage"],
  },
  {
    id: "security",
    name: "Segurança",
    href: "/security",
    icon: Shield,
    description: "Configurações de segurança",
    requiredRoles: ["Admin"],
  },
  {
    id: "database",
    name: "Banco de Dados",
    href: "/database",
    icon: Database,
    description: "Gerenciar dados",
    requiredRoles: ["Admin"],
    disabled: false,
  },
  {
    id: "settings",
    name: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Configurações do sistema",
  },
];

/**
 * Itens de navegação inferior
 */
const BOTTOM_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: "notifications",
    name: "Notificações",
    href: "/notifications",
    icon: Bell,
    description: "Central de notificações",
  },
  {
    id: "help",
    name: "Ajuda",
    href: "/help",
    icon: HelpCircle,
    description: "Central de ajuda",
  },
];

/**
 * Sidebar Component Enterprise com Posicionamento Fixo Coordenado
 * Implementa z-index management e coordenação com header fixo
 */
export default function Sidebar({
  open,
  setOpen,
  collapsed = false,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hasRole, hasPermission, signOut } = useAuth();

  // Buscar dados de contratos para o contador (apenas ativos)
  const { data: contractsData } = useQuery({
    queryKey: ["contracts-count"],
    queryFn: () => contractsApi.getAll({ pageSize: 1000 }), // Buscar todos para filtrar no frontend
    refetchInterval: 3000, // Atualizar a cada 3 segundos para sincronização ultra rápida
    refetchIntervalInBackground: true, // Continua refetchando mesmo com a aba inativa
    staleTime: 0, // Sempre considera os dados como stale para forçar refetch
    refetchOnWindowFocus: true, // Refetch quando a janela ganha foco
  });

  // Hook para notificações com tratamento de erro
  let notificationsCount = 0;
  try {
    const { unreadCount } = useNotifications();
    notificationsCount = unreadCount;
  } catch (error) {
    console.warn("useNotifications hook failed in Sidebar:", error);
  }

  // Refs para otimização de performance
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  /**
   * Itens de navegação filtrados com base em permissões RBAC
   */
  const filteredNavigationItems = useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => {
      // Verificação de papéis necessários
      if (item.requiredRoles && item.requiredRoles.length > 0) {
        const hasRequiredRole = item.requiredRoles.some((role) =>
          hasRole(role)
        );
        if (!hasRequiredRole) return false;
      }

      // Verificação de permissões necessárias
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const hasRequiredPermission = item.requiredPermissions.every(
          (permission) => hasPermission(permission)
        );
        if (!hasRequiredPermission) return false;
      }

      return true;
    });
  }, [hasRole, hasPermission]);

  /**
   * Handler de navegação com analytics e validação
   */
  const handleNavigation = useCallback(
    (item: NavigationItem) => {
      lastInteractionRef.current = Date.now();

      if (item.disabled) {
        return;
      }

      if (item.external) {
        window.open(item.href, "_blank", "noopener,noreferrer");
        return;
      }

      router.push(item.href);

      // Fechar sidebar no mobile após navegação
      if (window.innerWidth < 1024) {
        setOpen(false);
      }
    },
    [router, setOpen]
  );

  /**
   * Verificação de item ativo com suporte a rotas aninhadas
   */
  const isItemActive = useCallback(
    (item: NavigationItem): boolean => {
      if (pathname === item.href) return true;

      // Verificação de rotas aninhadas
      if (item.href !== "/" && pathname.startsWith(item.href)) {
        return true;
      }

      // Verificação de filhos
      if (item.children) {
        return item.children.some((child) => isItemActive(child));
      }

      return false;
    },
    [pathname]
  );

  /**
   * Handler de toggle de colapso com persistência
   */
  const handleCollapseToggle = useCallback(() => {
    const newCollapsedState = !collapsed;
    onCollapsedChange?.(newCollapsedState);

    // Persistir preferência
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sidebar_collapsed",
        JSON.stringify(newCollapsedState)
      );
    }
  }, [collapsed, onCollapsedChange]);

  /**
   * Handler de logout com cleanup
   */
  const handleLogout = useCallback(async () => {
    try {
      console.log("🔐 Sidebar logout initiated");

      // Limpar tokens do localStorage/sessionStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      }

      await signOut();

      console.log("🔐 Sidebar logout completed");
    } catch (error) {
      console.error("Logout error:", error);
      // Em caso de erro, forçar redirecionamento
      router.push("/login");
    }
  }, [signOut, router]);

  /**
   * Suporte a navegação por teclado
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar com Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  /**
   * Click outside handler para mobile
   */
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  /**
   * Renderização de item de navegação com UI aprimorado
   */
  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    // Contador dinâmico para contratos e notificações
    let badgeValue = item.badge;
    if (item.id === "contracts") {
      // Filtrar apenas contratos ativos (status 1)
      const activeContracts =
        contractsData?.data?.filter((contract) => contract.status === 1) || [];
      badgeValue = activeContracts.length;
    } else if (item.id === "notifications") {
      badgeValue = notificationsCount || 0;
    }

    return (
      <button
        key={item.id}
        onClick={() => handleNavigation(item)}
        disabled={item.disabled}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200",
          isActive
            ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
            : "text-gray-700 hover:bg-gray-100",
          item.disabled && "opacity-50 cursor-not-allowed",
          collapsed && "justify-center px-2"
        )}
        aria-label={item.name}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0",
            isActive ? "text-blue-600" : "text-gray-400"
          )}
        />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-500 truncate hidden xl:block">
                {item.description}
              </p>
            </div>
            {badgeValue !== undefined && Number(badgeValue) > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                )}
              >
                {badgeValue}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  /**
   * Classes CSS computadas para o sidebar
   */
  const sidebarClasses = cn(
    // Posicionamento fixo com coordenação de z-index
    "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200",

    // Transições suaves para UX otimizada
    "transition-all duration-300 ease-in-out",

    // Responsividade mobile/desktop
    open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",

    // Largura dinâmica baseada no estado de colapso
    collapsed ? "w-16" : "w-64",

    // Posicionamento considerando header fixo (pt-16 = 4rem height do header)
    "top-16 h-[calc(100vh-4rem)]",

    // Classes customizadas
    className
  );

  return (
    <>
      {/* Overlay móvel com z-index coordenado */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity lg:hidden top-16"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar principal */}
      <aside
        ref={sidebarRef}
        className={sidebarClasses}
        aria-label="Sidebar navigation"
      >
        <div className="flex  items-center justify-between px-4 border-b border-gray-200">
          {/* {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Fradema</h2>
                <p className="text-xs text-gray-500 -mt-1">
                  Sistema de Contratos
                </p>
              </div>
            </div>
          )} */}

          <div className="flex items-center gap-1">
            {/* Toggle de colapso - Desktop apenas */}
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapseToggle}
              className="hidden lg:flex"
              aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button> */}

            {/* Botão fechar - Mobile apenas */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Seção do usuário */}
        {user && (
          <div
            className={cn(
              "px-4 py-3 border-b border-gray-200",
              collapsed && "px-2"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3",
                collapsed && "justify-center"
              )}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                {user.nomeCompleto?.charAt(0).toUpperCase() || "U"}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.nomeCompleto || user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Navegação principal */}
        <nav
          className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
          aria-label="Main navigation"
        >
          {filteredNavigationItems.map(renderNavigationItem)}
        </nav>
        {/* Navegação inferior */}
        <div className="px-3 py-3 space-y-1 border-t border-gray-200">
          {BOTTOM_NAVIGATION_ITEMS.map(renderNavigationItem)}

          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200",
              "text-red-600 hover:bg-red-50",
              collapsed && "justify-center px-2"
            )}
            aria-label="Sair do sistema"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
        {/* Footer */}
        <div
          className={cn(
            "px-4 py-3 border-t border-gray-200",
            collapsed && "px-2"
          )}
        >
          {!collapsed ? (
            <div className="text-center">
              <p className="text-xs text-gray-500">Sistema Fradema v1.0</p>
              <p className="text-xs text-gray-400 mt-1">
                © 2025 Fradema. Todos os direitos reservados.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-gray-500">v1.0</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
