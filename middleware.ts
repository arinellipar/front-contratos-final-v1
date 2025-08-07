// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Verifica se está em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === "development";
const bypassAuth = process.env.BYPASS_AUTH === "true";

// Middleware simplificado para desenvolvimento
export default withAuth(
  function middleware(req) {
    // Permitir rotas do proxy sem autenticação
    if (req.nextUrl.pathname.startsWith("/api/proxy")) {
      return NextResponse.next();
    }

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
        // Permitir rotas do proxy sem autenticação
        if (req.nextUrl.pathname.startsWith("/api/proxy")) {
          return true;
        }

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
    // Apenas páginas específicas que precisam de autenticação
    "/dashboard/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/profile/:path*",
    "/contracts/:path*",
    "/users/:path*",
    "/files/:path*",
  ],
};
