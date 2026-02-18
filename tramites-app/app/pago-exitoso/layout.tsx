import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pago Exitoso",
  description:
    "Tu solicitud de trámite fue recibida. Te contactaremos por WhatsApp con el estado. Trámites Misiones - Gestión de trámites en Misiones.",
  robots: { index: false, follow: true },
}

export default function PagoExitosoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
