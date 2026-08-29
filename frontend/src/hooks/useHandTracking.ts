import { useEffect, useRef } from 'react'
import { webcamManager } from '../camera/WebcamManager'
import { gestureStateMachine } from '../gestures/GestureStateMachine'
import { landmarkProcessor } from '../gestures/HandLandmarkProcessor'
import { handTracker } from '../gestures/HandTracker'
import { useGestureStore } from '../stores/gestureStore'
import { useSystemStore } from '../stores/systemStore'
import { useUniverseStore } from '../stores/universeStore'

export function useHandTracking() {
  const cameraEnabled = useGestureStore((s) => s.cameraEnabled)
  const setCameraStatus = useGestureStore((s) => s.setCameraStatus)
  const setHandResult = useGestureStore((s) => s.setHandResult)
  const setGesture = useGestureStore((s) => s.setGesture)
  const setInteractionState = useGestureStore((s) => s.setInteractionState)
  const setCursor = useGestureStore((s) => s.setCursor)
  const setSmoothedPointer = useGestureStore((s) => s.setSmoothedPointer)
  const selectedObjectId = useUniverseStore((s) => s.selectedObjectId)
  const voiceState = useSystemStore((s) => s.voiceStatus)

  const rafRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!cameraEnabled) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      webcamManager.stop()
      setCameraStatus('offline')
      return
    }

    let isMounted = true
    setCameraStatus('requesting')

    async function startPipeline() {
      try {
        await handTracker.initialize()
        const video = await webcamManager.start()
        if (!isMounted) return

        videoRef.current = video
        setCameraStatus('online')

        const loop = (timestamp: number) => {
          if (!isMounted) return

          if (video.readyState >= 2) {
            const result = handTracker.processVideoFrame(video, timestamp)
            setHandResult(result)

            if (result.detected && result.landmarks) {
              const processed = landmarkProcessor.process(result.landmarks, timestamp)
              const smResult = gestureStateMachine.update(
                processed,
                voiceState === 'listening',
              )

              setGesture(processed.gesture, processed.confidence)
              setInteractionState(smResult.state)
              setSmoothedPointer(smResult.cursorPos)

              setCursor({
                x: smResult.cursorPos.x,
                y: smResult.cursorPos.y,
                z: smResult.cursorPos.z,
                active: true,
                visible: true,
                pinchDistance: processed.pinchDistance,
                isPinching: smResult.isPinching,
                isGrabbing: smResult.isGrabbing,
              })
            } else {
              gestureStateMachine.update(null)
              setGesture('NONE', 0)
              setInteractionState('IDLE')
              setCursor({ active: false, visible: false, isPinching: false, isGrabbing: false })
            }
          }

          rafRef.current = requestAnimationFrame(loop)
        }

        rafRef.current = requestAnimationFrame(loop)
      } catch (err: unknown) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : 'Camera failed to start'
        console.error('Camera/HandTracking error:', err)
        setCameraStatus('error', msg)
      }
    }

    startPipeline()

    return () => {
      isMounted = false
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      webcamManager.stop()
    }
  }, [
    cameraEnabled,
    setCameraStatus,
    setHandResult,
    setGesture,
    setInteractionState,
    setCursor,
    setSmoothedPointer,
    voiceState,
    selectedObjectId,
  ])
}
