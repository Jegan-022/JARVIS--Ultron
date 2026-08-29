import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { HandTrackingResult, Landmark } from '../types/hand'

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null
  private isInitializing = false
  private isReady = false
  private lastVideoTime = -1

  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return
    this.isInitializing = true

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
      )

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      })

      this.isReady = true
    } catch (error) {
      console.warn('GPU HandLandmarker initialization failed, falling back to CPU:', error)
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
        )
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
        this.isReady = true
      } catch (cpuError) {
        console.error('HandLandmarker initialization failed completely:', cpuError)
        this.isReady = false
        throw cpuError
      }
    } finally {
      this.isInitializing = false
    }
  }

  processVideoFrame(video: HTMLVideoElement, timestamp: number): HandTrackingResult {
    if (!this.isReady || !this.handLandmarker || video.readyState < 2) {
      return {
        detected: false,
        landmarks: null,
        handedness: 'Unknown',
        confidence: 0,
        lastUpdated: timestamp,
      }
    }

    if (video.currentTime === this.lastVideoTime) {
      // Frame has not updated yet
      return {
        detected: false,
        landmarks: null,
        handedness: 'Unknown',
        confidence: 0,
        lastUpdated: timestamp,
      }
    }

    this.lastVideoTime = video.currentTime

    try {
      const results = this.handLandmarker.detectForVideo(video, timestamp)

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0]
        const handedness =
          results.handedness && results.handedness.length > 0
            ? (results.handedness[0][0]?.categoryName as 'Left' | 'Right') || 'Right'
            : 'Right'
        const score = results.handedness?.[0]?.[0]?.score ?? 0.85

        // Mirror coordinates for intuitive selfie-camera interaction (x = 1 - x)
        const mirroredLandmarks: Landmark[] = rawLandmarks.map((lm) => ({
          x: 1 - lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }))

        return {
          detected: true,
          landmarks: mirroredLandmarks,
          handedness,
          confidence: score,
          lastUpdated: timestamp,
        }
      }
    } catch (err) {
      console.warn('Error detecting hand landmarks:', err)
    }

    return {
      detected: false,
      landmarks: null,
      handedness: 'Unknown',
      confidence: 0,
      lastUpdated: timestamp,
    }
  }

  isInitialized(): boolean {
    return this.isReady
  }
}

export const handTracker = new HandTracker()
