import { GestureType } from '../types/gestures'
import type { Landmark } from '../types/hand'

export interface ProcessedHandData {
  gesture: GestureType
  confidence: number
  pinchDistance: number
  isPinching: boolean
  isGrabbing: boolean
  handOpenness: number
  palmCenter: { x: number; y: number; z: number }
  indexTip: { x: number; y: number; z: number }
  thumbTip: { x: number; y: number; z: number }
  extendedFingers: {
    thumb: boolean
    index: boolean
    middle: boolean
    ring: boolean
    pinky: boolean
  }
}

function dist3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = (a.z ?? 0) - (b.z ?? 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function dist2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

export class HandLandmarkProcessor {
  private prevIndexTip: { x: number; y: number; timestamp: number } | null = null
  private smoothedPinchDist = 0.1
  private pinchActive = false
  private gestureCooldown = 0
  private lastSwipeTime = 0

  // Hysteresis thresholds for pinch
  private readonly PINCH_START_THRESHOLD = 0.055
  private readonly PINCH_RELEASE_THRESHOLD = 0.085
  private readonly SWIPE_COOLDOWN_MS = 400

  process(landmarks: Landmark[], timestamp: number): ProcessedHandData {
    const wrist = landmarks[0]
    const thumbMcp = landmarks[2]
    const thumbIp = landmarks[3]
    const thumbTip = landmarks[4]

    const indexMcp = landmarks[5]
    const indexPip = landmarks[6]
    const indexTip = landmarks[8]

    const middleMcp = landmarks[9]
    const middlePip = landmarks[10]
    const middleTip = landmarks[12]

    const ringMcp = landmarks[13]
    const ringPip = landmarks[14]
    const ringTip = landmarks[16]

    const pinkyMcp = landmarks[17]
    const pinkyPip = landmarks[18]
    const pinkyTip = landmarks[20]

    // Palm scale for normalization
    const palmScale = Math.max(0.01, dist2D(wrist, middleMcp))

    // Finger extension detection
    const isFingerExtended = (tip: Landmark, pip: Landmark, mcp: Landmark): boolean => {
      const tipDist = dist2D(wrist, tip)
      const pipDist = dist2D(wrist, pip)
      const mcpDist = dist2D(wrist, mcp)
      return tipDist > pipDist && tipDist > mcpDist * 1.15
    }

    const thumbExtended = dist2D(thumbTip, pinkyMcp) > palmScale * 1.1
    const indexExtended = isFingerExtended(indexTip, indexPip, indexMcp)
    const middleExtended = isFingerExtended(middleTip, middlePip, middleMcp)
    const ringExtended = isFingerExtended(ringTip, ringPip, ringMcp)
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPip, pinkyMcp)

    const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(
      Boolean,
    ).length
    const handOpenness = extendedCount / 5.0

    // Pinch detection with smoothing & hysteresis
    const rawPinch = dist3D(thumbTip, indexTip) / (palmScale * 1.8)
    this.smoothedPinchDist = this.smoothedPinchDist * 0.4 + rawPinch * 0.6

    if (!this.pinchActive && this.smoothedPinchDist < this.PINCH_START_THRESHOLD) {
      this.pinchActive = true
    } else if (this.pinchActive && this.smoothedPinchDist > this.PINCH_RELEASE_THRESHOLD) {
      this.pinchActive = false
    }

    // Palm center
    const palmCenter = {
      x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
      y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
      z: (wrist.z + indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 5,
    }

    // Thumb direction (for thumbs up/down)
    const thumbPointsUp = thumbTip.y < thumbIp.y && thumbTip.y < thumbMcp.y
    const thumbPointsDown = thumbTip.y > thumbIp.y && thumbTip.y > thumbMcp.y

    // Swipe detection with cooldown
    let swipeGesture: GestureType | null = null
    if (this.prevIndexTip && (timestamp - this.lastSwipeTime) > this.SWIPE_COOLDOWN_MS) {
      const dt = Math.max(1, timestamp - this.prevIndexTip.timestamp)
      const vx = ((indexTip.x - this.prevIndexTip.x) / dt) * 1000
      const vy = ((indexTip.y - this.prevIndexTip.y) / dt) * 1000

      const dx = Math.abs(indexTip.x - this.prevIndexTip.x)
      const dy = Math.abs(indexTip.y - this.prevIndexTip.y)

      if (Math.abs(vx) > 3.0 && dx > 0.08 && Math.abs(vx) > Math.abs(vy) * 1.5) {
        swipeGesture = vx > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT
        this.lastSwipeTime = timestamp
      } else if (Math.abs(vy) > 3.0 && dy > 0.06 && Math.abs(vy) > Math.abs(vx) * 1.5) {
        swipeGesture = vy > 0 ? GestureType.SWIPE_DOWN : GestureType.SWIPE_UP
        this.lastSwipeTime = timestamp
      }
    }
    this.prevIndexTip = { x: indexTip.x, y: indexTip.y, timestamp }

    // Cooldown management
    if (this.gestureCooldown > 0) {
      this.gestureCooldown = Math.max(0, this.gestureCooldown - (timestamp - (this.prevIndexTip?.timestamp ?? timestamp)))
    }

    // Gesture classification
    let gesture: GestureType = GestureType.NONE
    let confidence = 0.85

    if (swipeGesture) {
      gesture = swipeGesture
      confidence = 0.92

    } else if (this.pinchActive) {
      gesture = GestureType.PINCH
      confidence = Math.min(1, 1.2 - this.smoothedPinchDist * 5)

    } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbPointsUp) {
      gesture = GestureType.THUMBS_UP
      confidence = 0.91

    } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbPointsDown) {
      gesture = GestureType.THUMBS_DOWN
      confidence = 0.91

    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && thumbExtended) {
      gesture = GestureType.PEACE_SIGN
      confidence = 0.88

    } else if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gesture = GestureType.FINGER_GUN
      confidence = 0.89

    } else if (extendedCount === 0 || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended)) {
      gesture = GestureType.FIST
      confidence = 0.9

    } else if (extendedCount >= 4) {
      if (this.prevIndexTip) {
        const lateralSpeed = Math.abs(((palmCenter.x - (this.prevIndexTip?.x ?? palmCenter.x)))) * 60
        if (lateralSpeed > 0.15 && extendedCount === 5) {
          gesture = GestureType.WAVE
          confidence = 0.87
        } else {
          gesture = GestureType.OPEN_PALM
          confidence = 0.95
        }
      } else {
        gesture = GestureType.OPEN_PALM
        confidence = 0.95
      }

    } else if (indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      gesture = GestureType.THREE_FINGERS
      confidence = 0.88

    } else if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      gesture = GestureType.FOUR_FINGERS
      confidence = 0.87

    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      gesture = GestureType.TWO_FINGER
      confidence = 0.9

    } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      gesture = GestureType.POINT
      confidence = 0.93
    }

    return {
      gesture,
      confidence,
      pinchDistance: this.smoothedPinchDist,
      isPinching: this.pinchActive,
      isGrabbing: gesture === GestureType.FIST || (this.pinchActive && extendedCount <= 2),
      handOpenness,
      palmCenter,
      indexTip: { x: indexTip.x, y: indexTip.y, z: indexTip.z ?? 0 },
      thumbTip: { x: thumbTip.x, y: thumbTip.y, z: thumbTip.z ?? 0 },
      extendedFingers: {
        thumb: thumbExtended,
        index: indexExtended,
        middle: middleExtended,
        ring: ringExtended,
        pinky: pinkyExtended,
      },
    }
  }

  reset(): void {
    this.prevIndexTip = null
    this.smoothedPinchDist = 0.1
    this.pinchActive = false
    this.gestureCooldown = 0
    this.lastSwipeTime = 0
  }
}

export const landmarkProcessor = new HandLandmarkProcessor()
