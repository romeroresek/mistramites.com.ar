import Link from "next/link"
import Image from "next/image"
import { LandingNavClient } from "@/components/LandingNavClient"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <LandingNavClient />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-10">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Servicios de Trámites en Misiones</h1>
          <p className="text-gray-600 text-sm">Realizamos sus trámites ante organismos oficiales. Accede a tus documentos, registros e información pública en línea.</p>
        </div>

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
                        sizes="80px"
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
                        sizes="80px"
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
                        sizes="80px"
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
