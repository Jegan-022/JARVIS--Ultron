// Use VITE_API_BASE / VITE_WS_BASE env vars in production (set them in Vercel dashboard).
// Falls back to relative URLs so the app doesn't hard-crash when no backend is reachable.
const API_BASE = import.meta.env.VITE_API_BASE ?? ''
const WS_BASE = import.meta.env.VITE_WS_BASE ?? `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`

export interface AICommandPayload {
  command: string
  activeScene?: string
  selectedObject?: Record<string, unknown> | null
  handGesture?: string
  cursorPosition?: { x: number; y: number; z: number } | null
  cameraPosition?: [number, number, number] | null
}

export interface AICommandResponse {
  text: string
  spoken_response: string
  tool_executed?: string | null
  tool_results?: Array<{
    tool: string
    arguments: Record<string, unknown>
    result: Record<string, unknown>
  }>
  context?: Record<string, unknown>
}

export async function fetchSystemStatus(): Promise<{
  cpuPercent: number | null
  memoryPercent: number | null
  gpuPercent: number | null
  network: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR'
  timestamp: number
}> {
  const response = await fetch(`${API_BASE}/system/status`, {
    signal: AbortSignal.timeout(3000),
  })
  if (!response.ok) {
    throw new Error(`status ${response.status}`)
  }
  return response.json()
}

export async function sendAICommand(payload: AICommandPayload): Promise<AICommandResponse> {
  const response = await fetch(`${API_BASE}/api/ai/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw new Error(`AI command error ${response.status}`)
  }
  return response.json()
}

export async function executeTool(
  name: string,
  parameters: Record<string, unknown> = {},
  confirmed = false,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${API_BASE}/api/ai/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parameters, confirmed }),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) {
    throw new Error(`Tool execution error ${response.status}`)
  }
  return response.json()
}

export async function controlDevice(
  device: string,
  action: 'turn_on' | 'turn_off' | 'toggle',
  brightness?: number,
): Promise<Record<string, unknown>> {
  return executeTool('control_home_device', { device, action, brightness })
}

export function systemWebSocketUrl(): string {
  return `${WS_BASE}/ws/system`
}

export const backendClient = {
  baseUrl: API_BASE,
  wsUrl: WS_BASE,
  sendAICommand,
  executeTool,
  controlDevice,
  fetchSystemStatus,
}

export { API_BASE }
