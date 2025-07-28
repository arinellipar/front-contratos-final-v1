// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Verifica se está em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === "development";
const bypassAuth = process.env.BYPASS_AUTH === "true";

// Middleware simplificado para desenvolvimento
export default withAuth(
  function middleware() {
    // Se estiver em modo de bypass, permite acesso livre
    if (bypassAuth) {
      console.log("🔓 Bypass auth enabled - allowing free access");
      return NextResponse.next();
    }

    // Middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Se estiver em modo de bypass, sempre autoriza
        if (bypassAuth) {
          return true;
        }
        // Caso contrário, verifica se tem token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/profile/:path*",
    "/api/contracts/:path*",
    "/api/users/:path*",
    "/api/files/:path*",
  ],
};
