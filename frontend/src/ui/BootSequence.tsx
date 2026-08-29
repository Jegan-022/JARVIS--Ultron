import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

const LINES = [
  { key: 'spatial', label: 'SPATIAL ENGINE', status: SubsystemStatus.ONLINE },
  { key: 'vision', label: 'VISION PIPELINE', status: SubsystemStatus.ONLINE },
  { key: 'voice', label: 'VOICE ASSISTANT', status: SubsystemStatus.ONLINE },
  { key: 'ai', label: 'AI REASONING CORE', status: SubsystemStatus.ONLINE },
  { key: 'network', label: 'CORE NETWORK', status: 'probe' as const },
] as const

export function BootSequence() {
  const network = useSystemStore((s) => s.subsystems.network)
  const setBooted = useSystemStore((s) => s.setBooted)
  const setSubsystem = useSystemStore((s) => s.setSubsystem)
  const [visibleLines, setVisibleLines] = useState(0)
  const [showTitle, setShowTitle] = useState(true)

  const skipBoot = () => {
    LINES.forEach((line) => {
      if (line.key !== 'network') {
        setSubsystem(line.key, SubsystemStatus.ONLINE)
      }
    })
    setBooted(true)
  }

  useEffect(() => {
    const timers: number[] = []
    timers.push(window.setTimeout(() => setShowTitle(true), 50))
    LINES.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleLines(index + 1)
          const line = LINES[index]
          if (line.key === 'network') return
          setSubsystem(line.key, line.status)
        }, 300 + index * 220),
      )
    })
    timers.push(
      window.setTimeout(() => {
        setBooted(true)
      }, 300 + LINES.length * 220 + 250),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [setBooted, setSubsystem])

  return (
    <motion.div
      className="boot-overlay cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={skipBoot}
    >
      <div className="boot-panel">
        {showTitle ? (
          <div className="flex items-center justify-between mb-6">
            <p className="boot-title m-0 text-cyan-400 font-mono">INITIALIZING ULTRON...</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                skipBoot()
              }}
              className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono rounded"
            >
              SKIP [ENTER]
            </button>
          </div>
        ) : null}
        <ul className="boot-lines">
          {LINES.slice(0, visibleLines).map((line) => {
            const status = line.key === 'network' ? network : line.status
            const label =
              status === SubsystemStatus.ONLINE
                ? 'ONLINE'
                : status === SubsystemStatus.OFFLINE
                  ? 'OFFLINE'
                  : 'STANDBY'
            return (
              <li key={line.key}>
                <span>{line.label}</span>
                <span className="boot-dots" />
                <span className={status === SubsystemStatus.ONLINE ? 'ok text-emerald-400' : 'wait text-cyan-400'}>
                  {label}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center justify-between mt-6 text-[11px] text-slate-400 font-mono">
          <span>Multimodal 3D Spatial Computing Core</span>
          <span className="text-cyan-400/80 underline text-[10px]">Click anywhere to enter</span>
        </div>
      </div>
    </motion.div>
  )
}
