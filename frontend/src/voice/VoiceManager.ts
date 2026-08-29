export interface VoiceMessage {
  id: string
  speaker: 'user' | 'ultron'
  text: string
  timestamp: number
}

// Window typing for Web Speech API
interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
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
  private synth: SpeechSynthesis | null = null
  private isListening = false
  private wakeWord = 'ultron'
  private onTranscriptCallbacks: Array<(text: string, isFinal: boolean) => void> = []
  private onCommandCallbacks: Array<(command: string) => void> = []
  private onErrorCallbacks: Array<(error: string) => void> = []

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
          console.warn('Speech recognition error:', e.error)
          this.onErrorCallbacks.forEach((cb) => cb(e.error || 'STT error'))
        }

        this.recognition.onend = () => {
          // Auto-restart if listening was not explicitly stopped
          if (this.isListening) {
            try {
              this.recognition?.start()
            } catch {
              // ignore restart error
            }
          }
        }
      }

      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis
      }
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
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // ignore
      }
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.log('[TTS fallback]', text)
        return resolve()
      }

      this.synth.cancel() // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 0.95 // Slightly deeper futuristic tone

      // Try selecting a modern English voice
      const voices = this.synth.getVoices()
      const preferredVoice =
        voices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David')) ||
        voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()

      this.synth.speak(utterance)
    })
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
