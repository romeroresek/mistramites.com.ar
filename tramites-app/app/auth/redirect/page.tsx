"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AuthRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      const role = (session?.user as any)?.role
      if (role === "admin") {
        router.push("/admin")
      } else {
        router.push("/mis-tramites")
      }
    }
  }, [status, session, router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p className="text-gray-600">Redirigiendo...</p>
    </div>
  )
}
