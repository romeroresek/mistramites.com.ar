import Link from "next/link"
import Image from "next/image"
import { LandingNavClient } from "@/components/LandingNavClient"

type SearchParams = { returnUrl?: string }

export default async function LandingPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const returnUrl = params?.returnUrl
  const returnSuffix = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <LandingNavClient />

      <main className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {returnUrl && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-blue-800">Creando trámite como administrador. Al finalizar volverás al panel.</p>
            <Link href={returnUrl} className="text-sm font-medium text-blue-700 hover:text-blue-900 underline">
              Volver al panel
            </Link>
          </div>
        )}

        <div className="mb-6 sm:mb-10">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Servicios de Trámites en Misiones</h1>
          <p className="text-gray-600 text-sm sm:text-base">Realizamos sus trámites ante organismos oficiales. Accede a tus documentos, registros e información pública en línea.</p>
        </div>

        <section id="partidas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center gap-3">
              <Image
                src="/images-1.png"
                alt="Actas y Partidas"
                width={48}
                height={48}
                sizes="48px"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded flex-shrink-0"
              />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Solicitar Actas y Partidas</h2>
                <p className="text-sm text-gray-600">Trámites ante el Registro Civil de Misiones</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm sm:text-sm text-gray-600 mb-4">
                Nuestros profesionales tramitan la obtencion de actas de nacimiento, matrimonio y defuncion ante el Registro Civil. El servicio incluye honorarios de gestion. Realizamos la busqueda, obtencion y legalizacion de actas de Nacimiento, Matrimonio y Defuncion.
              </p>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <Link href={`/oficinas/registro-personas${returnSuffix}`} className="block min-h-[44px]">
                  <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md active:bg-gray-50 transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Actas del Registro Civil</h3>
                    <ul className="text-sm text-green-600 space-y-0.5">
                      <li>✓ Búsqueda del acta de Nacimiento, Matrimonio, Defunción.</li>
                      <li>✓ Legalización digital.</li>
                      <li>✓ Con QR para verificación de trámite.</li>
                      <li>✓ Formato pdf con legalización digital.</li>
                      <li>✓ Validez Nacional.</li>
                      <li>✓ Demora 24hs hábiles.</li>
                      <li>✓ Opcional con Apostilla de la Haya.</li>
                    </ul>
                  </div>
                </Link>
              </div>
              <Link href={`/oficinas/registro-personas${returnSuffix}`} className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 py-3 bg-blue-600 text-white text-sm sm:text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800">
                Solicitar Partida
              </Link>
            </div>
          </div>
        </section>

        <section id="apostillas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center gap-3">
              <Image
                src="/escudo1.png"
                alt="Apostilla de la Haya"
                width={48}
                height={48}
                sizes="48px"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded flex-shrink-0"
              />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Solicitud de Apostilla</h2>
                <p className="text-sm text-gray-600">Servicio de gestion de legalizacion para uso en el exterior</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-600 mb-4">
                Este trámite permite solicitar a distancia la Apostilla o Legalización de documentos públicos que sean de naturaleza electrónica como así también con firma ológrafa para ser presentados en el exterior, sin la necesidad de gestionar turnos. Este trámite se encuentra alcanzado por las consideraciones establecidas en el inciso b) del Art. 10 de la Ley N° 19.549, respecto del silencio con sentido positivo. El plazo estipulado es de 20 días hábiles administrativos. Nuestros profesionales tramitan la Apostilla de la Haya para documentos que requieran validez internacional. Servicio profesional de intermediacion. Gestion de apostillas para documentos públicos ante Cancillería.
              </p>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <Link href={`/oficinas/apostillas${returnSuffix}`} className="block min-h-[44px]">
                  <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md active:bg-gray-50 transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Apostilla de la Haya con validez Internacional</h3>
                    <ul className="text-sm text-green-600 space-y-0.5">
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
              <Link href={`/oficinas/apostillas${returnSuffix}`} className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800">
                Tramitar Apostilla
              </Link>
            </div>
          </div>
        </section>

        <section id="inmuebles" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-5 sm:p-6 border-b border-gray-200 flex items-center gap-3">
              <Image
                src="/inmueble.png"
                alt="Informes de Inmuebles"
                width={48}
                height={48}
                sizes="48px"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded flex-shrink-0"
              />
              <div>
                <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Informes de Inmuebles</h2>
                <p className="text-sm text-gray-600">Servicio de trámites ante Catastro y Registro de la Propiedad</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-gray-600 mb-4">
                Tramitamos la obtencion de informes catastrales e informes del Registro de la Propiedad Inmueble de Misiones. Servicio profesional incluye tasas por trámite urgente y honorarios incluidos. Gestion de informes de dominio e inhibicion ante el Registro de la Propiedad. Gestion de informes ante la Direccion de Catastro provincial.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Link href={`/oficinas/registro-propiedad${returnSuffix}`} className="block min-h-[44px] mb-3">
                    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md active:bg-gray-50 transition-shadow">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes de Dominio</h3>
                      <ul className="text-sm text-green-600 space-y-0.5">
                        <li>✓ F3 - Informe de Búsqueda de Titularidad</li>
                        <li>✓ F4 - Informe de Condiciones de Dominio</li>
                        <li>✓ F5 - Informe de inhibiciones</li>
                        <li>✓ Con firma digital</li>
                        <li>✓ Envío en formato .pdf</li>
                        <li>✓ Demora 15 días hábiles</li>
                      </ul>
                    </div>
                  </Link>
                  <Link href={`/oficinas/registro-propiedad${returnSuffix}`} className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800">
                    Informes RPI
                  </Link>
                </div>
                <div>
                  <Link href={`/oficinas/catastro${returnSuffix}`} className="block min-h-[44px] mb-3">
                    <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md active:bg-gray-50 transition-shadow">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes Catastrales</h3>
                      <ul className="text-sm text-green-600 space-y-0.5">
                        <li>✓ Apto para valuaciones</li>
                        <li>✓ Formato .pdf</li>
                        <li>✓ Validez Nacional</li>
                        <li>✓ Demora 7 días</li>
                      </ul>
                    </div>
                  </Link>
                  <Link href={`/oficinas/catastro${returnSuffix}`} className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800">
                    Solicitar Catastral
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white border border-gray-200 rounded-lg mb-6">
          <div className="p-5 sm:p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Sobre nuestro servicio</h2>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm text-gray-600 mb-3">
              <strong>Importante:</strong> Somos un estudio jurídico contable todos matriculados con sede en Misiones. Ofrecemos servicios de intermediacion para la gestion de documentos ante organismos publicos de la Provincia y Nación. No somos un organismo del Estado. Los honorarios que cobramos corresponden al servicio profesional de gestion administrativa, que incluye la tramitacion, pago de tasas correspondiente, seguimiento, eventuales reclamos por demoras y entrega de documentacion. Todos los tramites se realizan ante los organismos oficiales correspondientes (Registro Civil, Registro de la Propiedad, Catastro, Cancilleria, expedientes judiciales, etc.). TramitesMisiones te facilita el acceso a documentos, registros e información pública a través de contenidos y servicios gratuitos y pagos, con alto grado de elaboración, asistencia personalizada, digitalización y envío.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-5 sm:p-6 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Contactenos</h2>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm text-gray-600 mb-4">
              Acceda a su cuenta o contactenos por WhatsApp para consultar sobre nuestros servicios de trámites administrativos y judiciales.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href="/mis-tramites" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800">
                Mis Tramites
              </Link>
              <a href="https://wa.me/543764889861" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 active:bg-gray-100">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs">
            © 2024 TramitesMisiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
