import { SceneId, type SceneId as SceneIdType } from '../types/scene'
import { useUniverseStore } from '../stores/universeStore'
import { spatialEngine } from '../gestures/SpatialInteractionEngine'

const IMPLEMENTED: ReadonlySet<SceneIdType> = new Set([
  SceneId.GALAXY,
  SceneId.SOLAR_SYSTEM,
  SceneId.EARTH,
  SceneId.NEURAL_NETWORK,
  SceneId.DIGITAL_GLOBE,
  SceneId.SYSTEM_VISUALIZATION,
])

export const SceneManager = {
  switch(id: SceneIdType): void {
    useUniverseStore.getState().setScene(id)
    spatialEngine.reset()
  },
  isImplemented(id: SceneIdType): boolean {
    return IMPLEMENTED.has(id)
  },
  getScenes(): { id: SceneIdType; name: string }[] {
    return [
      { id: SceneId.GALAXY, name: 'Galaxy' },
      { id: SceneId.SOLAR_SYSTEM, name: 'Solar System' },
      { id: SceneId.EARTH, name: 'Earth' },
      { id: SceneId.NEURAL_NETWORK, name: 'Neural Network' },
      { id: SceneId.DIGITAL_GLOBE, name: 'Digital Globe' },
      { id: SceneId.SYSTEM_VISUALIZATION, name: 'System Visualization' },
    ]
  },
}
