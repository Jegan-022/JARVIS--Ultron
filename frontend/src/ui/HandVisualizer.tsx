import { useEffect, useRef } from 'react'
import { HAND_CONNECTIONS } from '../types/hand'
import { useGestureStore } from '../stores/gestureStore'
import { GestureType } from '../types/gestures'
import { Camera, CameraOff, Activity } from 'lucide-react'

export function HandVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraEnabled = useGestureStore((s) => s.cameraEnabled)
  const setCameraEnabled = useGestureStore((s) => s.setCameraEnabled)
  const cameraStatus = useGestureStore((s) => s.cameraStatus)
  const handResult = useGestureStore((s) => s.handResult)
  const currentGesture = useGestureStore((s) => s.currentGesture)
  const gestureConfidence = useGestureStore((s) => s.gestureConfidence)
  const interactionState = useGestureStore((s) => s.interactionState)
  const cursor = useGestureStore((s) => s.cursor)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear frame
    ctx.clearRect(0, 0, width, height)

    // Holographic grid background
    ctx.fillStyle = 'rgba(6, 12, 22, 0.85)'
    ctx.fillRect(0, 0, width, height)

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)'
    ctx.lineWidth = 1
    const gridSize = 16
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    if (!handResult.detected || !handResult.landmarks) {
      // Draw idle scanning radar
      const t = Date.now() * 0.002
      const cx = width / 2
      const cy = height / 2
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)'
      ctx.beginPath()
      ctx.arc(cx, cy, 32 + Math.sin(t) * 4, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)'
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(
        cameraStatus === 'online' ? 'SCANNING SENSORS...' : 'VISION OFFLINE',
        cx,
        cy + 4,
      )
      return
    }

    const landmarks = handResult.landmarks

    // Determine color theme based on gesture
    let strokeColor = 'rgba(245, 158, 11, 0.75)'
    let shadowGlow = '#f59e0b'

    if (currentGesture === GestureType.THUMBS_UP || currentGesture === GestureType.PEACE_SIGN) {
      strokeColor = 'rgba(16, 185, 129, 0.8)'
      shadowGlow = '#10b981'
    } else if (currentGesture === GestureType.PINCH || cursor.isPinching) {
      strokeColor = 'rgba(56, 189, 248, 0.85)'
      shadowGlow = '#38bdf8'
    } else if (currentGesture === GestureType.FIST || cursor.isGrabbing) {
      strokeColor = 'rgba(239, 68, 68, 0.8)'
      shadowGlow = '#ef4444'
    }

    // Draw skeletal connections
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.8
    ctx.shadowColor = shadowGlow
    ctx.shadowBlur = 5

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx]
      const p2 = landmarks[endIdx]
      if (!p1 || !p2) continue

      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    }

    // Draw joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i]
      const isFingertip = [4, 8, 12, 16, 20].includes(i)
      const isIndexTip = i === 8

      ctx.beginPath()
      const radius = isIndexTip ? 4.5 : isFingertip ? 3.5 : 2
      ctx.arc(p.x * width, p.y * height, radius, 0, Math.PI * 2)

      if (isIndexTip) {
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 8
      } else if (isFingertip) {
        ctx.fillStyle = '#f59e0b'
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = 6
      } else {
        ctx.fillStyle = '#38bdf8'
        ctx.shadowColor = '#38bdf8'
        ctx.shadowBlur = 2
      }
      ctx.fill()
    }

    ctx.shadowBlur = 0
  }, [handResult, cameraStatus, currentGesture, cursor])

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg border border-amber-500/25 bg-slate-950/80 backdrop-blur-md shadow-lg shadow-black/40 text-xs font-mono">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-1.5">
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wider">
          <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>VISION ARRAY</span>
        </div>
        <button
          onClick={() => setCameraEnabled(!cameraEnabled)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
            cameraEnabled
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Webcam Hand Tracking"
        >
          {cameraEnabled ? (
            <>
              <Camera className="w-3 h-3 text-amber-400" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <CameraOff className="w-3 h-3 text-slate-500" />
              <span>OFFLINE</span>
            </>
          )}
        </button>
      </div>

      {/* Holographic Canvas */}
      <div className="relative rounded overflow-hidden border border-amber-500/30 w-48 h-36 mx-auto bg-black/50">
        <canvas ref={canvasRef} width={192} height={144} className="w-full h-full block" />

        {/* HUD status pill */}
        <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded border border-amber-500/30 text-[9px] text-amber-300">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cameraStatus === 'online'
                ? handResult.detected
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
                : 'bg-red-500'
            }`}
          />
          <span className="uppercase">{handResult.detected ? `${handResult.handedness} HAND` : cameraStatus}</span>
        </div>

        {/* Pinch meter */}
        {handResult.detected && (
          <div className="absolute bottom-1 right-1.5 flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded border border-amber-500/30 text-[9px]">
            <span className="text-slate-400">PINCH:</span>
            <span className={cursor.isPinching ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
              {(cursor.pinchDistance * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Gesture telemetry details */}
      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-amber-500/15">
        <div>
          <span className="text-slate-500">GESTURE: </span>
          <span className="text-amber-300 font-semibold">{currentGesture}</span>
        </div>
        <div>
          <span className="text-slate-500">CONF: </span>
          <span className="text-amber-300">{(gestureConfidence * 100).toFixed(0)}%</span>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">STATE: </span>
          <span className="text-amber-400 font-semibold">{interactionState}</span>
        </div>
      </div>
    </div>
  )
}
