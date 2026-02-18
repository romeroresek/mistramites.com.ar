import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partidas, Apostillas e Informes | Trámites Online Misiones",
  description:
    "Solicitá partidas de nacimiento, matrimonio y defunción, apostilla de la Haya, informes de dominio e informes catastrales en Misiones. Trámites ante Registro Civil, Cancillería y Registro de la Propiedad.",
  keywords: [
    "partida de nacimiento Misiones",
    "partida de matrimonio",
    "partida de defunción",
    "apostilla Misiones",
    "apostilla de la Haya",
    "informe de dominio",
    "informe catastral",
    "Registro Civil Misiones",
    "trámites online Misiones",
  ],
  openGraph: {
    title: "Partidas, Apostillas e Informes | Trámites Misiones",
    description:
      "Solicitá partidas, apostillas e informes en Misiones. Trámites ante organismos oficiales.",
    url: "/oficinas",
  },
  alternates: { canonical: "/oficinas" },
}

export default function OficinasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
