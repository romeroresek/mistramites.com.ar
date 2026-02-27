"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { LogOut, LayoutDashboard, LogIn, UserPlus, FileText, Menu, X, MessageCircle } from "lucide-react"

export function LandingNavClient() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/icon-192x192.png"
                alt="Trámites Misiones"
                width={32}
                height={32}
                className="w-8 h-8"
                style={{ maxWidth: 32, maxHeight: 32 }}
                priority
              />
              <span className="font-semibold text-gray-800" suppressHydrationWarning>Trámites Misiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded -m-1"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menú</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <a href="#partidas" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Partidas
          </a>
          <a href="#apostillas" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Apostillas
          </a>
          <a href="#inmuebles" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
            Inmuebles
          </a>
          <hr className="my-1" />
          <Link href="/mis-tramites" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            Mis Tramites
          </Link>
          {!session && (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2">
                <LogIn className="w-4 h-4 shrink-0" />
                Iniciar sesión
              </Link>
              <Link href="/registro" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2">
                <UserPlus className="w-4 h-4 shrink-0" />
                Registrarse
              </Link>
            </>
          )}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Panel de admin
            </Link>
          )}
          {session && (
            <Link
              href="/cerrar-sesion?callbackUrl=/"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Cerrar sesión
            </Link>
          )}
          <a
            href="https://wa.me/543764889861"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}
