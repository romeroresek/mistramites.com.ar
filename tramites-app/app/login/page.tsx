import { signIn } from "next-auth/react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-12 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Trámites Online</h1>
        <p className="text-center text-gray-600 mb-8">Plataforma de gestión de trámites</p>

        <div className="flex flex-col gap-4">
          <p className="text-gray-700 mb-4">Inicia sesión con tu cuenta de Google</p>

          <a
            href="/api/auth/signin/google"
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center"
          >
            Iniciar sesión con Google
          </a>
        </div>

        <hr className="my-8" />

        <p className="text-center text-sm text-gray-500">
          Accede de forma segura usando tu cuenta de Google
        </p>
      </div>
    </div>
  )
}
