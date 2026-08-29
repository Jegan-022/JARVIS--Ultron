import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

const LINES = [
  { key: 'spatial', label: 'ARC REACTOR CORE', status: SubsystemStatus.ONLINE },
  { key: 'vision', label: 'NEURAL VISION ARRAY', status: SubsystemStatus.ONLINE },
  { key: 'voice', label: 'SPEECH SYNTHESIS ENGINE', status: SubsystemStatus.ONLINE },
  { key: 'ai', label: 'COGNITIVE REASONING MATRIX', status: SubsystemStatus.ONLINE },
  { key: 'camera', label: 'SPATIAL GESTURE TRACKER', status: SubsystemStatus.ONLINE },
  { key: 'network', label: 'STARK SECURE NETWORK', status: 'probe' as const },
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
        }, 300 + index * 280),
      )
    })
    timers.push(
      window.setTimeout(() => {
        setBooted(true)
      }, 300 + LINES.length * 280 + 350),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [setBooted, setSubsystem])

  return (
    <motion.div
      className="boot-overlay cursor-pointer"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      animate={{ opacity: 1 }}
      onClick={skipBoot}
    >
      <div className="boot-panel">
        {showTitle ? (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="boot-title m-0 text-amber-400 font-mono">J.A.R.V.I.S.</p>
              <p className="text-[10px] text-slate-400 font-mono tracking-[0.3em] mt-1">
                JUST A RATHER VERY INTELLIGENT SYSTEM
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                skipBoot()
              }}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-[10px] font-mono rounded"
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
          <span>STARK INDUSTRIES — ADVANCED AI COMMAND INTERFACE</span>
          <span className="text-amber-400/80 underline text-[10px]">Click anywhere to enter</span>
        </div>
      </div>
    </motion.div>
  )
}
