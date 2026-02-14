"use client"

import { createContext, useCallback, useContext, useRef, useState } from "react"

type ToastType = "error" | "success" | "info"

interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showError: (m: string) => alert(m),
      showSuccess: (m: string) => alert(m),
      showInfo: (m: string) => alert(m),
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const nextIdRef = useRef(0)

  const add = useCallback((message: string, type: ToastType) => {
    const id = nextIdRef.current++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const showError = useCallback((message: string) => add(message, "error"), [add])
  const showSuccess = useCallback((message: string) => add(message, "success"), [add])
  const showInfo = useCallback((message: string) => add(message, "info"), [add])

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showInfo }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 ${
              t.type === "error"
                ? "bg-red-600 text-white"
                : t.type === "success"
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white"
            }`}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
