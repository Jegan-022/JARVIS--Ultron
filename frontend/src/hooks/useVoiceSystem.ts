import { useEffect, useRef } from 'react'
import { voiceManager } from '../voice/VoiceManager'
import { processVoiceCommand } from '../voice/VoiceCommands'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

export function useVoiceSystem() {
  const addTranscript = useSystemStore((s) => s.addTranscript)
  const setVoiceStatus = useSystemStore((s) => s.setVoiceStatus)
  const setSubsystem = useSystemStore((s) => s.setSubsystem)
  const booted = useSystemStore((s) => s.booted)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const unsubTranscript = voiceManager.onTranscript((text, isFinal) => {
      if (!isMounted.current) return
      if (isFinal) {
        addTranscript('user', text)
      }
    })

    const unsubCommand = voiceManager.onCommand(async (command) => {
      if (!isMounted.current) return

      // Don't process commands while JARVIS is speaking (prevents feedback loop)
      if (voiceManager.isSpeaking()) return

      setVoiceStatus('processing')
      setSubsystem('ai', SubsystemStatus.ONLINE)

      try {
        const result = await processVoiceCommand(command)
        if (result.spokenResponse) {
          addTranscript('jarvis', result.spokenResponse)
        }
      } catch (err) {
        console.error('Error executing voice command:', err)
        addTranscript('jarvis', `My apologies, sir. I encountered an error processing: ${command}`)
      } finally {
        if (isMounted.current) {
          setVoiceStatus('listening')
          setSubsystem('ai', SubsystemStatus.ONLINE)
        }
      }
    })

    const unsubError = voiceManager.onError((err) => {
      console.warn('Voice system error:', err)
      if (isMounted.current) {
        setSubsystem('voice', SubsystemStatus.STANDBY)
      }
    })

    // Track speaking state for HUD indicator
    const unsubSpeaking = voiceManager.onSpeakingChange((speaking) => {
      if (!isMounted.current) return
      setVoiceStatus(speaking ? 'speaking' : 'listening')
    })

    return () => {
      isMounted.current = false
      unsubTranscript()
      unsubCommand()
      unsubError()
      unsubSpeaking()
    }
  }, [addTranscript, setVoiceStatus, setSubsystem])

  // Auto-start voice listening after boot completes
  useEffect(() => {
    if (!booted) return
    // Small delay to let boot animation finish
    const timer = window.setTimeout(() => {
      // Don't auto-start mic — let user explicitly enable it for privacy
      setSubsystem('voice', SubsystemStatus.STANDBY)
      setSubsystem('ai', SubsystemStatus.ONLINE)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [booted, setSubsystem])
}
