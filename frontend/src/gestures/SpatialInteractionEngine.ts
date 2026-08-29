import { InteractionState } from '../types/gestures'
import type { UniverseTransform } from '../types/scene'

const SMOOTHING = 8
const ROTATION_SENSITIVITY = 2.4
const ZOOM_SENSITIVITY = 0.012
const MIN_ZOOM = 12
const MAX_ZOOM = 90
const MIN_ROT_X = -0.85
const MAX_ROT_X = 0.85

function expLerp(current: number, target: number, dt: number, smoothing: number): number {
  const t = 1 - Math.exp(-smoothing * dt)
  return current + (target - current) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Central spatial mapping. Mouse (Phase 1) and hand landmarks (later phases)
 * both write deltas here; the scene never consumes raw coordinates.
 */
export class SpatialInteractionEngine {
  private targetRotX = 0.18
  private targetRotY = 0.35
  private targetZoom = 42
  private rotX = 0.18
  private rotY = 0.35
  private zoom = 42
  private paused = false
  private state: InteractionState = InteractionState.IDLE
  private last: UniverseTransform = { rotationX: 0.18, rotationY: 0.35, zoom: 42 }

  ingestPointerDelta(normalizedDx: number, normalizedDy: number): void {
    if (this.paused) return
    this.targetRotY += normalizedDx * ROTATION_SENSITIVITY
    this.targetRotX = clamp(
      this.targetRotX + normalizedDy * ROTATION_SENSITIVITY,
      MIN_ROT_X,
      MAX_ROT_X,
    )
    this.state = InteractionState.ROTATING
  }

  ingestZoomDelta(delta: number): void {
    if (this.paused) return
    this.targetZoom = clamp(this.targetZoom + delta * ZOOM_SENSITIVITY * 80, MIN_ZOOM, MAX_ZOOM)
    this.state = InteractionState.ZOOMING
  }

  setPaused(paused: boolean): void {
    this.paused = paused
    if (paused) this.state = InteractionState.IDLE
  }

  isPaused(): boolean {
    return this.paused
  }

  reset(): void {
    this.targetRotX = 0.18
    this.targetRotY = 0.35
    this.targetZoom = 42
    this.rotX = 0.18
    this.rotY = 0.35
    this.zoom = 42
    this.last = { rotationX: 0.18, rotationY: 0.35, zoom: 42 }
    this.state = InteractionState.IDLE
  }

  getState(): InteractionState {
    return this.state
  }

  tick(dt: number): UniverseTransform {
    if (!this.paused) {
      this.rotX = expLerp(this.rotX, this.targetRotX, dt, SMOOTHING)
      this.rotY = expLerp(this.rotY, this.targetRotY, dt, SMOOTHING)
      this.zoom = expLerp(this.zoom, this.targetZoom, dt, SMOOTHING)
    }

    const settled =
      Math.abs(this.rotX - this.targetRotX) < 0.001 &&
      Math.abs(this.rotY - this.targetRotY) < 0.001 &&
      Math.abs(this.zoom - this.targetZoom) < 0.05

    if (settled && this.state !== InteractionState.IDLE && !this.paused) {
      this.state = InteractionState.IDLE
    }

    this.last = { rotationX: this.rotX, rotationY: this.rotY, zoom: this.zoom }
    return this.last
  }

  peek(): UniverseTransform {
    return this.last
  }
}

export const spatialEngine = new SpatialInteractionEngine()
