import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { LazyNotificationPrompt } from "@/components/LazyNotificationPrompt"

export const metadata: Metadata = {
  title: "TramitesMisiones | Servicios Profesionales de Gestión de Trámites en Misiones",
  description: "Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación. No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TramitesMisiones",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
