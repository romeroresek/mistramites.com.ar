import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const servicios = [
  {
    title: "Registro de las Personas",
    description: "Consultá información y estados de trámites",
    href: "/oficinas/registro-personas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    bgColor: "bg-pink-400",
    hoverColor: "hover:bg-pink-500",
  },
  {
    title: "Trámites online",
    description: "Iniciá y gestioná tus trámites de forma digital",
    href: "/oficinas/registro-propiedad",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
      </svg>
    ),
    bgColor: "bg-amber-400",
    hoverColor: "hover:bg-amber-500",
  },
  {
    title: "Firma digital",
    description: "Firmá documentos con validez legal",
    href: "/oficinas/apostillas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    bgColor: "bg-sky-400",
    hoverColor: "hover:bg-sky-500",
  },
  {
    title: "Estimador de costos",
    description: "Calculá el valor de tus trámites",
    href: "/oficinas/catastro",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    bgColor: "bg-emerald-400",
    hoverColor: "hover:bg-emerald-500",
  },
  {
    title: "Mis trámites",
    description: "Seguí el estado de tus gestiones",
    href: "/mis-tramites",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M9 14l2 2 4-4" />
      </svg>
    ),
    bgColor: "bg-orange-400",
    hoverColor: "hover:bg-orange-500",
  },
  {
    title: "Ayuda",
    description: "Preguntas frecuentes y soporte",
    href: "/ayuda",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    bgColor: "bg-violet-400",
    hoverColor: "hover:bg-violet-500",
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const initials = session.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-white"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-xl text-slate-800">MisTrámites</span>
                <span className="hidden sm:inline text-sm text-slate-500 ml-2">Servicios Online</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                    <AvatarFallback className="bg-blue-600 text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mis-tramites">Mis Trámites</Link>
                </DropdownMenuItem>
                {session.user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Panel Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout" className="text-red-600">
                    Cerrar sesión
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Hola, {session.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-blue-100 text-lg">
            Realizá tus trámites de forma simple, rápida y segura
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Servicios disponibles</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicios.map((servicio) => (
            <Link key={servicio.href} href={servicio.href}>
              <div
                className={`${servicio.bgColor} ${servicio.hoverColor} rounded-2xl p-6 h-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl cursor-pointer`}
              >
                <div className="flex flex-col h-full">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                    <div className="text-white">{servicio.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{servicio.title}</h3>
                  <p className="text-white/90 text-sm">{servicio.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-blue-100 rounded-full p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Atención al ciudadano</h3>
              <p className="text-slate-600">
                Para consultas, comunicate con nuestro centro de atención de lunes a viernes de 8 a 18hs.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
              Contactar
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 text-white"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold">MisTrámites</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
