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
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    if (!isSupported) {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        isLoading: false,
      }))
      return
    }

    const checkStatus = async () => {
      try {
        const permission = Notification.permission
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          isLoading: false,
          error: null,
        })
      } catch {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Error al verificar estado de notificaciones",
        }))
      }
    }

    checkStatus()
  }, [])

  const subscribe = useCallback(async () => {
    if (!state.isSupported) return false

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: "Permiso de notificaciones denegado",
        }))
        return false
      }

      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        throw new Error("Error al guardar suscripcion en el servidor")
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        permission: "granted",
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error("Error subscribing to push:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Error al suscribirse",
      }))
      return false
    }
  }, [state.isSupported])

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
      console.error("Error unsubscribing from push:", error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Error al cancelar suscripcion",
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
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer as ArrayBuffer
}
