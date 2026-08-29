export const SceneId = {
  GALAXY: 'galaxy',
  SOLAR_SYSTEM: 'solar_system',
  EARTH: 'earth',
  NEURAL_NETWORK: 'neural_network',
  DIGITAL_GLOBE: 'digital_globe',
  SYSTEM_VISUALIZATION: 'system_visualization',
} as const

export type SceneId = (typeof SceneId)[keyof typeof SceneId]

export interface InteractiveObjectMeta {
  id: string
  name: string
  type: string
  description: string
  actions: string[]
}

export interface UniverseTransform {
  rotationX: number
  rotationY: number
  zoom: number
}
