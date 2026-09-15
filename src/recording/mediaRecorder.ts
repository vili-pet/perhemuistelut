export type RecorderSupport = 'supported' | 'unsupported' | 'insecure-context'

const PREFERRED_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

export function getRecorderSupport(): RecorderSupport {
  if (typeof window === 'undefined') return 'unsupported'
  if (!window.isSecureContext) return 'insecure-context'
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'
  if (typeof MediaRecorder === 'undefined') return 'unsupported'
  return 'supported'
}

export function isPauseSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.prototype.pause === 'function'
}

export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined
  }
  return PREFERRED_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

export function extensionForMime(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3'
  if (mimeType.includes('wav')) return 'wav'
  return 'webm'
}

export interface RecordingResult {
  blob: Blob
  mimeType: string
  durationMs: number
}

export class BrowserRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private startedAt = 0
  private accumulatedMs = 0
  private pausedAt: number | null = null

  get state(): RecordingState {
    return this.mediaRecorder?.state ?? 'inactive'
  }

  async start(): Promise<void> {
    const mimeType = pickMimeType()
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.chunks = []
    this.accumulatedMs = 0
    this.pausedAt = null
    this.startedAt = performance.now()

    const recorder = mimeType
      ? new MediaRecorder(this.stream, { mimeType })
      : new MediaRecorder(this.stream)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder = recorder
    recorder.start(250)
  }

  pause(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') return
    this.mediaRecorder.pause()
    this.pausedAt = performance.now()
  }

  resume(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') return
    if (this.pausedAt !== null) {
      this.accumulatedMs += performance.now() - this.pausedAt
      this.pausedAt = null
    }
    this.mediaRecorder.resume()
  }

  async stop(): Promise<RecordingResult> {
    const recorder = this.mediaRecorder
    if (!recorder || recorder.state === 'inactive') {
      this.release()
      throw new Error('Nauhoitus ei ole käynnissä.')
    }

    const result = await new Promise<RecordingResult>((resolve, reject) => {
      recorder.onerror = () => {
        reject(new Error('Nauhoitus keskeytyi.'))
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || pickMimeType() || 'audio/webm'
        const blob = new Blob(this.chunks, { type: mimeType })
        let durationMs = performance.now() - this.startedAt - this.accumulatedMs
        if (this.pausedAt !== null) {
          durationMs -= performance.now() - this.pausedAt
        }
        resolve({
          blob,
          mimeType,
          durationMs: Math.max(0, Math.round(durationMs)),
        })
      }
      recorder.stop()
    })

    this.release()
    return result
  }

  release(): void {
    this.mediaRecorder = null
    this.chunks = []
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop()
      }
      this.stream = null
    }
  }
}
