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
import { motion } from "framer-motion";
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
      console.log("🔐 Header logout initiated");

      // Limpar tokens do localStorage/sessionStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      }

      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Em caso de erro, forçar redirecionamento
      router.push("/login");
    }
  }, [router]);

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

            {/* Enhanced Corporate Branding */}
            <motion.div
              className="flex items-center gap-4 flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Image
                  src="/logo_fradema2.png"
                  alt="Logo Fradema"
                  width={70}
                  height={35}
                  className="drop-shadow-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-navy-500/10 to-transparent rounded-lg pointer-events-none" />
              </motion.div>

              <div className="hidden sm:block space-y-0.5">
                <motion.h1
                  className="text-xl font-bold leading-tight"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 bg-clip-text text-transparent">
                    Fradema
                  </span>
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold text-navy-700 leading-tight tracking-wider uppercase">
                    Sistema de Contratos
                  </p>
                  <div className="px-2 py-0.5 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                      2025
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

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
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <DropdownMenu.Trigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="ghost"
                            className="flex items-center gap-3 h-12 px-3 bg-white/60 hover:bg-white/80 border border-navy-200/50 backdrop-blur-sm rounded-xl"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {user.nomeCompleto?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                            <div className="hidden lg:block text-left">
                              <p className="text-sm font-bold text-navy-900 leading-none">
                                {user.nomeCompleto?.split(" ")[0] || user.name}
                              </p>
                              <p className="text-xs text-navy-600 leading-none mt-0.5 font-medium">
                                {user.email}
                              </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-navy-600" />
                          </Button>
                        </motion.div>
                      </DropdownMenu.Trigger>
                    </Tooltip.Trigger>

                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="glass-morphism-strong rounded-xl p-4 border border-navy-100/50 shadow-xl max-w-xs z-50"
                        sideOffset={5}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-navy-600 to-navy-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {user.nomeCompleto?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-navy-900">
                                {user.nomeCompleto || user.name}
                              </p>
                              <p className="text-xs text-navy-600 font-medium">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-navy-100">
                            <p className="text-xs text-navy-600">
                              Clique para acessar configurações e perfil
                            </p>
                          </div>
                        </div>
                        <Tooltip.Arrow className="fill-white" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content className="glass-morphism-strong rounded-2xl border border-navy-100/50 shadow-xl min-w-[220px] z-50">
                    <div className="p-4 border-b border-navy-100/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {user.nomeCompleto?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-900">
                            {user.nomeCompleto || user.name}
                          </p>
                          <p className="text-xs text-navy-600 font-medium">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <DropdownMenu.Item
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-navy-50 cursor-pointer rounded-lg transition-colors"
                        onClick={() => router.push("/profile")}
                      >
                        <User className="h-4 w-4 text-navy-600" />
                        <span className="font-medium text-navy-900">
                          Meu Perfil
                        </span>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-navy-50 cursor-pointer rounded-lg transition-colors"
                        onClick={() => router.push("/settings")}
                      >
                        <Settings className="h-4 w-4 text-navy-600" />
                        <span className="font-medium text-navy-900">
                          Configurações
                        </span>
                      </DropdownMenu.Item>

                      <DropdownMenu.Item
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-navy-50 cursor-pointer rounded-lg transition-colors"
                        onClick={() => router.push("/help")}
                      >
                        <HelpCircle className="h-4 w-4 text-navy-600" />
                        <span className="font-medium text-navy-900">Ajuda</span>
                      </DropdownMenu.Item>

                      <DropdownMenu.Separator className="my-2 h-px bg-navy-100" />

                      <DropdownMenu.Item
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-red-50 text-red-600 cursor-pointer rounded-lg transition-colors"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="font-medium">Sair</span>
                      </DropdownMenu.Item>
                    </div>
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
