import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import WhatsAppButton from "./components/WhatsAppButton"

export const metadata: Metadata = {
  title: "Sistema de Trámites",
  description: "Plataforma para realizar trámites en línea",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <Providers>
          {children}
          <WhatsAppButton />
        </Providers>
      </body>
    </html>
  )
}
