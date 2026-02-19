"use client"

import Link from "next/link"
import { useState } from "react"

type ViewMode = "actual" | "anterior" | "lado-a-lado"

export default function PreviewInicioPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("actual")

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg font-semibold text-gray-900">Vista previa: versiones de página de inicio</h1>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Ir al inicio
              </Link>
              <button
                type="button"
                onClick={() => setViewMode("actual")}
                className={`px-3 py-2 text-sm rounded-lg ${viewMode === "actual" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
              >
                Solo actual
              </button>
              <button
                type="button"
                onClick={() => setViewMode("anterior")}
                className={`px-3 py-2 text-sm rounded-lg ${viewMode === "anterior" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
              >
                Solo anterior (14 feb)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("lado-a-lado")}
                className={`px-3 py-2 text-sm rounded-lg ${viewMode === "lado-a-lado" ? "bg-blue-600 text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
              >
                Lado a lado
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        {viewMode === "lado-a-lado" ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 min-h-0">
            <div className="flex flex-col min-h-0">
              <p className="text-xs font-medium text-gray-600 mb-1 px-1">Actual</p>
              <iframe
                src="/"
                title="Versión actual"
                className="w-full flex-1 min-h-[400px] border border-gray-300 rounded bg-white"
              />
            </div>
            <div className="flex flex-col min-h-0">
              <p className="text-xs font-medium text-gray-600 mb-1 px-1">Anterior (14 feb)</p>
              <iframe
                src="/preview-inicio/old"
                title="Versión anterior"
                className="w-full flex-1 min-h-[400px] border border-gray-300 rounded bg-white"
              />
            </div>
          </div>
        ) : viewMode === "actual" ? (
          <iframe
            src="/"
            title="Versión actual"
            className="w-full flex-1 min-h-[calc(100vh-120px)] border-0 bg-white"
          />
        ) : (
          <iframe
            src="/preview-inicio/old"
            title="Versión anterior (14 feb)"
            className="w-full flex-1 min-h-[calc(100vh-120px)] border-0 bg-white"
          />
        )}
      </main>
    </div>
  )
}
