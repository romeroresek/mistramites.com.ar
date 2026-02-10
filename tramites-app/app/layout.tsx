import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Providers } from "./providers"
import WhatsAppButton from "./components/WhatsAppButton"
import { NotificationPrompt } from "@/components/NotificationPrompt"

export const metadata: Metadata = {
  title: "MisTramites - Sistema de Tramites",
  description: "Plataforma para realizar tramites en linea",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MisTramites",
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
          <WhatsAppButton />
          <NotificationPrompt />
        </Providers>
      </body>
    </html>
  )
}
