"use client"

import { useState, useEffect } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { isSupported, isSubscribed, permission, isLoading, subscribe } =
    usePushNotifications()

  useEffect(() => {
    const wasDismissed = localStorage.getItem("notification-prompt-dismissed")
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    if (isSupported && !isSubscribed && permission === "default") {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, isSubscribed, permission])

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem("notification-prompt-dismissed", "true")
  }

  if (!showPrompt || dismissed || isSubscribed || !isSupported) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">
            Activar notificaciones
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Recibe alertas cuando el estado de tus tramites cambie.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Activando..." : "Activar"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-gray-600 text-xs hover:text-gray-900"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
