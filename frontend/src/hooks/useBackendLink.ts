import { useEffect } from 'react'
import { fetchSystemStatus, systemWebSocketUrl } from '../services/backendClient'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

export function useBackendLink(): void {
  useEffect(() => {
    let cancelled = false
    let socket: WebSocket | null = null
    let poll: number | undefined

    const applyMetrics = (data: {
      cpuPercent: number | null
      memoryPercent: number | null
      gpuPercent: number | null
      network: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'ERROR'
      timestamp: number
    }) => {
      useSystemStore.getState().setMetrics(data)
      useSystemStore.getState().setSubsystem('network', SubsystemStatus.ONLINE)
    }

    const connectHttp = async () => {
      try {
        const data = await fetchSystemStatus()
        if (!cancelled) applyMetrics(data)
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
            const data = JSON.parse(event.data as string) as Parameters<typeof applyMetrics>[0]
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
