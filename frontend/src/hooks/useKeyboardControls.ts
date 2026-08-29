import { useEffect } from 'react'
import { spatialEngine } from '../gestures/SpatialInteractionEngine'
import { SceneId } from '../types/scene'
import { SceneManager } from '../scenes/SceneManager'
import { useUniverseStore } from '../stores/universeStore'

export function useKeyboardControls(): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (event.key === 'F3') {
        event.preventDefault()
        useUniverseStore.getState().toggleDebug()
        return
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          spatialEngine.reset()
          useUniverseStore.getState().selectObject(null)
          break
        case 'g':
          SceneManager.switch(SceneId.GALAXY)
          break
        case 's':
          SceneManager.switch(SceneId.SOLAR_SYSTEM)
          break
        case 'e':
          SceneManager.switch(SceneId.EARTH)
          break
        case ' ':
          event.preventDefault()
          {
            const next = !useUniverseStore.getState().paused
            useUniverseStore.getState().setPaused(next)
            spatialEngine.setPaused(next)
          }
          break
        case 'escape':
          useUniverseStore.getState().selectObject(null)
          spatialEngine.reset()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
