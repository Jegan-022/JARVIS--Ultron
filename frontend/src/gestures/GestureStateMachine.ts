import { GestureType, InteractionState } from '../types/gestures'
import type { ProcessedHandData } from './HandLandmarkProcessor'
import { spatialEngine } from './SpatialInteractionEngine'
import { SceneManager } from '../scenes/SceneManager'
import { SceneId } from '../types/scene'
import { useUniverseStore } from '../stores/universeStore'
import { voiceManager } from '../voice/VoiceManager'

const SCENE_ORDER: SceneId[] = [
  SceneId.GALAXY,
  SceneId.SOLAR_SYSTEM,
  SceneId.EARTH,
  SceneId.NEURAL_NETWORK,
  SceneId.DIGITAL_GLOBE,
  SceneId.SYSTEM_VISUALIZATION,
]

export class GestureStateMachine {
  private currentState: InteractionState = InteractionState.IDLE
  private previousGesture: GestureType = GestureType.NONE
  private gestureStreak = 0
  private lastPosition: { x: number; y: number; z: number } | null = null
  private smoothedPos = { x: 0.5, y: 0.5, z: 0 }
  private grabAnchor: { x: number; y: number } | null = null
  private lastActionTime = 0

  private readonly MIN_STREAK = 3 // Minimum frames to stabilize gesture
  private readonly LERP_FACTOR = 0.35
  private readonly ACTION_COOLDOWN_MS = 1200

  update(handData: ProcessedHandData | null, isVoiceOverriding = false): {
    state: InteractionState
    cursorPos: { x: number; y: number; z: number }
    isPinching: boolean
    isGrabbing: boolean
  } {
    if (isVoiceOverriding) {
      this.currentState = InteractionState.VOICE_OVERRIDE
      return {
        state: this.currentState,
        cursorPos: this.smoothedPos,
        isPinching: false,
        isGrabbing: false,
      }
    }

    if (!handData) {
      this.currentState = InteractionState.IDLE
      this.lastPosition = null
      this.grabAnchor = null
      this.gestureStreak = 0
      return {
        state: this.currentState,
        cursorPos: this.smoothedPos,
        isPinching: false,
        isGrabbing: false,
      }
    }

    const { gesture, indexTip, isPinching, isGrabbing } = handData
    const now = performance.now()

    // Temporal smoothing of cursor position
    const targetX = indexTip.x
    const targetY = indexTip.y
    const targetZ = indexTip.z

    this.smoothedPos.x += (targetX - this.smoothedPos.x) * this.LERP_FACTOR
    this.smoothedPos.y += (targetY - this.smoothedPos.y) * this.LERP_FACTOR
    this.smoothedPos.z += (targetZ - this.smoothedPos.z) * this.LERP_FACTOR

    if (gesture === this.previousGesture) {
      this.gestureStreak++
    } else {
      this.gestureStreak = 1
      this.previousGesture = gesture
    }

    const stable = this.gestureStreak >= this.MIN_STREAK

    // Calculate motion delta
    let dx = 0
    let dy = 0
    if (this.lastPosition) {
      dx = this.smoothedPos.x - this.lastPosition.x
      dy = this.smoothedPos.y - this.lastPosition.y
    }
    this.lastPosition = { ...this.smoothedPos }

    // ─── Gesture State Machine Logic ───
    if (gesture === GestureType.OPEN_PALM && stable) {
      this.currentState = InteractionState.IDLE
      this.grabAnchor = null
      spatialEngine.setPaused(false)

    } else if (isGrabbing || gesture === GestureType.FIST) {
      this.currentState = InteractionState.GRABBING
      if (!this.grabAnchor) {
        this.grabAnchor = { x: this.smoothedPos.x, y: this.smoothedPos.y }
      }
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        spatialEngine.ingestPointerDelta(dx * 1.5, dy * 1.5)
      }

    } else if (isPinching || gesture === GestureType.PINCH) {
      this.currentState = InteractionState.PINCHING
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        spatialEngine.ingestPointerDelta(dx * 1.2, dy * 1.2)
      }

    } else if (gesture === GestureType.THUMBS_UP && stable) {
      this.currentState = InteractionState.CONFIRMING
      if (now - this.lastActionTime > this.ACTION_COOLDOWN_MS) {
        this.lastActionTime = now
        const selected = useUniverseStore.getState().selectedObject
        if (selected) {
          voiceManager.speak(`Confirmed selection: ${selected.name}`)
        }
      }

    } else if (gesture === GestureType.THUMBS_DOWN && stable) {
      this.currentState = InteractionState.IDLE
      if (now - this.lastActionTime > this.ACTION_COOLDOWN_MS) {
        this.lastActionTime = now
        useUniverseStore.getState().selectObject(null)
      }

    } else if (gesture === GestureType.THREE_FINGERS && stable) {
      this.currentState = InteractionState.SCENE_SWITCHING
      if (now - this.lastActionTime > this.ACTION_COOLDOWN_MS * 1.5) {
        this.lastActionTime = now
        const current = useUniverseStore.getState().sceneId
        const idx = SCENE_ORDER.indexOf(current)
        const next = SCENE_ORDER[(idx + 1) % SCENE_ORDER.length]
        SceneManager.switch(next)
        voiceManager.speak(`Switching to ${next.replaceAll('_', ' ')}`)
      }

    } else if (gesture === GestureType.WAVE && stable) {
      if (now - this.lastActionTime > this.ACTION_COOLDOWN_MS * 2) {
        this.lastActionTime = now
        voiceManager.speak('Greetings, sir. J.A.R.V.I.S. at your command.')
      }

    } else if (gesture === GestureType.PEACE_SIGN && stable) {
      if (now - this.lastActionTime > this.ACTION_COOLDOWN_MS * 1.5) {
        this.lastActionTime = now
        useUniverseStore.getState().toggleDebug()
        voiceManager.speak('Diagnostics overlay toggled.')
      }

    } else if (gesture === GestureType.TWO_FINGER && stable) {
      this.currentState = InteractionState.ZOOMING
      const depthDelta = -(targetZ) * 0.1 - dy * 3.0
      if (Math.abs(depthDelta) > 0.01) {
        spatialEngine.ingestZoomDelta(depthDelta)
      }

    } else if ((gesture === GestureType.POINT || gesture === GestureType.FINGER_GUN) && stable) {
      this.currentState = InteractionState.POINTING
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        const mult = gesture === GestureType.FINGER_GUN ? 2.8 : 2.0
        spatialEngine.ingestPointerDelta(dx * mult, dy * mult)
      }

    } else if (gesture === GestureType.SWIPE_LEFT) {
      spatialEngine.ingestPointerDelta(-0.25, 0)
    } else if (gesture === GestureType.SWIPE_RIGHT) {
      spatialEngine.ingestPointerDelta(0.25, 0)
    } else if (gesture === GestureType.SWIPE_UP) {
      spatialEngine.ingestPointerDelta(0, -0.2)
    } else if (gesture === GestureType.SWIPE_DOWN) {
      spatialEngine.ingestPointerDelta(0, 0.2)
    } else {
      if (this.currentState !== InteractionState.IDLE) {
        this.currentState = InteractionState.IDLE
      }
    }

    return {
      state: this.currentState,
      cursorPos: this.smoothedPos,
      isPinching: this.currentState === InteractionState.PINCHING,
      isGrabbing: this.currentState === InteractionState.GRABBING,
    }
  }

  getState(): InteractionState {
    return this.currentState
  }

  reset(): void {
    this.currentState = InteractionState.IDLE
    this.previousGesture = GestureType.NONE
    this.gestureStreak = 0
    this.lastPosition = null
    this.grabAnchor = null
    this.lastActionTime = 0
  }
}

export const gestureStateMachine = new GestureStateMachine()
