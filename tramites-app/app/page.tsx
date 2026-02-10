import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MisTramites | Gestoria Digital - Servicios Profesionales",
  description: "Estudio de gestores profesionales. Gestionamos partidas, informes y apostillas ante organismos oficiales. Servicio privado de intermediacion.",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-192x192.png" alt="MisTramites" className="w-8 h-8" />
              <span className="font-semibold text-gray-800 hidden sm:inline">MisTramites</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="#partidas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Partidas</a>
              <a href="#inmuebles" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Inmuebles</a>
              <a href="#apostillas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Apostillas</a>
              <Link href="/login" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Acceso Clientes
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Aviso legal */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6">
          <p className="text-xs text-blue-800">
            <strong>Aviso:</strong> Este es un servicio privado de gestoría. No somos un organismo oficial del Estado.
            Nuestros profesionales matriculados realizan los trámites en su nombre ante los organismos correspondientes, cobrando honorarios por el servicio de intermediación.
          </p>
        </div>

        {/* Hero */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Servicios Profesionales</h1>
          <p className="text-gray-600 text-sm">Realizamos sus trámites ante organismos oficiales</p>
        </div>

        {/* SECCION PARTIDAS */}
        <section id="partidas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Solicitar Actas y Partidas</h2>
              <p className="text-xs sm:text-sm text-gray-600">Trámites ante el Registro Civil de Misiones</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Nuestros profesionales tramitan la obtencion de actas de nacimiento, matrimonio y defuncion ante el Registro Civil. El servicio incluye honorarios de gestion.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Link href="/oficinas/registro-personas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Actas del Registro Civil</h3>
                    <p className="text-xs text-gray-600">Realizamos la busqueda, obtencion y legalizacion de actas de Nacimiento, Matrimonio y Defuncion.</p>
                  </div>
                </Link>
                <Link href="/oficinas/apostillas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Apostillado de la Haya</h3>
                    <p className="text-xs text-gray-600">Trámites de apostilla para documentos con validez internacional.</p>
                  </div>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/oficinas/registro-personas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                  Solicitar Partida
                </Link>
                <Link href="/oficinas/apostillas" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                  Apostilla Partida
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECCION INMUEBLES */}
        <section id="inmuebles" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Gestion de Informes de Inmuebles</h2>
              <p className="text-xs sm:text-sm text-gray-600">Servicio de trámites ante Catastro y Registro de la Propiedad</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Tramitamos la obtencion de informes catastrales e informes del Registro de la Propiedad Inmueble de Misiones. Servicio profesional con honorarios incluidos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Link href="/oficinas/registro-propiedad">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes de Dominio</h3>
                    <p className="text-xs text-gray-600">Gestion de informes de dominio e inhibicion ante el Registro de la Propiedad.</p>
                  </div>
                </Link>
                <Link href="/oficinas/catastro">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes Catastrales</h3>
                    <p className="text-xs text-gray-600">Gestion de informes ante la Direccion de Catastro provincial.</p>
                  </div>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/oficinas/registro-propiedad" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                  Informes RPI
                </Link>
                <Link href="/oficinas/catastro" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                  Solicitar Catastral
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECCION APOSTILLAS */}
        <section id="apostillas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Gestion de Apostillas</h2>
              <p className="text-xs sm:text-sm text-gray-600">Servicio de gestion de legalizacion para uso en el exterior</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Nuestros gestores tramitan la Apostilla de la Haya para documentos que requieran validez internacional. Servicio profesional de intermediacion.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="border border-gray-200 rounded p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Documentos que gestionamos</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Actas de Nacimiento, Matrimonio, Defuncion</li>
                    <li>• Antecedentes Penales</li>
                    <li>• Titulos y certificados</li>
                    <li>• Otros documentos publicos</li>
                  </ul>
                </div>
              </div>
              <Link href="/oficinas/apostillas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Tramitar Apostilla
              </Link>
            </div>
          </div>
        </section>

        {/* Sobre nosotros */}
        <div className="bg-white border border-gray-200 rounded mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Sobre nuestro servicio</h2>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación.
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              <strong>Importante:</strong> No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa, que incluye la tramitacion, pago de tasas correspondiente, seguimiento, eventuales reclamos por demoras y entrega de documentacion.
            </p>
            <p className="text-xs sm:text-sm text-gray-600">
              Todos los tramites se realizan ante los organismos oficiales correspondientes (Registro Civil, Registro de la Propiedad, Catastro, Cancilleria, expedientes judiciales, etc.).
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Contactenos</h2>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Acceda a su cuenta o contactenos por WhatsApp para consultar sobre nuestros servicios de trámites administrativos y judiciales.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href="/login" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Acceso Clientes
              </Link>
              <a href="https://wa.me/543764889861" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs mb-2">
            MisTramites - Estudio de Gestores Profesionales - Posadas, Misiones
          </p>
          <p className="text-center text-gray-400 text-xs">
            Servicio privado de gestoria. No somos un organismo oficial del Estado.
          </p>
        </div>
      </footer>
    </div>
  )
}
