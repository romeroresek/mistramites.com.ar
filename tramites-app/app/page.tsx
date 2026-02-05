import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "./api/auth/[...nextauth]/route"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Trámites Online</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{session.user?.name}</span>
            <Link href="/api/auth/signout" className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Salir
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Selecciona una oficina</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Registro Propiedad Inmueble */}
          <Link href="/oficinas/registro-propiedad">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold text-blue-600 mb-2">📋 Registro Propiedad Inmueble</h3>
              <p className="text-gray-600">Inscripción, transferencia y documentación de propiedades</p>
            </div>
          </Link>

          {/* Registro de Personas */}
          <Link href="/oficinas/registro-personas">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold text-green-600 mb-2">👤 Registro de las Personas</h3>
              <p className="text-gray-600">Cambios de domicilio, datos personales y certificados</p>
            </div>
          </Link>

          {/* Apostillas */}
          <Link href="/oficinas/apostillas">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold text-purple-600 mb-2">✔️ Apostillas</h3>
              <p className="text-gray-600">Apostilla de documentos para uso internacional</p>
            </div>
          </Link>

          {/* Catastro */}
          <Link href="/oficinas/catastro">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold text-orange-600 mb-2">🗺️ Catastro</h3>
              <p className="text-gray-600">Consultas catastrales y planos de propiedades</p>
            </div>
          </Link>
        </div>

        <div className="mt-12">
          <Link href="/mis-tramites">
            <div className="bg-indigo-600 text-white p-8 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold mb-2">📊 Mis Trámites</h3>
              <p>Ver el estado de tus trámites y descargar documentos</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
