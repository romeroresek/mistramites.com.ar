import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partidas, Apostillas e Informes",
  description:
    "Solicitá partidas de nacimiento, matrimonio y defunción, apostilla de la Haya, informes de dominio e informes catastrales en Misiones.",
  openGraph: {
    title: "Partidas, Apostillas e Informes | Trámites Misiones",
    description:
      "Solicitá partidas, apostillas e informes en Misiones.",
    url: "/oficinas",
  },
}

export default function OficinasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
