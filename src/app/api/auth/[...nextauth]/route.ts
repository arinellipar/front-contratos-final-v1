// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      nomeCompleto: any;
      id: string;
      email: string;
      name: string;
      image?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }

  interface User {
    id: string;
    email: string;
    nomeCompleto: string;
    accessToken?: string;
    refreshToken?: string;
  }

  interface JWT {
    id?: string;
    email?: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }
}

// URL do backend Azure
const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net/api/v1";

// Verificar variáveis de ambiente
if (process.env.NODE_ENV === "development") {
  console.log("NextAuth Config - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
  console.log(
    "NextAuth Config - NEXTAUTH_SECRET:",
    process.env.NEXTAUTH_SECRET ? "Set" : "Not set"
  );
  console.log("NextAuth Config - Backend URL:", BACKEND_API_URL);
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log("Attempting login for:", credentials.email);
          console.log("Backend URL:", `${BACKEND_API_URL}/auth/login`);

          // Fazer requisição direta ao backend Azure
          const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          console.log("Login response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Login failed:", response.status, errorText);
            return null;
          }

          const data = await response.json();
          console.log("Login response received:", !!data);

          if (data && data.token) {
            // Retornar usuário com os dados do backend
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.nomeCompleto,
              nomeCompleto: data.user.nomeCompleto,
              image: null,
              accessToken: data.token,
              refreshToken: data.refreshToken,
            };
          }

          console.log("No valid response from login");
          return null;
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name || user.nomeCompleto;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessToken && Date.now() < (token.exp as number) * 1000) {
        return token;
      }

      // Access token has expired, try to update it
      if (token.refreshToken) {
        try {
          console.log("Attempting to refresh token...");

          const response = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              accessToken: token.accessToken,
              refreshToken: token.refreshToken,
            }),
          });

          if (response.ok) {
            const refreshedTokens = await response.json();
            console.log("Token refresh successful");

            return {
              ...token,
              accessToken: refreshedTokens.token,
              refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
            };
          } else {
            console.error("Token refresh failed:", response.status);
            // Return the previous token and mark it as expired
            return { ...token, error: "RefreshAccessTokenError" };
          }
        } catch (error) {
          console.error("Error refreshing access token", error);
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      // If refresh fails, return the old token and let the client handle it
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          nomeCompleto: token.name as string,
          image: null,
        };
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;

        // Se houver erro no token, adicionar à sessão
        if (token.error) {
          session.error = token.error as string;
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Permite redirecionamentos para o mesmo domínio
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permite redirecionamentos para o mesmo domínio
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, "").split(
                "/"
              )[0]
            : undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === "development",

  // Configurações adicionais para produção
  ...(process.env.NODE_ENV === "production" && {
    cookies: {
      sessionToken: {
        name: "__Secure-next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      callbackUrl: {
        name: "__Secure-next-auth.callback-url",
        options: {
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
      csrfToken: {
        name: "__Host-next-auth.csrf-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
        },
      },
    },
  }),
};

const handler = NextAuth(authOptions);

// Export the auth options for use in other parts of the app
export { authOptions };

// Handle GET and POST requests
export { handler as GET, handler as POST };
