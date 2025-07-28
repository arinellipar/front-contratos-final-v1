import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize for Vercel deployment
  output: "standalone",
  trailingSlash: true,

  // Experimental features for stability with Next.js 15
  experimental: {
    // Improve server-side rendering
    // serverComponentsExternalPackages: ["axios"],
    // Better error handling
    optimizePackageImports: ["axios", "next-auth"],
  },

  images: {
    unoptimized: false, // Enable optimization for Vercel
    domains: [
      "fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net",
      "frademastorage.blob.core.windows.net",
      "sistemafradema.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fradema-backend-api-crguetd0f7gth9e3.brazilsouth-01.azurewebsites.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "frademastorage.blob.core.windows.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Configuração para upload de arquivos

  // Configuração para servir arquivos estáticos
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/uploads/:path*",
      },
    ];
  },

  // Enhanced headers for better security and CORS handling
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },

  // Optimize webpack for Vercel
  webpack: (config, { isServer, dev }) => {
    // Fix for production builds
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }



    return config;
  },

  // Better server configuration for production
  async redirects() {
    return [];
  },

  // Improve caching
  poweredByHeader: false,

  // Better handling of environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
