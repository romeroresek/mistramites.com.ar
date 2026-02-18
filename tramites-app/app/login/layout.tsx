import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acceso Clientes",
  description:
    "Iniciá sesión en TramitesMisiones para acceder a tus trámites, partidas, apostillas e informes. Acceso seguro con Google.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "Acceso Clientes | TramitesMisiones",
    description: "Iniciá sesión para gestionar tus trámites.",
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
