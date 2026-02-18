import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mis Trámites",
  description:
    "Consultá el estado de tus trámites: partidas, apostillas e informes. Seguimiento de solicitudes y descarga de documentación.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "Mis Trámites | Trámites Misiones",
    description: "Consultá el estado de tus trámites y documentación.",
  },
}

export default function MisTramitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
