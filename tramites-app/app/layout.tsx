import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { LazyNotificationPrompt } from "@/components/LazyNotificationPrompt"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tramitesmisiones.com.ar"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Trámites Misiones",
    template: "%s | Trámites Misiones",
  },
  description: "Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación. No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa.",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trámites Misiones",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Trámites Misiones",
    title: "Trámites Misiones",
    description: "Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trámites Misiones",
    description: "Somos un estudio jurídico contable todos matriculados con sede en Misiones.",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* CSS crítico inline - fallback cuando JS/CSS no cargan */}
        <style dangerouslySetInnerHTML={{ __html: `
          img { max-width: 100%; height: auto; }
          nav img { max-width: 48px; max-height: 48px; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; }
        ` }} />
      </head>
      <body className="bg-gray-50">
        <Providers>
          {children}
          <LazyNotificationPrompt />
        </Providers>
      </body>
    </html>
  )
}
