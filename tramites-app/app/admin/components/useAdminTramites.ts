"use client"

import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  AdminTramitesFilter,
  AdminTramitesResponse,
  Tramite,
} from "./types"
import { MP_VERIFY_BATCH_SIZE } from "./types"

const TRAMITES_BASE_KEY = ["admin", "tramites"] as const

type VerifiedPago = NonNullable<Tramite["pago"]>

interface VerifyBatchResult {
  tramiteId: string
  updated: boolean
  pago?: VerifiedPago
}

interface VerifyBatchResponse {
  updated: boolean
  results?: VerifyBatchResult[]
}

interface UseAdminTramitesParams {
  page: number
  limit: number
  search: string
  filterStatus: AdminTramitesFilter
}

function getTramitesQueryKey(params: UseAdminTramitesParams) {
  return [
    ...TRAMITES_BASE_KEY,
    params.page,
    params.limit,
    params.search || "",
    params.filterStatus || "all",
  ] as const
}

async function fetchTramites(params: UseAdminTramitesParams): Promise<AdminTramitesResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.search) searchParams.set("search", params.search)
  if (params.filterStatus) searchParams.set("filterStatus", params.filterStatus)

  const res = await fetch(`/api/admin/tramites?${searchParams.toString()}`, {
    cache: "no-store",
  })

  if (!res.ok) throw new Error("Error al obtener trámites")

  const data: unknown = await res.json()
  if (
    typeof data !== "object" ||
    data === null ||
    !("data" in data) ||
    !Array.isArray(data.data) ||
    !("pagination" in data)
  ) {
    throw new Error("Formato inválido")
  }

  return data as AdminTramitesResponse
}

function mergeVerifiedPayments(
  current: AdminTramitesResponse | undefined,
  results: VerifyBatchResult[]
): AdminTramitesResponse | undefined {
  if (!current || results.length === 0) return current

  const byTramiteId = new Map(
    results
      .filter((result): result is VerifyBatchResult & { pago: VerifiedPago } => result.updated && !!result.pago)
      .map((result) => [result.tramiteId, result.pago])
  )

  if (byTramiteId.size === 0) return current

  return {
    ...current,
    data: current.data.map((tramite) => {
      const pago = byTramiteId.get(tramite.id)
      if (!pago) return tramite

      return {
        ...tramite,
        pago: {
          estado: pago.estado,
          mercadopagoId: tramite.pago?.mercadopagoId ?? null,
          paymentId: pago.paymentId,
          payerEmail: pago.payerEmail,
          payerName: pago.payerName,
          payerDni: pago.payerDni,
          paymentMethod: pago.paymentMethod,
          paymentDate: pago.paymentDate,
        },
      }
    }),
  }
}

function replaceTramite(
  current: AdminTramitesResponse | undefined,
  updatedTramite: Tramite
): AdminTramitesResponse | undefined {
  if (!current) return current

  return {
    ...current,
    data: current.data.map((tramite) =>
      tramite.id === updatedTramite.id
        ? {
            ...tramite,
            ...updatedTramite,
            user: updatedTramite.user ?? tramite.user,
            partida: updatedTramite.partida ?? tramite.partida,
            pago: updatedTramite.pago ?? tramite.pago,
          }
        : tramite
    ),
  }
}

function removeTramite(
  current: AdminTramitesResponse | undefined,
  tramiteId: string
): AdminTramitesResponse | undefined {
  if (!current) return current

  const nextData = current.data.filter((tramite) => tramite.id !== tramiteId)
  if (nextData.length === current.data.length) return current

  return {
    ...current,
    data: nextData,
    pagination: {
      ...current.pagination,
      total: Math.max(0, current.pagination.total - 1),
      totalPages: Math.max(
        1,
        Math.ceil(Math.max(0, current.pagination.total - 1) / current.pagination.limit)
      ),
    },
  }
}

async function verifyPaymentsBatch(tramites: Tramite[]): Promise<VerifyBatchResponse> {
  const conPago = tramites.filter(
    (t) =>
      t.pago &&
      ((t.pago.estado === "pendiente" && (t.pago.mercadopagoId || t.pago.paymentId)) ||
        t.pago.estado === "confirmado")
  )
  const tramiteIds = conPago.map((t) => t.id)
  if (tramiteIds.length === 0) return { updated: false, results: [] }

  const results: VerifyBatchResult[] = []
  for (let i = 0; i < tramiteIds.length; i += MP_VERIFY_BATCH_SIZE) {
    const batchIds = tramiteIds.slice(i, i + MP_VERIFY_BATCH_SIZE)
    try {
      const res = await fetch("/api/mercadopago/verify-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tramiteIds: batchIds }),
      })
      if (!res.ok) continue
      const data = (await res.json()) as VerifyBatchResponse
      if (Array.isArray(data.results)) {
        results.push(...data.results)
      }
    } catch {
      // Ignore batch failures
    }
  }

  return {
    updated: results.some((result) => result.updated),
    results,
  }
}

export function useAdminTramites(params: UseAdminTramitesParams) {
  const queryClient = useQueryClient()
  const queryKey = getTramitesQueryKey(params)

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTramites(params),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: TRAMITES_BASE_KEY }),
    [queryClient]
  )

  const verifyPayments = useCallback(
    async (tramites: Tramite[]) => {
      const verification = await verifyPaymentsBatch(tramites)
      if (verification.updated && verification.results) {
        queryClient.setQueriesData<AdminTramitesResponse>(
          { queryKey: TRAMITES_BASE_KEY },
          (current) => mergeVerifiedPayments(current, verification.results ?? [])
        )
      }
      return verification.updated
    },
    [queryClient]
  )

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      tramiteId,
      field,
      value,
    }: {
      tramiteId: string
      field: "estado" | "pagoEstado"
      value: string
    }) => {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      const updatedTramite = (await res.json()) as Tramite
      return updatedTramite
    },
    onSuccess: (updatedTramite) => {
      queryClient.setQueriesData<AdminTramitesResponse>(
        { queryKey: TRAMITES_BASE_KEY },
        (current) => replaceTramite(current, updatedTramite)
      )
      void invalidate()
    },
  })

  const saveObservacionesMutation = useMutation({
    mutationFn: async ({ tramiteId, observaciones }: { tramiteId: string; observaciones: string | null }) => {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observaciones }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      const updatedTramite = (await res.json()) as Tramite
      return updatedTramite
    },
    onSuccess: (updatedTramite) => {
      queryClient.setQueriesData<AdminTramitesResponse>(
        { queryKey: TRAMITES_BASE_KEY },
        (current) => replaceTramite(current, updatedTramite)
      )
      void invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (tramiteId: string) => {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      return tramiteId
    },
    onSuccess: (tramiteId) => {
      queryClient.setQueriesData<AdminTramitesResponse>(
        { queryKey: TRAMITES_BASE_KEY },
        (current) => removeTramite(current, tramiteId)
      )
      void invalidate()
    },
  })

  return {
    tramites: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: params.page,
      limit: params.limit,
      total: 0,
      totalPages: 1,
    },
    stats: query.data?.stats ?? {
      pendientesCount: 0,
      enProcesoCount: 0,
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
    invalidate,
    verifyPayments,
    updateStatus: updateStatusMutation.mutate,
    saveObservaciones: saveObservacionesMutation.mutateAsync,
    isSavingObs: saveObservacionesMutation.isPending,
    deleteTramite: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
