// frontend/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ClientErrorBoundary } from "@/components/providers/ClientErrorBoundary";
import { SessionWrapper } from "@/components/providers/SessionWrapper";
import "./globals.css";

// Font configurations mantidas...
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
  fallback: [
    "Inter",
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  preload: true,
  fallback: [
    "JetBrains Mono",
    "SF Mono",
    "Monaco",
    "Inconsolata",
    "Roboto Mono",
    "monospace",
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Sistema Fradema - Gestão de Contratos",
    template: "%s | Sistema Fradema",
  },
  description:
    "Sistema completo para gestão de contratos e documentos da Fradema",
  keywords: ["contratos", "gestão", "documentos", "fradema"],
  authors: [{ name: "Fradema" }],
  creator: "Fradema",
  publisher: "Fradema",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: process.env.NODE_ENV === "production",
    follow: process.env.NODE_ENV === "production",
    googleBot: {
      index: process.env.NODE_ENV === "production",
      follow: process.env.NODE_ENV === "production",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "Sistema Fradema - Gestão de Contratos",
    description: "Sistema completo para gestão de contratos e documentos",
    siteName: "Sistema Fradema",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sistema Fradema - Gestão de Contratos",
    description: "Sistema completo para gestão de contratos e documentos",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <CriticalResourceHints />
        <StructuredData />
      </head>
      <body
        className="font-sans antialiased bg-background text-foreground"
        suppressHydrationWarning
      >
        {/* ✅ SOLUÇÃO: Client Component wrapper para error handling */}
        <ClientErrorBoundary>
          <SessionWrapper>
            <ThemeProvider
              defaultTheme="light"
              enableSystem={true}
              attribute="class"
              value={{
                light: "light",
                dark: "dark",
              }}
              disableTransitionOnChange={false}
            >
              {/* Skip to main content for accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md"
              >
                Pular para o conteúdo principal
              </a>

              {/* Main application content */}
              <div id="main-content" className="min-h-screen">
                {children}
              </div>

              {/* Development indicators */}
              {process.env.NODE_ENV === "development" && (
                <div className="fixed bottom-4 right-4 z-50 opacity-50 pointer-events-none">
                  <div className="bg-yellow-400 text-black px-2 py-1 text-xs rounded font-mono">
                    DEV
                  </div>
                </div>
              )}
            </ThemeProvider>
          </SessionWrapper>
        </ClientErrorBoundary>

        {/* Critical CSS for theme transition prevention */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('fradema_theme_mode');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}

// Helper components mantidos mas movidos para fora do JSX principal
function CriticalResourceHints() {
  return (
    <>
      {/* DNS Prefetch for External Resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />

      {/* Preconnect for critical resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Resource hints for better performance */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </>
  );
}

function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sistema Fradema",
    description: "Sistema completo para gestão de contratos e documentos",
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
    author: {
      "@type": "Organization",
      name: "Fradema",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
