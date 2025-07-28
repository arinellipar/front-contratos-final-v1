"use client";

import { useAuth } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/Button";

export function DevLoginBanner() {
  const { isDevelopment, bypassAuth, loginFake, user } = useAuth();

  if (!isDevelopment && !bypassAuth) {
    return null;
  }

  return (
    // <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center z-50">
    <div className="flex items-center justify-center gap-4">
      <span className="text-sm font-medium">🔓 Modo Desenvolvimento</span>
      {user && (
        <span className="text-sm">
          Logado como: {user.nomeCompleto} ({user.email})
        </span>
      )}
      <Button
        onClick={loginFake}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        Login Fake
      </Button>
    </div>
    // </div>
  );
}
