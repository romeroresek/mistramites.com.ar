import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { LazyNotificationPrompt } from "@/components/LazyNotificationPrompt"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tramitesmisiones.com.ar"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TramitesMisiones | Servicios Profesionales de Gestión de Trámites en Misiones",
    template: "%s | TramitesMisiones",
  },
  description: "Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación. No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa.",
  keywords: [
    "trámites Misiones",
    "gestión trámites",
    "partida de nacimiento Misiones",
    "partida de matrimonio",
    "partida de defunción",
    "apostilla de la Haya",
    "apostilla documento público",
    "legalización documentos",
    "Registro Civil Misiones",
    "informe de dominio",
    "informe catastral",
    "Registro de la Propiedad Misiones",
    "trámites online Argentina",
    "gestión documental Misiones",
  ],
  authors: [{ name: "TramitesMisiones" }],
  creator: "TramitesMisiones",
  publisher: "TramitesMisiones",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TramitesMisiones",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "TramitesMisiones",
    title: "TramitesMisiones | Gestión de Trámites en Misiones",
    description: "Servicios profesionales de trámites ante organismos oficiales. Partidas, apostillas, informes de dominio y catastrales en Misiones.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "TramitesMisiones | Gestión de Trámites en Misiones",
    description: "Servicios profesionales de trámites ante organismos oficiales. Partidas, apostillas, informes en Misiones.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "legal",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: "TramitesMisiones",
    description: "Servicios profesionales de gestión de trámites ante organismos oficiales en Misiones: partidas de nacimiento, matrimonio y defunción, apostilla de la Haya, informes de dominio y catastrales.",
    url: siteUrl,
    areaServed: { "@type": "State", name: "Misiones", containedInPlace: { "@type": "Country", name: "Argentina" } },
    serviceType: [
      "Partida de nacimiento",
      "Partida de matrimonio",
      "Partida de defunción",
      "Apostilla de documento público",
      "Informe de dominio",
      "Informe catastral",
    ],
  }

  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
