import { useEffect, useRef } from 'react'
import { voiceManager } from '../voice/VoiceManager'
import { processVoiceCommand } from '../voice/VoiceCommands'
import { useSystemStore } from '../stores/systemStore'
import { SubsystemStatus } from '../types/system'

export function useVoiceSystem() {
  const addTranscript = useSystemStore((s) => s.addTranscript)
  const setVoiceStatus = useSystemStore((s) => s.setVoiceStatus)
  const setSubsystem = useSystemStore((s) => s.setSubsystem)
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
      setVoiceStatus('processing')
      setSubsystem('ai', SubsystemStatus.ONLINE)

      try {
        const result = await processVoiceCommand(command)
        if (result.spokenResponse) {
          addTranscript('ultron', result.spokenResponse)
        }
      } catch (err) {
        console.error('Error executing voice command:', err)
        addTranscript('ultron', `Command execution failure: ${command}`)
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

    return () => {
      isMounted.current = false
      unsubTranscript()
      unsubCommand()
      unsubError()
    }
  }, [addTranscript, setVoiceStatus, setSubsystem])
}
