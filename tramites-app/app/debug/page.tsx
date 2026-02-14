"use client"

import { useState } from "react"

export default function DebugPage() {
  const [email, setEmail] = useState("prueba@prueba")
  const [password, setPassword] = useState("prueba")
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  const [latencyResult, setLatencyResult] = useState<{
    ping?: { clientMs: number; data: { ok: boolean; t: number } }
    speedTest?: { clientMs: number; data: { results?: Record<string, number>; analysis?: Record<string, string | null> } }
  } | null>(null)
  const [latencyLoading, setLatencyLoading] = useState(false)

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

  const runLatencyTests = async () => {
    setLatencyLoading(true)
    setLatencyResult(null)
    const out: NonNullable<typeof latencyResult> = {}

    try {
      const pingStart = performance.now()
      const pingRes = await fetch("/api/debug/ping")
      const pingData = await pingRes.json()
      out.ping = { clientMs: Math.round(performance.now() - pingStart), data: pingData }

      const speedStart = performance.now()
      const speedRes = await fetch("/api/debug/speed-test")
      const speedData = await speedRes.json()
      out.speedTest = { clientMs: Math.round(performance.now() - speedStart), data: speedData }

      setLatencyResult(out)
    } catch {
      setLatencyResult({ ping: undefined, speedTest: undefined })
    }
    setLatencyLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded border p-6">
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

          {result != null ? (
            <div className="mt-6 p-4 bg-gray-50 rounded border">
              <h2 className="font-bold mb-2">Resultado:</h2>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        <div className="bg-white rounded border p-6">
          <h2 className="text-xl font-bold mb-2">Latencias</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ping: cold start sin DB. Speed test: DB + bcrypt (incluye carga de Prisma).
          </p>
          <button
            onClick={runLatencyTests}
            disabled={latencyLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {latencyLoading ? "Midiendo..." : "Ejecutar ping + speed-test"}
          </button>

          {latencyResult && (
            <div className="mt-6 space-y-4">
              {latencyResult.ping && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h3 className="font-semibold mb-2">Ping (sin DB)</h3>
                  <p className="text-sm">
                    <strong>Tiempo total (cliente):</strong> {latencyResult.ping.clientMs} ms
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Si &gt; 3–5 s en la primera vez, es cold start del servidor.
                  </p>
                </div>
              )}
              {latencyResult.speedTest && (
                <div className="p-4 bg-gray-50 rounded border">
                  <h3 className="font-semibold mb-2">Speed test (DB + bcrypt)</h3>
                  <p className="text-sm mb-2">
                    <strong>Tiempo total (cliente):</strong> {latencyResult.speedTest.clientMs} ms
                  </p>
                  <table className="text-sm w-full border-collapse">
                    <tbody>
                      {latencyResult.speedTest.data.results &&
                        Object.entries(latencyResult.speedTest.data.results).map(([k, v]) => (
                          <tr key={k} className="border-b border-gray-200">
                            <td className="py-1 pr-2">{k}</td>
                            <td className="py-1 font-mono">{String(v)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {latencyResult.speedTest.data.analysis && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="font-medium mb-1">Análisis</h4>
                      <ul className="text-sm space-y-0.5">
                        {Object.entries(latencyResult.speedTest.data.analysis).map(([k, v]) =>
                          v != null ? (
                            <li key={k}>
                              <span className="text-gray-600">{k}:</span> {String(v)}
                            </li>
                          ) : null
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
