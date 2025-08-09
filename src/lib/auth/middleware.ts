/**
 * @fileoverview NextAuth Middleware for Route Protection
 * @module @/lib/auth/middleware
 * @description Comprehensive authentication middleware with role-based access control,
 * session validation, and intelligent routing for the Fradema Contracts System
 */

import { withAuth, NextAuthMiddlewareOptions } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";

/**
 * Extended JWT token interface with custom properties
 */
interface ExtendedJWT extends Omit<JWT, "accessToken"> {
  user?: {
    id: string;
    email: string;
    nomeCompleto: string;
    roles: string[];
    emailConfirmed?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Route configuration with role requirements
 */
interface RouteConfig {
  path: string;
  requiredRoles?: string[];
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

/**
 * Protected routes configuration
 */
const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin routes
  {
    path: "/admin",
    requiredRoles: ["Admin", "SuperAdmin"],
    redirectTo: "/unauthorized",
  },
  {
    path: "/users",
    requiredRoles: ["Admin", "SuperAdmin"],
    redirectTo: "/unauthorized",
  },

  // Manager routes
  {
    path: "/manager",
    requiredRoles: ["Manager", "Admin", "SuperAdmin"],
    redirectTo: "/unauthorized",
  },
  {
    path: "/reports",
    requiredRoles: ["Manager", "Admin", "SuperAdmin"],
    redirectTo: "/unauthorized",
  },

  // Authenticated routes (any logged-in user)
  {
    path: "/dashboard",
    requiredRoles: [],
    requireEmailVerification: true,
  },
  {
    path: "/profile",
    requiredRoles: [],
  },

  // API routes
  {
    path: "/api/contracts",
    requiredRoles: [],
  },
  {
    path: "/api/users",
    requiredRoles: ["Admin", "SuperAdmin"],
  },
  {
    path: "/api/files",
    requiredRoles: [],
  },
];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/error",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/public",
];

/**
 * Check if a path matches a route pattern
 */
const matchPath = (pathname: string, pattern: string): boolean => {
  // Exact match
  if (pathname === pattern) return true;

  // Prefix match for directories
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  // Subdirectory match
  return pathname.startsWith(pattern + "/");
};

/**
 * Check if user has required roles
 */
const hasRequiredRoles = (
  userRoles: string[] | undefined,
  requiredRoles: string[] | undefined
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (!userRoles || userRoles.length === 0) return false;

  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Get route configuration for a given pathname
 */
const getRouteConfig = (pathname: string): RouteConfig | null => {
  for (const route of PROTECTED_ROUTES) {
    if (matchPath(pathname, route.path)) {
      return route;
    }
  }
  return null;
};

/**
 * Check if route is public
 */
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => matchPath(pathname, route));
};

/**
 * Main authentication middleware
 */
export const authMiddleware = withAuth(
  async function middleware(req) {
    const token = req.nextauth.token as ExtendedJWT | null;
    const pathname = req.nextUrl.pathname;

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    // Check for token errors
    if (token.error === "RefreshTokenError") {
      return NextResponse.redirect(
        new URL("/login?error=SessionExpired", req.url)
      );
    }

    // Get route configuration
    const routeConfig = getRouteConfig(pathname);

    if (routeConfig) {
      // Check email verification requirement
      if (routeConfig.requireEmailVerification && !token.user?.emailConfirmed) {
        return NextResponse.redirect(new URL("/auth/verify-email", req.url));
      }

      // Check role requirements
      if (!hasRequiredRoles(token.user?.roles, routeConfig.requiredRoles)) {
        const redirectTo = routeConfig.redirectTo || "/unauthorized";
        return NextResponse.redirect(new URL(redirectTo, req.url));
      }
    }

    // Add custom headers for downstream use
    const response = NextResponse.next();

    if (token.user) {
      response.headers.set("x-user-id", token.user.id);
      response.headers.set("x-user-roles", token.user.roles.join(","));
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes are always authorized
        if (isPublicRoute(pathname)) {
          return true;
        }

        // Protected routes require a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
      error: "/auth/error",
    },
  } as NextAuthMiddlewareOptions
);

/**
 * Create custom middleware wrapper with additional features
 */
export function createAuthMiddleware(options?: {
  additionalPublicRoutes?: string[];
  additionalProtectedRoutes?: RouteConfig[];
  onUnauthorized?: (req: NextRequest) => NextResponse | void;
}) {
  // Add additional routes if provided
  if (options?.additionalPublicRoutes) {
    PUBLIC_ROUTES.push(...options.additionalPublicRoutes);
  }

  if (options?.additionalProtectedRoutes) {
    PROTECTED_ROUTES.push(...options.additionalProtectedRoutes);
  }

  return withAuth(
    async function middleware(req, event) {
      const token = req.nextauth.token as ExtendedJWT | null;

      // Custom unauthorized handler
      if (!token && options?.onUnauthorized) {
        const customResponse = options.onUnauthorized(req);
        if (customResponse) {
          return customResponse;
        }
      }

      // Use the default middleware logic
      return authMiddleware(req as any, event);
    },
    {
      callbacks: {
        authorized: ({ token, req }) => {
          if (isPublicRoute(req.nextUrl.pathname)) {
            return true;
          }

          return !!token;
        },
      },
      pages: {
        signIn: "/login",
        error: "/auth/error",
      },
    } as NextAuthMiddlewareOptions
  );
}

/**
 * Utility function to check if a user can access a specific route
 */
export function canAccessRoute(
  pathname: string,
  userRoles?: string[],
  emailVerified?: boolean
): boolean {
  // Public routes are always accessible
  if (isPublicRoute(pathname)) {
    return true;
  }

  // Get route configuration
  const routeConfig = getRouteConfig(pathname);

  if (!routeConfig) {
    // If no specific configuration, assume it's a protected route
    return false;
  }

  // Check email verification
  if (routeConfig.requireEmailVerification && !emailVerified) {
    return false;
  }

  // Check role requirements
  return hasRequiredRoles(userRoles, routeConfig.requiredRoles);
}

/**
 * Utility function to get the redirect URL for unauthorized access
 */
export function getUnauthorizedRedirect(
  pathname: string,
  isAuthenticated: boolean
): string {
  if (!isAuthenticated) {
    return `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  }

  const routeConfig = getRouteConfig(pathname);

  if (routeConfig?.redirectTo) {
    return routeConfig.redirectTo;
  }

  return "/unauthorized";
}

/**
 * Export route configurations for use in other parts of the application
 */
export { PROTECTED_ROUTES, PUBLIC_ROUTES, type RouteConfig };

/**
 * Default export for Next.js middleware
 */
export default authMiddleware;
