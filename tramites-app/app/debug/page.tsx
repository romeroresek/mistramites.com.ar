"use client"

import { useState } from "react"

export default function DebugPage() {
  const [email, setEmail] = useState("prueba@prueba")
  const [password, setPassword] = useState("prueba")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkUser = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/debug/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: String(error) })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded border p-6">
        <h1 className="text-xl font-bold mb-4">Debug - Verificar Usuario</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            onClick={checkUser}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Verificar Usuario"}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded border">
            <h2 className="font-bold mb-2">Resultado:</h2>
            <pre className="text-xs overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
