import { create } from 'zustand'
import { SubsystemStatus } from '../types/system'
import type { SubsystemMap, SystemStatusPayload } from '../types/system'

export interface TranscriptEntry {
  id: string
  speaker: 'user' | 'ultron'
  text: string
  timestamp: string
}

export interface IoTDevice {
  id: string
  name: string
  state: 'on' | 'off' | 'active' | 'offline'
  type: 'light' | 'switch' | 'sensor' | 'relay'
}

interface SystemStore {
  booted: boolean
  subsystems: SubsystemMap
  metrics: SystemStatusPayload | null
  websocketStatus: 'connecting' | 'open' | 'closed' | 'error'
  voiceStatus: 'idle' | 'listening' | 'speaking' | 'processing'
  transcripts: TranscriptEntry[]
  lastTranscript: string
  lastResponse: string
  devices: IoTDevice[]
  sensorData: { temperature: number; humidity: number }
  setBooted: (booted: boolean) => void
  setSubsystem: (key: keyof SubsystemMap, status: SubsystemStatus) => void
  setMetrics: (metrics: SystemStatusPayload) => void
  setWebsocketStatus: (websocketStatus: SystemStore['websocketStatus']) => void
  setVoiceStatus: (status: 'idle' | 'listening' | 'speaking' | 'processing') => void
  addTranscript: (speaker: 'user' | 'ultron', text: string) => void
  setTranscript: (user: string, response: string) => void
  setDevices: (devices: IoTDevice[]) => void
  updateDeviceState: (id: string, state: IoTDevice['state']) => void
  setSensorData: (data: { temperature: number; humidity: number }) => void
}

const INITIAL_DEVICES: IoTDevice[] = [
  { id: 'light.living_room', name: 'Room Ambient Light', state: 'on', type: 'light' },
  { id: 'switch.relay_core', name: 'Main Power Relay', state: 'on', type: 'relay' },
  { id: 'light.command_deck', name: 'Deck Halo Luminary', state: 'on', type: 'light' },
  { id: 'sensor.esp32_node', name: 'ESP32 Telemetry Node', state: 'active', type: 'sensor' },
]

export const useSystemStore = create<SystemStore>((set) => ({
  booted: false,
  subsystems: {
    vision: SubsystemStatus.STANDBY,
    voice: SubsystemStatus.STANDBY,
    ai: SubsystemStatus.STANDBY,
    spatial: SubsystemStatus.STANDBY,
    network: SubsystemStatus.OFFLINE,
    camera: SubsystemStatus.STANDBY,
    microphone: SubsystemStatus.STANDBY,
  },
  metrics: null,
  websocketStatus: 'closed',
  voiceStatus: 'idle',
  transcripts: [
    {
      id: 'init-1',
      speaker: 'ultron',
      text: 'ULTRON Multimodal Core online. Spatial vision and voice systems standing by.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  lastTranscript: '',
  lastResponse: 'ULTRON Multimodal Core online. Ready for command.',
  devices: INITIAL_DEVICES,
  sensorData: { temperature: 24.5, humidity: 48 },

  setBooted: (booted) => set({ booted }),
  setSubsystem: (key, status) =>
    set((state) => ({
      subsystems: { ...state.subsystems, [key]: status },
    })),
  setMetrics: (metrics) => set({ metrics }),
  setWebsocketStatus: (websocketStatus) => set({ websocketStatus }),
  setVoiceStatus: (voiceStatus) => set({ voiceStatus }),
  addTranscript: (speaker, text) =>
    set((state) => ({
      transcripts: [
        ...state.transcripts.slice(-8),
        {
          id: `t-${Date.now()}-${Math.random()}`,
          speaker,
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      lastTranscript: speaker === 'user' ? text : state.lastTranscript,
      lastResponse: speaker === 'ultron' ? text : state.lastResponse,
    })),
  setTranscript: (lastTranscript, lastResponse) =>
    set((state) => ({
      lastTranscript,
      lastResponse,
      transcripts: [
        ...state.transcripts.slice(-8),
        {
          id: `t-u-${Date.now()}`,
          speaker: 'user',
          text: lastTranscript,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: `t-o-${Date.now()}`,
          speaker: 'ultron',
          text: lastResponse,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    })),
  setDevices: (devices) => set({ devices }),
  updateDeviceState: (id, state) =>
    set((s) => ({
      devices: s.devices.map((d) => (d.id === id ? { ...d, state } : d)),
    })),
  setSensorData: (sensorData) => set({ sensorData }),
}))
