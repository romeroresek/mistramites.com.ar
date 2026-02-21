"use client"

import { useState, useEffect, useCallback } from "react"

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: "default",
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const checkSupport = () => {
      const hasApis =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window

      // Push requiere contexto seguro (HTTPS o localhost)
      const isSecure =
        typeof window !== "undefined" &&
        (window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")

      console.log("[Push] Support check:", {
        serviceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
        PushManager: typeof window !== "undefined" && "PushManager" in window,
        Notification: typeof window !== "undefined" && "Notification" in window,
        isSecure,
        protocol: typeof window !== "undefined" ? window.location.protocol : "unknown",
        hostname: typeof window !== "undefined" ? window.location.hostname : "unknown",
      })

      if (!isSecure && hasApis) {
        console.warn("[Push] Push notifications requieren HTTPS. Protocolo actual:", window.location.protocol, "Host:", window.location.hostname)
      }

      return hasApis && isSecure
    }

    const isSupported = checkSupport()

    if (!isSupported) {
      const isHttp =
        typeof window !== "undefined" &&
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"

      setState((prev) => ({
        ...prev,
        isSupported: false,
        isLoading: false,
        error: isHttp
          ? "Las notificaciones push requieren HTTPS. Estás accediendo por HTTP."
          : null,
      }))
      return
    }

    const checkStatus = async () => {
      try {
        const permission = Notification.permission
        console.log("[Push] Permiso actual:", permission)

        // Esperar al service worker con timeout
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 5000)
        )

        const registration = await Promise.race([
          navigator.serviceWorker.ready,
          timeoutPromise,
        ])

        if (!registration) {
          console.warn("[Push] Service worker no respondió en 5s")
          setState({
            isSupported: true,
            isSubscribed: false,
            permission,
            isLoading: false,
            error: null,
          })
          return
        }

        const reg = registration as ServiceWorkerRegistration
        console.log("[Push] Service worker listo, scope:", reg.scope)
        const subscription = await reg.pushManager.getSubscription()
        console.log("[Push] Suscripción existente:", subscription ? "SÍ" : "NO")

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        console.error("[Push] Error verificando estado:", err)
        setState({
          isSupported: true,
          isSubscribed: false,
          permission: Notification.permission,
          isLoading: false,
          error: null,
        })
      }
    }

    checkStatus()
  }, [])

  // subscribe retorna { success: boolean, error?: string } para que el caller tenga el error inmediatamente
  const subscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // Verificar HTTPS
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"

    if (!isSecure) {
      const msg =
        "Las notificaciones push requieren HTTPS. Estás accediendo por HTTP desde " +
        window.location.hostname
      console.error("[Push]", msg)
      setState((prev) => ({ ...prev, error: msg }))
      return { success: false, error: msg }
    }

    // Verificar soporte básico
    const hasSupport =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    if (!hasSupport) {
      const msg = "Tu navegador no soporta notificaciones push"
      setState((prev) => ({ ...prev, error: msg }))
      return { success: false, error: msg }
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log("[Push] Solicitando permiso de notificaciones...")
      const permission = await Notification.requestPermission()
      console.log("[Push] Resultado del permiso:", permission)

      if (permission !== "granted") {
        const msg =
          permission === "denied"
            ? "Notificaciones bloqueadas. Andá a Configuración del navegador > Sitios > Notificaciones y permití este sitio."
            : "Permiso de notificaciones denegado"
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: msg,
        }))
        return { success: false, error: msg }
      }

      // Esperar al service worker con timeout
      console.log("[Push] Esperando service worker...")
      const registrationPromise = navigator.serviceWorker.ready
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 10000)
      )

      const registration = await Promise.race([
        registrationPromise,
        timeoutPromise,
      ])

      if (!registration) {
        const msg = "Service worker no disponible. Recargá la página e intentá de nuevo."
        console.error("[Push]", msg)
        setState((prev) => ({ ...prev, isLoading: false, error: msg }))
        return { success: false, error: msg }
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log(
        "[Push] VAPID Key:",
        vapidKey ? `${vapidKey.substring(0, 10)}...` : "NO DEFINIDA"
      )

      if (!vapidKey) {
        const msg = "Notificaciones no configuradas en el servidor."
        setState((prev) => ({ ...prev, isLoading: false, error: msg }))
        return { success: false, error: msg }
      }

      console.log("[Push] Creando suscripción push...")
      const reg = registration as ServiceWorkerRegistration
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      console.log(
        "[Push] Suscripción creada:",
        subscription.endpoint.substring(0, 60) + "..."
      )

      console.log("[Push] Guardando suscripción en servidor...")
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[Push] Error del servidor:", response.status, errorData)
        throw new Error(
          errorData.error || "Error al guardar suscripción en el servidor"
        )
      }

      const result = await response.json()
      console.log("[Push] Suscripción guardada exitosamente:", result)

      setState((prev) => ({
        ...prev,
        isSupported: true,
        isSubscribed: true,
        permission: "granted",
        isLoading: false,
        error: null,
      }))

      return { success: true }
    } catch (error) {
      console.error("[Push] Error al suscribirse:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al suscribirse a notificaciones"
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !state.isSubscribed) return false

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error("[Push] Error al desuscribirse:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Error al cancelar suscripción",
      }))
      return false
    }
  }, [state.isSupported, state.isSubscribed])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer as ArrayBuffer
}
