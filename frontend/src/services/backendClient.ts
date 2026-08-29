const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'
const WS_BASE = import.meta.env.VITE_WS_BASE ?? 'ws://127.0.0.1:8000'

export async function fetchSystemStatus(): Promise<{
  cpuPercent: number | null
  memoryPercent: number | null
  gpuPercent: number | null
  network: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR'
  timestamp: number
}> {
  const response = await fetch(`${API_BASE}/system/status`, {
    signal: AbortSignal.timeout(2500),
  })
  if (!response.ok) {
    throw new Error(`status ${response.status}`)
  }
  return response.json() as Promise<{
    cpuPercent: number | null
    memoryPercent: number | null
    gpuPercent: number | null
    network: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR'
    timestamp: number
  }>
}

export function systemWebSocketUrl(): string {
  return `${WS_BASE}/ws/system`
}

export const backendClient = {
  baseUrl: API_BASE,
  wsUrl: WS_BASE,
}

export { API_BASE }
