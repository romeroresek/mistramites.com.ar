"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

interface Usuario {
  id: string
  email: string
  name: string
  role: string
  whatsapp?: string | null
  createdAt: string
  _count: { tramites: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UsuariosResponse {
  data: Usuario[]
  pagination: Pagination
}

const USERS_BASE_KEY = ["admin", "usuarios"] as const
const USERS_PAGE_SIZE = 25

function getUsuariosQueryKey(page: number, search: string) {
  return [...USERS_BASE_KEY, page, search] as const
}

async function fetchUsuariosPage(page: number, search: string): Promise<UsuariosResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(USERS_PAGE_SIZE),
  })

  if (search) params.set("search", search)

  const res = await fetch(`/api/admin/usuarios?${params.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Error al obtener usuarios")
  }

  const data: unknown = await res.json()
  if (
    typeof data !== "object" ||
    data === null ||
    !("data" in data) ||
    !Array.isArray(data.data) ||
    !("pagination" in data) ||
    typeof data.pagination !== "object" ||
    data.pagination === null
  ) {
    throw new Error("Formato invalido")
  }

  return data as UsuariosResponse
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export default function AdminUsuarios() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [page, setPage] = useState(1)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [role, setRole] = useState("usuario")

  const isAdmin = status === "authenticated" && session?.user?.role === "admin"

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (session?.user?.role !== "admin") {
      router.push("/")
    }
  }, [router, session?.user?.role, status])

  const usuariosQuery = useQuery({
    queryKey: getUsuariosQueryKey(page, appliedSearch),
    queryFn: () => fetchUsuariosPage(page, appliedSearch),
    enabled: isAdmin,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  })

  const usuarios = usuariosQuery.data?.data ?? []
  const pagination = usuariosQuery.data?.pagination ?? {
    page,
    limit: USERS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
    setWhatsapp("")
    setRole("usuario")
  }

  const closeModal = () => {
    setShowModal(false)
    setError("")
    setEditUser(null)
    resetForm()
  }

  const openEdit = (usuario: Usuario) => {
    setEditUser(usuario)
    setName(usuario.name)
    setEmail(usuario.email)
    setWhatsapp(usuario.whatsapp || "")
    setRole(usuario.role)
    setPassword("")
    setError("")
    setShowModal(true)
  }

  const openCreate = () => {
    setEditUser(null)
    setError("")
    resetForm()
    setShowModal(true)
  }

  const handleApplySearch = () => {
    setPage(1)
    setAppliedSearch(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput("")
    setPage(1)
    setAppliedSearch("")
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setCreating(true)
    setError("")

    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          whatsapp: whatsapp || undefined,
          role,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al crear usuario")
        return
      }

      closeModal()

      if (page === 1) {
        await usuariosQuery.refetch()
      } else {
        await queryClient.fetchQuery({
          queryKey: getUsuariosQueryKey(1, appliedSearch),
          queryFn: () => fetchUsuariosPage(1, appliedSearch),
          staleTime: 0,
        })
        setPage(1)
      }
    } catch {
      setError("Error al crear usuario")
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editUser) return

    setCreating(true)
    setError("")

    try {
      const body: Record<string, string> = { name, email, role }
      if (password) body.password = password
      body.whatsapp = whatsapp || ""

      const res = await fetch(`/api/admin/usuarios/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al actualizar usuario")
        return
      }

      closeModal()
      await queryClient.invalidateQueries({ queryKey: USERS_BASE_KEY })
    } catch {
      setError("Error al actualizar usuario")
    } finally {
      setCreating(false)
    }
  }

  const isInitialLoading = status === "loading" || (isAdmin && usuariosQuery.isLoading && !usuariosQuery.data)
  const isRefreshing = usuariosQuery.isFetching && !usuariosQuery.isLoading

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 min-h-[44px] shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2 -ml-2"
              aria-label="Volver"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden />
            </Link>
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-1 justify-center">
              <Image
                src="/icon-192x192.png"
                alt="Tramites Misiones"
                width={32}
                height={32}
                className="w-8 h-8 shrink-0"
                style={{ maxWidth: 32, maxHeight: 32 }}
                priority
              />
              <span className="font-semibold text-gray-800 truncate">Tramites Misiones</span>
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded -m-1"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMenuOpen(false)} />
      ) : null}

      <div
        className={`fixed top-0 right-0 h-auto max-h-[90vh] w-56 bg-white shadow-lg border border-gray-200 rounded-bl-lg z-50 transform transition-transform duration-200 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Menu Admin</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded -m-1"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-2 flex flex-col gap-1">
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Panel Admin
          </Link>
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <Home className="w-4 h-4 shrink-0" />
            Inicio
          </Link>
          <Link
            href="/mis-tramites"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Mis Tramites
          </Link>
          <hr className="my-1" />
          <Link
            href="/cerrar-sesion?callbackUrl=/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] flex items-center gap-2"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Salir
          </Link>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Usuarios</h1>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800"
          >
            Nuevo usuario
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleApplySearch()
                  }}
                  placeholder="Nombre, email, rol o WhatsApp"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearSearch}
                className="min-h-[44px] px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={handleApplySearch}
                className="min-h-[44px] px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Buscar
              </button>
              <button
                onClick={() => void usuariosQuery.refetch()}
                disabled={isRefreshing}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                aria-label="Actualizar usuarios"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {usuariosQuery.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getErrorMessage(usuariosQuery.error, "Error al cargar usuarios")}
          </div>
        ) : null}

        <p className="text-sm text-gray-500 mb-4">
          Mostrando {usuarios.length} de {pagination.total} usuarios
        </p>

        {usuarios.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No hay usuarios para los filtros actuales.</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900 text-sm">{usuario.name}</p>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                        usuario.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {usuario.role === "admin" ? "Admin" : "Usuario"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 break-all">{usuario.email}</p>
                  {usuario.whatsapp ? (
                    <p className="mt-1 text-xs text-gray-400">{usuario.whatsapp}</p>
                  ) : null}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>
                        {usuario._count.tramites} tramite{usuario._count.tramites !== 1 ? "s" : ""}
                      </span>
                      <span>Reg. {new Date(usuario.createdAt).toLocaleDateString("es-AR")}</span>
                    </div>
                    <button
                      onClick={() => openEdit(usuario)}
                      className="min-h-[44px] inline-flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">WhatsApp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rol</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tramites</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Registrado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{usuario.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{usuario.whatsapp || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            usuario.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {usuario.role === "admin" ? "Admin" : "Usuario"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{usuario._count.tramites}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(usuario.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => openEdit(usuario)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 ? (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Pagina {page} de {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || usuariosQuery.isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <button
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page >= pagination.totalPages || usuariosQuery.isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} Tramites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>

      <Drawer
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            closeModal()
            return
          }
          setShowModal(true)
        }}
      >
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0 border-b border-gray-200">
            <DrawerTitle>{editUser ? "Editar usuario" : "Crear usuario"}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6">
            <form onSubmit={editUser ? handleEdit : handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(event) => setWhatsapp(event.target.value)}
                  placeholder="+54 9 376 4..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editUser ? "Nueva contrasena (dejar vacio para no cambiar)" : "Contrasena"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editUser}
                  minLength={6}
                  placeholder={editUser ? "******" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={creating}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center px-4 py-3 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
                >
                  {creating
                    ? editUser
                      ? "Guardando..."
                      : "Creando..."
                    : editUser
                      ? "Guardar cambios"
                      : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
