import { speechQueue, type SpeechPriority } from './SpeechSynthesisQueue'

export interface VoiceMessage {
  id: string
  speaker: 'user' | 'jarvis'
  text: string
  timestamp: number
}

// Window typing for Web Speech API
interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
        confidence: number
      }
      isFinal: boolean
    }
    length: number
  }
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognitionLike }
    webkitSpeechRecognition?: { new (): SpeechRecognitionLike }
  }
}

export class VoiceManager {
  private recognition: SpeechRecognitionLike | null = null
  private isListening = false
  private wakeWord = 'jarvis'
  private onTranscriptCallbacks: Array<(text: string, isFinal: boolean) => void> = []
  private onCommandCallbacks: Array<(command: string) => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []
  private onSpeakingChangeCallbacks: Array<(speaking: boolean) => void> = []
  private restartDebounce: number | null = null
  private minConfidence = 0.4 // Ignore very low-confidence results

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass()
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'

        this.recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i]
            const confidence = res[0].confidence ?? 1.0

            // Filter low-confidence interim results
            if (!res.isFinal && confidence < this.minConfidence) {
              continue
            }

            if (res.isFinal) {
              finalTranscript += res[0].transcript
            } else {
              interimTranscript += res[0].transcript
            }
          }

          const transcript = (finalTranscript || interimTranscript).trim()
          if (transcript) {
            this.onTranscriptCallbacks.forEach((cb) =>
              cb(transcript, !!finalTranscript),
            )

            if (finalTranscript) {
              this.handleFinalTranscript(finalTranscript)
            }
          }
        }

        this.recognition.onerror = (e) => {
          const error = e.error || 'STT error'
          // Don't report 'no-speech' or 'aborted' as real errors
          if (error === 'no-speech' || error === 'aborted') return
          console.warn('Speech recognition error:', error)
          this.onErrorCallbacks.forEach((cb) => cb(error))
        }

        this.recognition.onend = () => {
          // Debounced auto-restart if listening was not explicitly stopped
          if (this.isListening) {
            if (this.restartDebounce) {
              window.clearTimeout(this.restartDebounce)
            }
            this.restartDebounce = window.setTimeout(() => {
              if (!this.isListening) return
              try {
                this.recognition?.start()
              } catch {
                // ignore restart error
              }
            }, 200)
          }
        }
      }

      // Wire up speech queue speaking state callbacks
      speechQueue.onSpeakStart(() => {
        this.onSpeakingChangeCallbacks.forEach((cb) => cb(true))
      })
      speechQueue.onSpeakEnd(() => {
        this.onSpeakingChangeCallbacks.forEach((cb) => cb(false))
      })
    }
  }

  startListening(): boolean {
    if (!this.recognition) {
      this.onErrorCallbacks.forEach((cb) => cb('Speech recognition not supported in this browser'))
      return false
    }
    this.isListening = true
    try {
      this.recognition.start()
      return true
    } catch (e) {
      console.warn('SpeechRecognition start error:', e)
      return false
    }
  }

  stopListening(): void {
    this.isListening = false
    if (this.restartDebounce) {
      window.clearTimeout(this.restartDebounce)
      this.restartDebounce = null
    }
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // ignore
      }
    }
  }

  /**
   * Speak text through the priority queue system.
   * Supports priority levels: 'low', 'normal', 'high', 'urgent'
   */
  speak(text: string, priority: SpeechPriority = 'normal'): Promise<void> {
    return new Promise((resolve) => {
      speechQueue.enqueue(text, {
        priority,
        onEnd: resolve,
      })
    })
  }

  /**
   * Immediately interrupt current speech and speak this instead.
   */
  speakUrgent(text: string): Promise<void> {
    return this.speak(text, 'urgent')
  }

  /**
   * Cancel all queued and current speech.
   */
  cancelSpeech(): void {
    speechQueue.cancelAll()
  }

  /**
   * Check if JARVIS is currently speaking.
   */
  isSpeaking(): boolean {
    return speechQueue.getIsSpeaking()
  }

  onTranscript(cb: (text: string, isFinal: boolean) => void): () => void {
    this.onTranscriptCallbacks.push(cb)
    return () => {
      this.onTranscriptCallbacks = this.onTranscriptCallbacks.filter((c) => c !== cb)
    }
  }

  onCommand(cb: (command: string) => void): () => void {
    this.onCommandCallbacks.push(cb)
    return () => {
      this.onCommandCallbacks = this.onCommandCallbacks.filter((c) => c !== cb)
    }
  }

  onError(cb: (err: string) => void): () => void {
    this.onErrorCallbacks.push(cb)
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((c) => c !== cb)
    }
  }

  onSpeakingChange(cb: (speaking: boolean) => void): () => void {
    this.onSpeakingChangeCallbacks.push(cb)
    return () => {
      this.onSpeakingChangeCallbacks = this.onSpeakingChangeCallbacks.filter((c) => c !== cb)
    }
  }

  private handleFinalTranscript(rawText: string): void {
    const text = rawText.toLowerCase().trim()
    const wakeIndex = text.indexOf(this.wakeWord)

    let command = text
    if (wakeIndex !== -1) {
      command = text.substring(wakeIndex + this.wakeWord.length).replace(/^[,.: ]+/, '').trim()
    }

    if (command) {
      this.onCommandCallbacks.forEach((cb) => cb(command))
    }
  }

  isActive(): boolean {
    return this.isListening
  }
}

export const voiceManager = new VoiceManager()
