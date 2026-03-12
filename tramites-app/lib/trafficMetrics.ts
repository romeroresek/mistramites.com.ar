interface TrafficMetric {
  route: string
  operation: string
  payloadBytes?: number
  rowCount?: number
  changedCount?: number
  extra?: Record<string, unknown>
}

export function estimateJsonPayloadBytes(payload: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(payload))
  } catch {
    return 0
  }
}

export function logTrafficMetric(metric: TrafficMetric): void {
  if (process.env.ENABLE_TRAFFIC_METRICS !== "true") return

  console.info(
    "[traffic]",
    JSON.stringify({
      at: new Date().toISOString(),
      ...metric,
    })
  )
}
