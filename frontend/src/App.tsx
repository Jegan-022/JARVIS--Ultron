import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { UniverseCanvas } from './components/UniverseCanvas'
import { BootSequence } from './ui/BootSequence'
import { DebugOverlay, Hud } from './ui/Hud'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useBackendLink } from './hooks/useBackendLink'
import { useHandTracking } from './hooks/useHandTracking'
import { useVoiceSystem } from './hooks/useVoiceSystem'
import { useSystemStore } from './stores/systemStore'

export default function App() {
  useKeyboardControls()
  useBackendLink()
  useHandTracking()
  useVoiceSystem()

  const booted = useSystemStore((s) => s.booted)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  if (!ready) {
    return <div className="app-shell" />
  }

  return (
    <div className="app-shell">
      <UniverseCanvas />
      {booted ? <Hud /> : null}
      {booted ? <DebugOverlay /> : null}
      <AnimatePresence>{booted ? null : <BootSequence key="boot" />}</AnimatePresence>
    </div>
  )
}
