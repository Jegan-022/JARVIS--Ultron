export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface HandTrackingResult {
  detected: boolean
  landmarks: Landmark[] | null
  worldLandmarks?: Landmark[] | null
  handedness: 'Left' | 'Right' | 'Unknown'
  confidence: number
  lastUpdated: number
}

export interface VirtualCursorState {
  x: number // Normalized 0..1 (0=left, 1=right)
  y: number // Normalized 0..1 (0=top, 1=bottom)
  z: number // Estimated depth
  worldPosition: [number, number, number]
  active: boolean
  visible: boolean
  pinchDistance: number
  isPinching: boolean
  isGrabbing: boolean
}

export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
]
