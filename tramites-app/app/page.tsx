import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "./api/auth/[...nextauth]/route"

const servicios = [
  {
    title: "Registro de las Personas",
    description: "Partidas de nacimiento, defunción y matrimonio",
    href: "/oficinas/registro-personas",
  },
  {
    title: "Registro de la Propiedad",
    description: "Certificados de dominio e inhibición",
    href: "/oficinas/registro-propiedad",
  },
  {
    title: "Apostillas",
    description: "Legalización de documentos",
    href: "/oficinas/apostillas",
  },
  {
    title: "Catastro",
    description: "Informes catastrales y valuaciones",
    href: "/oficinas/catastro",
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 hidden sm:inline">MisTrámites</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/mis-tramites" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                Mis Trámites
              </Link>
              {session.user?.role === "admin" && (
                <Link href="/admin" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">
                  Admin
                </Link>
              )}
              <div className="relative group">
                <button className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <img
                    src={session.user?.image || ""}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:inline">{session.user?.name}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                    <p className="text-xs text-gray-500">{session.user?.email}</p>
                  </div>
                  <Link href="/api/auth/signout" className="block px-3 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Cerrar sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Welcome */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
            Bienvenido, {session.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-600 text-sm">Seleccioná un servicio para comenzar tu trámite</p>
        </div>

        {/* Services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-8">
          {servicios.map((servicio) => (
            <Link key={servicio.href} href={servicio.href}>
              <div className="bg-white border border-gray-200 rounded p-3 sm:p-4 hover:shadow-md transition-shadow h-full">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{servicio.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{servicio.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Accesos rápidos</h2>
          </div>
          <div className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href="/mis-tramites"
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700"
              >
                Ver mis trámites
              </Link>
              <Link
                href="/oficinas/registro-personas"
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50"
              >
                Nuevo trámite
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 MisTrámites - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
