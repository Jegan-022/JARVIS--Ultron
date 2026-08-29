import { useState } from 'react'
import { SceneManager } from '../scenes/SceneManager'
import { useSystemStore } from '../stores/systemStore'
import { useUniverseStore } from '../stores/universeStore'
import { useGestureStore } from '../stores/gestureStore'
import { SubsystemStatus } from '../types/system'
import type { SceneId as SceneIdType } from '../types/scene'
import { HandVisualizer } from './HandVisualizer'
import { voiceManager } from '../voice/VoiceManager'
import { processVoiceCommand } from '../voice/VoiceCommands'
import {
  Mic,
  MicOff,
  Thermometer,
  Droplets,
  Zap,
} from 'lucide-react'

function StatusDot({ status }: { status: SubsystemStatus }) {
  const tone =
    status === SubsystemStatus.ONLINE || status === SubsystemStatus.ACTIVE
      ? 'online'
      : status === SubsystemStatus.ERROR
        ? 'error'
        : 'standby'
  return <span className={`status-dot ${tone}`} />
}

export function Hud() {
  const subsystems = useSystemStore((s) => s.subsystems)
  const setSubsystem = useSystemStore((s) => s.setSubsystem)
  const metrics = useSystemStore((s) => s.metrics)
  const voiceStatus = useSystemStore((s) => s.voiceStatus)
  const setVoiceStatus = useSystemStore((s) => s.setVoiceStatus)
  const transcripts = useSystemStore((s) => s.transcripts)
  const devices = useSystemStore((s) => s.devices)
  const sensorData = useSystemStore((s) => s.sensorData)

  const selected = useUniverseStore((s) => s.selectedObject)
  const sceneId = useUniverseStore((s) => s.sceneId)
  const paused = useUniverseStore((s) => s.paused)
  const fps = useUniverseStore((s) => s.fps)

  const currentGesture = useGestureStore((s) => s.currentGesture)
  const interactionState = useGestureStore((s) => s.interactionState)
  const handResult = useGestureStore((s) => s.handResult)
  const cursor = useGestureStore((s) => s.cursor)

  const [micActive, setMicActive] = useState(false)
  const [activeTab, setActiveTab] = useState<'activity' | 'devices'>('activity')

  const toggleMic = () => {
    if (micActive) {
      voiceManager.stopListening()
      setMicActive(false)
      setVoiceStatus('idle')
      setSubsystem('voice', SubsystemStatus.STANDBY)
    } else {
      const ok = voiceManager.startListening()
      if (ok) {
        setMicActive(true)
        setVoiceStatus('listening')
        setSubsystem('voice', SubsystemStatus.ONLINE)
      }
    }
  }

  const scenes = SceneManager.getScenes()

  return (
    <div className="hud" aria-hidden={false}>
      {/* TOP HEADER */}
      <header className="hud-top">
        <div className="flex items-center gap-3">
          <div>
            <p className="hud-mark">ULTRON CORE</p>
            <p className="hud-sub">MULTIMODAL 3D SPATIAL AI INTERFACE</p>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4 bg-slate-950/70 p-1 rounded border border-cyan-500/20 backdrop-blur-md">
            {scenes.map((s) => (
              <button
                key={s.id}
                onClick={() => SceneManager.switch(s.id as SceneIdType)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded transition-all ${
                  sceneId === s.id
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="hud-top-right flex items-center gap-3">
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-semibold border transition-all ${
              micActive
                ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-md shadow-red-500/20 animate-pulse'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-500/50'
            }`}
            title="Toggle Microphone & Voice Assistant"
          >
            {micActive ? <Mic className="w-3.5 h-3.5 text-red-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{micActive ? 'WAKE: ULTRON' : 'MIC STANDBY'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span>CORE</span>
            <StatusDot status={SubsystemStatus.ONLINE} />
            <strong className="text-cyan-400">ONLINE</strong>
          </div>
        </div>
      </header>

      {/* LEFT SIDEBAR: SUBSYSTEMS & VISION TRACKER */}
      <aside className="hud-left flex flex-col gap-2.5 max-w-[220px]">
        <div className="bg-slate-950/80 backdrop-blur-md p-2.5 rounded-lg border border-cyan-500/20 shadow-lg">
          <p className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider mb-2 border-b border-cyan-500/15 pb-1">
            SUBSYSTEM TELEMETRY
          </p>
          <div className="flex flex-col gap-1">
            <Row
              label="VISION"
              status={handResult.detected ? SubsystemStatus.ONLINE : subsystems.vision}
              detail={handResult.detected ? `${handResult.handedness} HAND` : 'STANDBY'}
            />
            <Row
              label="VOICE"
              status={micActive ? SubsystemStatus.ONLINE : subsystems.voice}
              detail={micActive ? voiceStatus.toUpperCase() : 'STANDBY'}
            />
            <Row label="AI CORE" status={subsystems.ai || SubsystemStatus.ONLINE} detail="ONLINE" />
            <Row label="SPATIAL" status={SubsystemStatus.ONLINE} detail="60 FPS" />
            <Row
              label="NETWORK"
              status={subsystems.network}
              detail={subsystems.network === SubsystemStatus.ONLINE ? 'CORE LINK' : 'LOCAL'}
            />
            <Row label="DEVICES" status={SubsystemStatus.ONLINE} detail={`${devices.length} NODES`} />
          </div>
        </div>

        {/* Live 2D MediaPipe Skeleton HUD Visualizer */}
        <HandVisualizer />
      </aside>

      {/* RIGHT SIDEBAR: MULTIMODAL ACTIVITY, SMART HOME, QUICK TOOLS */}
      <aside className="hud-right max-w-[260px] flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                activeTab === 'activity' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              ACTIVITY
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                activeTab === 'devices' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              DEVICES
            </button>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">{fps || 60} FPS</span>
        </div>

        {activeTab === 'activity' && (
          <>
            <dl className="metrics">
              <div>
                <dt>SCENE</dt>
                <dd>{sceneId.replaceAll('_', ' ').toUpperCase()}</dd>
              </div>
              <div>
                <dt>GESTURE</dt>
                <dd>{currentGesture}</dd>
              </div>
              <div>
                <dt>STATE</dt>
                <dd>{interactionState}</dd>
              </div>
              <div>
                <dt>PINCH</dt>
                <dd>{(cursor.pinchDistance * 100).toFixed(0)}%</dd>
              </div>
              <div>
                <dt>CPU</dt>
                <dd>{metrics?.cpuPercent != null ? `${metrics.cpuPercent.toFixed(0)}%` : '—'}</dd>
              </div>
              <div>
                <dt>MEM</dt>
                <dd>{metrics?.memoryPercent != null ? `${metrics.memoryPercent.toFixed(0)}%` : '—'}</dd>
              </div>
            </dl>

            {selected ? (
              <div className="object-card">
                <div className="flex items-center justify-between">
                  <p className="object-name">{selected.name.toUpperCase()}</p>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/40">
                    LOCKED
                  </span>
                </div>
                <p className="text-[10px] text-cyan-400 font-mono mt-0.5">TYPE: {selected.type.toUpperCase()}</p>
                <p className="object-desc">{selected.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selected.actions.map((act) => (
                    <button
                      key={act}
                      onClick={() => processVoiceCommand(`${act} ${selected.name}`)}
                      className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 text-[9px] rounded font-mono"
                    >
                      {act.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="panel-idle text-[10px] font-mono">
                No 3D entity locked. Point or pinch any planet/node to inspect.
              </p>
            )}
          </>
        )}

        {activeTab === 'devices' && (
          <div className="flex flex-col gap-2">
            {/* Real-time ESP32 Sensor HUD Card */}
            <div className="bg-slate-900/80 p-2 rounded border border-cyan-500/25 flex items-center justify-around font-mono text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Thermometer className="w-4 h-4 text-amber-400" />
                <span>{sensorData.temperature.toFixed(1)}°C</span>
              </div>
              <div className="h-4 w-px bg-cyan-500/30" />
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>{sensorData.humidity.toFixed(0)}%</span>
              </div>
            </div>

            {/* Smart Home Devices List */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-cyan-500/20 text-[11px] font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${dev.state === 'on' ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-slate-200">{dev.name}</span>
                  </div>
                  <button
                    onClick={() =>
                      processVoiceCommand(`Turn ${dev.state === 'on' ? 'off' : 'on'} the ${dev.name}`)
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dev.state === 'on'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {dev.state.toUpperCase()}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {paused ? <p className="phase-note">SIMULATION PAUSED (Press Space to resume)</p> : null}
      </aside>

      {/* BOTTOM FOOTER: REAL-TIME VOICE TRANSCRIPTS & MULTIMODAL CHAT STREAM */}
      <footer className="hud-bottom flex flex-col gap-1 max-h-28 overflow-hidden font-mono">
        <div className="flex flex-col gap-1 overflow-y-auto pr-2 max-h-20">
          {transcripts.slice(-2).map((t) => (
            <p key={t.id} className="flex items-baseline gap-2 text-xs leading-relaxed">
              <span className={t.speaker === 'user' ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                {t.speaker === 'user' ? 'OPERATOR:' : 'ULTRON:'}
              </span>
              <span className="text-slate-200">{t.text}</span>
            </p>
          ))}
        </div>
      </footer>
    </div>
  )
}

function Row({
  label,
  status,
  detail,
}: {
  label: string
  status: SubsystemStatus
  detail: string
}) {
  return (
    <div className="sys-row">
      <StatusDot status={status} />
      <span className="sys-label">{label}</span>
      <span className="sys-detail">{detail}</span>
    </div>
  )
}

export function DebugOverlay() {
  const enabled = useUniverseStore((s) => s.debugEnabled)
  const fps = useUniverseStore((s) => s.fps)
  const state = useUniverseStore((s) => s.interactionState)
  const selected = useUniverseStore((s) => s.selectedObject)
  const camera = useUniverseStore((s) => s.cameraPosition)
  const ws = useSystemStore((s) => s.websocketStatus)
  const ai = useSystemStore((s) => s.subsystems.ai)
  const sceneId = useUniverseStore((s) => s.sceneId)

  const handResult = useGestureStore((s) => s.handResult)
  const currentGesture = useGestureStore((s) => s.currentGesture)
  const gestureConfidence = useGestureStore((s) => s.gestureConfidence)
  const cursor = useGestureStore((s) => s.cursor)

  if (!enabled) return null

  return (
    <pre className="debug-overlay">
      {`DEBUG OVERLAY [F3]
FPS: ${fps}
SCENE: ${sceneId}
HAND DETECTED: ${handResult.detected ? `YES (${handResult.handedness})` : 'NO'}
GESTURE: ${currentGesture} (CONF: ${(gestureConfidence * 100).toFixed(0)}%)
STATE: ${state}
PINCH DISTANCE: ${(cursor.pinchDistance * 100).toFixed(1)}% | PINCHING: ${cursor.isPinching ? 'YES' : 'NO'}
CURSOR NORM: [${cursor.x.toFixed(3)}, ${cursor.y.toFixed(3)}]
OBJECT: ${selected?.id ?? 'NONE'}
CAMERA: [${camera.map((n) => n.toFixed(1)).join(', ')}]
WS CORE: ${ws}
AI STATUS: ${ai}`}
    </pre>
  )
}
