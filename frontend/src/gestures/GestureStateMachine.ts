import { GestureType, InteractionState } from '../types/gestures'
import type { ProcessedHandData } from './HandLandmarkProcessor'
import { spatialEngine } from './SpatialInteractionEngine'

export class GestureStateMachine {
  private currentState: InteractionState = InteractionState.IDLE
  private previousGesture: GestureType = GestureType.NONE
  private gestureStreak = 0
  private lastPosition: { x: number; y: number; z: number } | null = null
  private smoothedPos = { x: 0.5, y: 0.5, z: 0 }
  private grabAnchor: { x: number; y: number } | null = null

  private readonly MIN_STREAK = 2 // Minimum frames to stabilize gesture
  private readonly LERP_FACTOR = 0.35

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

    // State machine logic
    if (gesture === GestureType.OPEN_PALM && stable) {
      this.currentState = InteractionState.IDLE
      this.grabAnchor = null
      spatialEngine.setPaused(false)
    } else if (isGrabbing || gesture === GestureType.FIST) {
      this.currentState = InteractionState.GRABBING
      if (!this.grabAnchor) {
        this.grabAnchor = { x: this.smoothedPos.x, y: this.smoothedPos.y }
      }
      // Dragging objects or scene
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        spatialEngine.ingestPointerDelta(dx * 1.5, dy * 1.5)
      }
    } else if (isPinching || gesture === GestureType.PINCH) {
      this.currentState = InteractionState.PINCHING
      // Pinch interaction: can select or drag objects
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        spatialEngine.ingestPointerDelta(dx * 1.2, dy * 1.2)
      }
    } else if (gesture === GestureType.TWO_FINGER && stable) {
      this.currentState = InteractionState.ZOOMING
      // Two fingers moving vertically or depth controls zoom
      const depthDelta = -(targetZ) * 0.1 - dy * 3.0
      if (Math.abs(depthDelta) > 0.01) {
        spatialEngine.ingestZoomDelta(depthDelta)
      }
    } else if (gesture === GestureType.POINT && stable) {
      this.currentState = InteractionState.POINTING
      // Pointing movement rotates the 3D scene smoothly
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
        spatialEngine.ingestPointerDelta(dx * 2.0, dy * 2.0)
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
  }
}

export const gestureStateMachine = new GestureStateMachine()
