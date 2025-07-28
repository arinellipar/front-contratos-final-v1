// src/components/layout/UpdatedHeader.tsx
// Exemplo de como integrar a nova search bar no Header existente

"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useAuth } from "@/lib/auth/hooks";
import { useTheme } from "@/providers/ThemeProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { HeaderSearch } from "@/components/search/SearchIntegration";
import {
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  HelpCircle,
  Building2,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

interface HeaderProps {
  onMenuClick: () => void;
  className?: string;
  fixed?: boolean;
  transparent?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  customActions?: React.ReactNode;
}

export default function UpdatedHeader({
  onMenuClick,
  className,
  fixed = true,
  transparent = false,
  showSearch = true,
  showNotifications = true,
  customActions,
}: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  // Notifications with error handling
  let notificationsHookResult;
  try {
    notificationsHookResult = useNotifications();
  } catch (error) {
    console.warn("useNotifications hook failed:", error);
    notificationsHookResult = {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading: notificationsLoading,
  } = notificationsHookResult;

  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      setIsScrolled(scrolled);
    };

    if (fixed) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll(); // Check initial state
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [fixed]);

  // Logout handler
  const handleSignOut = useCallback(async () => {
    try {
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, []);

  // Handle search submission
  const handleSearchSubmit = useCallback(
    (query: string) => {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router]
  );

  // Get notification icon
  const getNotificationIcon = useCallback((notification: any) => {
    const iconMap = {
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
      critical: XCircle,
      info: Info,
    };
    return iconMap[notification.type as keyof typeof iconMap] || Info;
  }, []);

  // Get notification style
  const getNotificationStyle = useCallback((type: string) => {
    const styleMap = {
      info: "bg-blue-50 text-blue-700 border-blue-200",
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      warning: "bg-amber-50 text-amber-700 border-amber-200",
      error: "bg-red-50 text-red-700 border-red-200",
      critical: "bg-red-100 text-red-900 border-red-300",
    };
    return styleMap[type as keyof typeof styleMap] || styleMap.info;
  }, []);

  // Header classes
  const headerClasses = cn(
    // Base styling
    "bg-white shadow-sm border-b border-slate-200 transition-all duration-300",

    // Fixed positioning
    fixed && "fixed top-0 left-0 right-0 z-50",

    // Transparency and scroll states
    transparent &&
      !isScrolled &&
      "bg-transparent border-transparent shadow-none",
    isScrolled && "bg-white/95 backdrop-blur-md shadow-lg",

    // Height
    "h-16 flex items-center",

    className
  );

  return (
    <header ref={headerRef} className={headerClasses}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left Section - Menu and Branding */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden flex-shrink-0 h-10 w-10"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Corporate Branding */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Image
                src="/logo_fradema2.png"
                alt="Logo"
                width={70}
                height={35}
                className=""
              />
              {/* <div className="w-10 h-10 bg-gradient-to-br from-[#0a2540] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div> */}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Fradema
                </h1>
                <p className="text-xs text-slate-500 leading-tight">
                  Sistema de Contratos
                </p>
              </div>
            </div>
          </div>

          {/* Center Section - Enhanced Search */}
          {showSearch && (
            <div className="flex-1 max-w-2xl min-w-0 mx-4">
              <HeaderSearch
                onSearchSubmit={handleSearchSubmit}
                showQuickActions={true}
                className="w-full"
              />
            </div>
          )}

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {customActions}

            {/* Theme Toggle */}
            <DropdownMenu.Root>
              {/* <DropdownMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Alterar tema"
                >
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenu.Trigger> */}
              {/* <DropdownMenu.Portal>
                <DropdownMenu.Content className="min-w-[140px] bg-white rounded-lg shadow-xl border z-50">
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4" />
                    Claro
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4" />
                    Escuro
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-4 w-4" />
                    Sistema
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal> */}
            </DropdownMenu.Root>

            {/* Notifications */}
            {showNotifications && isAuthenticated && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-12 w-12 bg-blue-500/90 flex items-center justify-center"
                  >
                    <Bell className="h-9 w-9 mt-3" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="w-[420px] bg-white rounded-lg shadow-xl border z-50">
                    <div className="px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Notificações
                          </h3>
                          <p className="text-xs text-slate-500">
                            {unreadCount} não lidas
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-[#0a2540] hover:text-[#1e3a8a] font-medium"
                          >
                            Marcar como lidas
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-[#0a2540] mx-auto" />
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => {
                          const Icon = getNotificationIcon(notification);
                          return (
                            <div
                              key={notification.id}
                              className={cn(
                                "px-4 py-3 border-b hover:bg-slate-50 cursor-pointer",
                                !notification.read && "bg-blue-50/50"
                              )}
                              onClick={() => {
                                markAsRead(notification.id);
                                if (notification.actionUrl) {
                                  router.push(notification.actionUrl);
                                }
                              }}
                            >
                              <div className="flex gap-3">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    getNotificationStyle(notification.type)
                                  )}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium">
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-2">
                                    {format(
                                      notification.timestamp,
                                      "dd/MM 'às' HH:mm",
                                      { locale: ptBR }
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">Nenhuma notificação</p>
                        </div>
                      )}
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}

            {/* User Menu */}
            {/* {isAuthenticated && user && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-10 px-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {user.nomeCompleto?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-slate-900 leading-none">
                        {user.nomeCompleto?.split(" ")[0] || user.name}
                      </p>
                      <p className="text-xs text-slate-500 leading-none mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="min-w-[200px] bg-white rounded-lg shadow-xl border z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium text-slate-900">
                        {user.nomeCompleto || user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push("/profile")}
                    >
                      <User className="h-4 w-4" />
                      Meu Perfil
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push("/settings")}
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push("/help")}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Ajuda
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />

                    <DropdownMenu.Item
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-600 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )} */}
          </div>
        </div>
      </div>
    </header>
  );
}
