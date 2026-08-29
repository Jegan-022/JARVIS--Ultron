import { create } from 'zustand'
import { GestureType, InteractionState } from '../types/gestures'
import type { HandTrackingResult, VirtualCursorState } from '../types/hand'

interface GestureStoreState {
  cameraEnabled: boolean
  cameraStatus: 'offline' | 'requesting' | 'online' | 'error' | 'denied'
  errorMessage: string | null
  handResult: HandTrackingResult
  currentGesture: GestureType
  gestureConfidence: number
  interactionState: InteractionState
  cursor: VirtualCursorState
  smoothedPointer: { x: number; y: number; z: number }

  setCameraEnabled: (enabled: boolean) => void
  setCameraStatus: (status: 'offline' | 'requesting' | 'online' | 'error' | 'denied', error?: string | null) => void
  setHandResult: (result: HandTrackingResult) => void
  setGesture: (gesture: GestureType, confidence: number) => void
  setInteractionState: (state: InteractionState) => void
  setCursor: (cursor: Partial<VirtualCursorState>) => void
  setSmoothedPointer: (pos: { x: number; y: number; z: number }) => void
}

const initialHandResult: HandTrackingResult = {
  detected: false,
  landmarks: null,
  handedness: 'Unknown',
  confidence: 0,
  lastUpdated: 0,
}

const initialCursor: VirtualCursorState = {
  x: 0.5,
  y: 0.5,
  z: 0,
  worldPosition: [0, 0, 0],
  active: false,
  visible: false,
  pinchDistance: 1,
  isPinching: false,
  isGrabbing: false,
}

export const useGestureStore = create<GestureStoreState>((set) => ({
  cameraEnabled: false,
  cameraStatus: 'offline',
  errorMessage: null,
  handResult: initialHandResult,
  currentGesture: GestureType.NONE,
  gestureConfidence: 0,
  interactionState: InteractionState.IDLE,
  cursor: initialCursor,
  smoothedPointer: { x: 0.5, y: 0.5, z: 0 },

  setCameraEnabled: (cameraEnabled) => set({ cameraEnabled }),
  setCameraStatus: (cameraStatus, errorMessage = null) => set({ cameraStatus, errorMessage }),
  setHandResult: (handResult) => set({ handResult }),
  setGesture: (currentGesture, gestureConfidence) => set({ currentGesture, gestureConfidence }),
  setInteractionState: (interactionState) => set({ interactionState }),
  setCursor: (cursor) => set((s) => ({ cursor: { ...s.cursor, ...cursor } })),
  setSmoothedPointer: (smoothedPointer) => set({ smoothedPointer }),
}))
