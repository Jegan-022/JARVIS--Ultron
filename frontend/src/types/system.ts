export const SubsystemStatus = {
  ONLINE: 'ONLINE',
  STANDBY: 'STANDBY',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR',
  ACTIVE: 'ACTIVE',
} as const

export type SubsystemStatus = (typeof SubsystemStatus)[keyof typeof SubsystemStatus]

export interface SystemStatusPayload {
  cpuPercent: number | null
  memoryPercent: number | null
  gpuPercent: number | null
  network: SubsystemStatus
  timestamp: number
}

export interface SubsystemMap {
  vision: SubsystemStatus
  voice: SubsystemStatus
  ai: SubsystemStatus
  spatial: SubsystemStatus
  network: SubsystemStatus
  camera: SubsystemStatus
  microphone: SubsystemStatus
}
