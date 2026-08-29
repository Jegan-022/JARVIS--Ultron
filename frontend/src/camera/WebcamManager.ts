export class WebcamManager {
  private video: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private isRunning = false
  private errorListeners: Array<(err: string) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.video = document.createElement('video')
      this.video.setAttribute('playsinline', 'true')
      this.video.setAttribute('autoplay', 'true')
      this.video.muted = true
      this.video.style.position = 'fixed'
      this.video.style.opacity = '0'
      this.video.style.pointerEvents = 'none'
      this.video.style.zIndex = '-9999'
      document.body.appendChild(this.video)
    }
  }

  async start(): Promise<HTMLVideoElement> {
    if (this.isRunning && this.video && this.video.srcObject) {
      return this.video
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Camera API not supported in this browser environment.'
      this.notifyError(msg)
      throw new Error(msg)
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      })

      if (!this.video) {
        throw new Error('Video element not initialized')
      }

      this.video.srcObject = this.stream
      await new Promise<void>((resolve, reject) => {
        if (!this.video) return reject(new Error('Video element missing'))
        this.video.onloadedmetadata = () => {
          this.video?.play().then(() => resolve()).catch(reject)
        }
        this.video.onerror = (e) => reject(e)
      })

      this.isRunning = true
      return this.video
    } catch (err: unknown) {
      this.isRunning = false
      const msg = err instanceof Error ? err.message : 'Failed to access camera'
      this.notifyError(msg)
      throw err
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.video) {
      this.video.srcObject = null
    }
    this.isRunning = false
  }

  getVideo(): HTMLVideoElement | null {
    return this.video
  }

  isActive(): boolean {
    return this.isRunning && !!this.video && this.video.readyState >= 2
  }

  onError(cb: (err: string) => void): () => void {
    this.errorListeners.push(cb)
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== cb)
    }
  }

  private notifyError(err: string): void {
    this.errorListeners.forEach((l) => l(err))
  }
}

export const webcamManager = new WebcamManager()
