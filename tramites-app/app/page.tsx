"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon-192x192.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800">TramitesMisiones</span>
            </Link>
            {/* Hamburger button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Cerrar menú"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <a
            href="#partidas"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Partidas
          </a>
          <a
            href="#apostillas"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Apostillas
          </a>
          <a
            href="#inmuebles"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            Inmuebles
          </a>
          <hr className="my-1" />
          <Link
            href="/mis-tramites"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 bg-blue-600 text-white text-sm text-center rounded hover:bg-blue-700"
          >
            Mis Tramites
          </Link>
          <a
            href="https://wa.me/543764889861"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Servicios de Trámites en Misiones</h1>
          <p className="text-gray-600 text-sm">Realizamos sus trámites ante organismos oficiales. Accede a tus documentos, registros e información pública en línea.</p>
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
              <div className="grid grid-cols-1 gap-3 mb-4">
                <Link href="/oficinas/registro-personas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <Image
                        src="/images-1.png"
                        alt="Actas del Registro Civil"
                        width={80}
                        height={80}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded flex-shrink-0 bg-gray-50"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">Actas del Registro Civil</h3>
                        <p className="text-xs text-gray-600 mb-2">Realizamos la busqueda, obtencion y legalizacion de actas de Nacimiento, Matrimonio y Defuncion.</p>
                      </div>
                    </div>
                    <ul className="text-xs text-green-600 space-y-0.5 mt-2">
                      <li>✓ Búsqueda del acta de Nacimiento, Matrimonio, Defunción.</li>
                      <li>✓ Legalización digital.</li>
                      <li>✓ Con QR para verificación de trámite.</li>
                      <li>✓ Formato pdf con legalización digital.</li>
                      <li>✓ Validez Nacional.</li>
                      <li>✓ Demora 24hs hábiles.</li>
                    </ul>
                  </div>
                </Link>
              </div>
              <Link href="/oficinas/registro-personas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Solicitar Partida
              </Link>
            </div>
          </div>
        </section>

        {/* SECCION APOSTILLAS */}
        <section id="apostillas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Solicitud de Apostilla</h2>
              <p className="text-xs sm:text-sm text-gray-600">Servicio de gestion de legalizacion para uso en el exterior</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Este trámite permite solicitar a distancia la Apostilla o Legalización de documentos públicos que sean de naturaleza electrónica como así también con firma ológrafa para ser presentados en el exterior, sin la necesidad de gestionar turnos. Este trámite se encuentra alcanzado por las consideraciones establecidas en el inciso b) del Art. 10 de la Ley N° 19.549, respecto del silencio con sentido positivo. El plazo estipulado es de 20 días hábiles administrativos. Nuestros profesionales tramitan la Apostilla de la Haya para documentos que requieran validez internacional. Servicio profesional de intermediacion.
              </p>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <Link href="/oficinas/apostillas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <Image
                        src="/escudo1.png"
                        alt="Apostilla de la Haya"
                        width={80}
                        height={80}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded flex-shrink-0 bg-gray-50"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">Apostilla de la Haya con validez Internacional</h3>
                        <p className="text-xs text-gray-600 mb-2">Gestion de apostillas para documentos públicos ante Cancillería.</p>
                      </div>
                    </div>
                    <ul className="text-xs text-green-600 space-y-0.5 mt-2">
                      <li>✓ Apostilla de la Haya acta de Nacimiento, Matrimonio, Defunción.</li>
                      <li>✓ Antecedentes Penales, Títulos y Otros Documentos.</li>
                      <li>✓ Apostilla con validez Internacional.</li>
                      <li>✓ Envío en pdf con firma digital.</li>
                      <li>✓ Código de verificación de trámite.</li>
                      <li>✓ Demora 20 días hábiles administrativos.</li>
                    </ul>
                  </div>
                </Link>
              </div>
              <Link href="/oficinas/apostillas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Tramitar Apostilla
              </Link>
            </div>
          </div>
        </section>

        {/* SECCION INMUEBLES */}
        <section id="inmuebles" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Informes de Inmuebles</h2>
              <p className="text-xs sm:text-sm text-gray-600">Servicio de trámites ante Catastro y Registro de la Propiedad</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Tramitamos la obtencion de informes catastrales e informes del Registro de la Propiedad Inmueble de Misiones. Servicio profesional incluye tasas por trámite urgente y honorarios incluidos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Link href="/oficinas/registro-propiedad">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      <Image
                        src="/inmueble.png"
                        alt="Informes de Dominio"
                        width={80}
                        height={80}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded flex-shrink-0 bg-gray-50"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes de Dominio</h3>
                        <p className="text-xs text-gray-600 mb-2">Gestion de informes de dominio e inhibicion ante el Registro de la Propiedad.</p>
                      </div>
                    </div>
                    <ul className="text-xs text-green-600 space-y-0.5 mt-2">
                      <li>✓ F3 - Informe de Búsqueda de Titularidad</li>
                      <li>✓ F4 - Informe de Condiciones de Dominio</li>
                      <li>✓ F5 - Informe de inhibiciones</li>
                      <li>✓ Con firma digital</li>
                      <li>✓ Envío en formato .pdf</li>
                      <li>✓ Demora 15 días hábiles</li>
                    </ul>
                  </div>
                </Link>
                <Link href="/oficinas/catastro">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes Catastrales</h3>
                    <p className="text-xs text-gray-600 mb-2">Gestion de informes ante la Direccion de Catastro provincial.</p>
                    <ul className="text-xs text-green-600 space-y-0.5">
                      <li>✓ Apto para valuaciones</li>
                      <li>✓ Formato .pdf</li>
                      <li>✓ Validez Nacional</li>
                      <li>✓ Demora 7 días</li>
                    </ul>
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

        {/* Sobre nosotros */}
        <div className="bg-white border border-gray-200 rounded mb-6">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Sobre nuestro servicio</h2>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              <strong>Importante:</strong> Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación. No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa, que incluye la tramitacion, pago de tasas correspondiente, seguimiento, eventuales reclamos por demoras y entrega de documentacion. Todos los tramites se realizan ante los organismos oficiales correspondientes (Registro Civil, Registro de la Propiedad, Catastro, Cancilleria, expedientes judiciales, etc.). TramitesMisiones te facilita el acceso a documentos, registros e información pública a través de contenidos y servicios gratuitos y pagos, con alto grado de elaboración, asistencia personalizada, digitalización y envío.
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
              <Link href="/mis-tramites" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Mis Tramites
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
          <p className="text-center text-gray-500 text-xs">
            © 2024 TramitesMisiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
