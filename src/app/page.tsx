// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (status === "loading") return;

      setIsRedirecting(true);

      if (isAuthenticated) {
        router.replace("/contracts");
      } else {
        router.replace("/login");
      }
    };

    checkAuthAndRedirect();
  }, [isAuthenticated, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {status === "loading"
            ? "Verificando autenticação..."
            : "Redirecionando..."}
        </p>
      </div>
    </div>
  );
}
