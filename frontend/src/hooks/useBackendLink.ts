import { useEffect } from 'react'
import { fetchSystemStatus, systemWebSocketUrl } from '../services/backendClient'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

interface SocketPayload {
  cpuPercent: number | null
  memoryPercent: number | null
  gpuPercent: number | null
  network: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR'
  timestamp: number
  sensor_data?: {
    temperature?: number
    humidity?: number
  }
}

export function useBackendLink(): void {
  useEffect(() => {
    let cancelled = false
    let socket: WebSocket | null = null
    let poll: number | undefined

    const applyMetrics = (data: SocketPayload) => {
      useSystemStore.getState().setMetrics(data)
      useSystemStore.getState().setSubsystem('network', SubsystemStatus.ONLINE)

      if (data.sensor_data && data.sensor_data.temperature != null && data.sensor_data.humidity != null) {
        useSystemStore.getState().setSensorData({
          temperature: data.sensor_data.temperature,
          humidity: data.sensor_data.humidity,
        })
      }
    }

    const connectHttp = async () => {
      try {
        const data = await fetchSystemStatus()
        if (!cancelled) applyMetrics(data as SocketPayload)
      } catch {
        if (!cancelled) {
          useSystemStore.getState().setSubsystem('network', SubsystemStatus.OFFLINE)
          useSystemStore.getState().setWebsocketStatus('closed')
        }
      }
    }

    const connectWs = () => {
      try {
        useSystemStore.getState().setWebsocketStatus('connecting')
        socket = new WebSocket(systemWebSocketUrl())
        socket.onopen = () => {
          if (cancelled) return
          useSystemStore.getState().setWebsocketStatus('open')
          useSystemStore.getState().setSubsystem('network', SubsystemStatus.ONLINE)
        }
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as SocketPayload
            applyMetrics(data)
          } catch {
            /* ignore malformed frames */
          }
        }
        socket.onerror = () => {
          useSystemStore.getState().setWebsocketStatus('error')
        }
        socket.onclose = () => {
          if (cancelled) return
          useSystemStore.getState().setWebsocketStatus('closed')
        }
      } catch {
        useSystemStore.getState().setWebsocketStatus('error')
      }
    }

    void connectHttp()
    connectWs()
    poll = window.setInterval(() => {
      void connectHttp()
    }, 4000)

    return () => {
      cancelled = true
      if (poll) window.clearInterval(poll)
      socket?.close()
    }
  }, [])
}
