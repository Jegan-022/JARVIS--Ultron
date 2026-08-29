/**
 * Priority-based Speech Synthesis Queue for J.A.R.V.I.S.
 * Manages sequential utterance playback with interruption support.
 */

export type SpeechPriority = 'low' | 'normal' | 'high' | 'urgent'

interface QueuedUtterance {
  text: string
  priority: SpeechPriority
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
}

const PRIORITY_ORDER: Record<SpeechPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
}

export class SpeechSynthesisQueue {
  private queue: QueuedUtterance[] = []
  private isSpeaking = false
  private synth: SpeechSynthesis | null = null
  private preferredVoice: SpeechSynthesisVoice | null = null
  private onSpeakStartCallbacks: Array<() => void> = []
  private onSpeakEndCallbacks: Array<() => void> = []

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.warmUpVoices()
    }
  }

  /**
   * Pre-load and select the best JARVIS-like voice.
   * Prioritizes deep, authoritative male English voices.
   */
  private warmUpVoices(): void {
    if (!this.synth) return

    const selectBestVoice = () => {
      const voices = this.synth!.getVoices()
      if (!voices.length) return

      // Priority list: prefer natural-sounding male English voices
      const priorities = [
        'Google UK English Male',
        'Microsoft David',
        'Microsoft Mark',
        'Google US English',
        'Daniel',
        'Alex',
        'Samantha',
      ]

      for (const name of priorities) {
        const found = voices.find((v) => v.name.includes(name))
        if (found) {
          this.preferredVoice = found
          break
        }
      }

      // Fallback: any English voice
      if (!this.preferredVoice) {
        this.preferredVoice =
          voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) ||
          voices.find((v) => v.lang.startsWith('en')) ||
          voices[0]
      }
    }

    // Voices may load asynchronously
    if (this.synth.getVoices().length > 0) {
      selectBestVoice()
    }
    this.synth.addEventListener('voiceschanged', selectBestVoice)
  }

  /**
   * Enqueue a speech utterance.
   * Urgent priority will interrupt current speech.
   */
  enqueue(text: string, options: Partial<QueuedUtterance> = {}): void {
    const item: QueuedUtterance = {
      text,
      priority: options.priority ?? 'normal',
      rate: options.rate ?? 1.05,
      pitch: options.pitch ?? 0.92,
      volume: options.volume ?? 1.0,
      onStart: options.onStart,
      onEnd: options.onEnd,
    }

    // Urgent priority interrupts everything
    if (item.priority === 'urgent') {
      this.cancelAll()
      this.queue.unshift(item)
    } else if (item.priority === 'high') {
      const insertIdx = this.queue.findIndex(
        (q) => PRIORITY_ORDER[q.priority] < PRIORITY_ORDER['high'],
      )
      if (insertIdx === -1) {
        this.queue.push(item)
      } else {
        this.queue.splice(insertIdx, 0, item)
      }
    } else {
      this.queue.push(item)
    }

    if (!this.isSpeaking) {
      this.processNext()
    }
  }

  /**
   * Convenience method: speak with normal priority.
   */
  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.enqueue(text, {
        priority: 'normal',
        onEnd: resolve,
      })
    })
  }

  private processNext(): void {
    if (!this.synth || this.queue.length === 0) {
      this.isSpeaking = false
      return
    }

    const item = this.queue.shift()!
    this.isSpeaking = true

    const utterance = new SpeechSynthesisUtterance(item.text)
    utterance.rate = item.rate ?? 1.05
    utterance.pitch = item.pitch ?? 0.92
    utterance.volume = item.volume ?? 1.0

    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice
    }

    utterance.onstart = () => {
      item.onStart?.()
      this.onSpeakStartCallbacks.forEach((cb) => cb())
    }

    utterance.onend = () => {
      item.onEnd?.()
      this.onSpeakEndCallbacks.forEach((cb) => cb())
      this.processNext()
    }

    utterance.onerror = () => {
      item.onEnd?.()
      this.onSpeakEndCallbacks.forEach((cb) => cb())
      this.processNext()
    }

    this.synth.speak(utterance)
  }

  cancelAll(): void {
    this.queue = []
    if (this.synth) {
      this.synth.cancel()
    }
    this.isSpeaking = false
  }

  cancelCurrent(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking
  }

  onSpeakStart(cb: () => void): () => void {
    this.onSpeakStartCallbacks.push(cb)
    return () => {
      this.onSpeakStartCallbacks = this.onSpeakStartCallbacks.filter((c) => c !== cb)
    }
  }

  onSpeakEnd(cb: () => void): () => void {
    this.onSpeakEndCallbacks.push(cb)
    return () => {
      this.onSpeakEndCallbacks = this.onSpeakEndCallbacks.filter((c) => c !== cb)
    }
  }
}

export const speechQueue = new SpeechSynthesisQueue()
