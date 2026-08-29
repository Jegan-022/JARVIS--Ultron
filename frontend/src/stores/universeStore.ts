import { create } from 'zustand'
import { SceneId } from '../types/scene'
import type { InteractiveObjectMeta } from '../types/scene'
import { InteractionState } from '../types/gestures'
import type { GestureType } from '../types/gestures'

interface UniverseState {
  sceneId: SceneId
  selectedObjectId: string | null
  selectedObject: InteractiveObjectMeta | null
  interactionState: InteractionState
  gesture: GestureType
  debugEnabled: boolean
  paused: boolean
  fps: number
  cameraPosition: [number, number, number]
  objects: InteractiveObjectMeta[]
  setScene: (id: SceneId) => void
  selectObject: (id: string | null) => void
  registerObject: (meta: InteractiveObjectMeta) => void
  setInteractionState: (state: InteractionState) => void
  setDebugEnabled: (enabled: boolean) => void
  toggleDebug: () => void
  setPaused: (paused: boolean) => void
  setFps: (fps: number) => void
  setCameraPosition: (position: [number, number, number]) => void
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  sceneId: SceneId.GALAXY,
  selectedObjectId: null,
  selectedObject: null,
  interactionState: InteractionState.IDLE,
  gesture: 'NONE',
  debugEnabled: false,
  paused: false,
  fps: 0,
  cameraPosition: [0, 8, 42],
  objects: [],
  setScene: (id) => set({ sceneId: id, selectedObjectId: null, selectedObject: null }),
  selectObject: (id) => {
    const objects = get().objects
    const found = id ? objects.find((o) => o.id === id) ?? null : null
    set({
      selectedObjectId: id,
      selectedObject: found,
      interactionState: id ? InteractionState.SELECTING : InteractionState.IDLE,
    })
  },
  registerObject: (meta) => {
    const objects = get().objects
    if (!objects.some((o) => o.id === meta.id)) {
      set({ objects: [...objects, meta] })
    }
  },
  setInteractionState: (interactionState) => set({ interactionState }),
  setDebugEnabled: (debugEnabled) => set({ debugEnabled }),
  toggleDebug: () => set({ debugEnabled: !get().debugEnabled }),
  setPaused: (paused) => set({ paused }),
  setFps: (fps) => set({ fps }),
  setCameraPosition: (cameraPosition) => set({ cameraPosition }),
}))
