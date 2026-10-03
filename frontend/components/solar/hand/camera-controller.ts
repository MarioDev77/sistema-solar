import type { CameraDevice } from './types'

/** Traduz erros do getUserMedia para mensagens claras em português. */
export function describeCameraError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : error instanceof Error ? error.message : ''
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Permissão da câmera negada. Libere o acesso no navegador e tente de novo.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhuma câmera encontrada neste computador.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'A câmera está em uso por outro aplicativo.'
    case 'UNSUPPORTED':
      return 'Este navegador não permite acesso à câmera (é preciso HTTPS ou localhost).'
    default:
      return 'Não foi possível iniciar a câmera.'
  }
}

/** Dona do <video> e do MediaStream. Não conhece MediaPipe nem a cena 3D. */
export class CameraController {
  readonly video: HTMLVideoElement
  onEnded: (() => void) | null = null
  private stream: MediaStream | null = null

  constructor() {
    this.video = document.createElement('video')
    this.video.playsInline = true
    this.video.muted = true
    this.video.autoplay = true
  }

  static async listDevices(): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return []
    const all = await navigator.mediaDevices.enumerateDevices()
    return all
      .filter((d) => d.kind === 'videoinput')
      .map((d, i) => ({ id: d.deviceId, label: d.label || `Câmera ${i + 1}` }))
  }

  private handleEnded = () => { this.onEnded?.() }

  async start(deviceId: string | null): Promise<{ stream: MediaStream; deviceId: string | null }> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('UNSUPPORTED')
    this.stop()
    // 640x480 a 30 fps: resolução baixa = inferência mais rápida e menos latência
    const base = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { ...base, deviceId: { exact: deviceId } } : { ...base, facingMode: 'user' },
        audio: false,
      })
    } catch (error) {
      // câmera salva não existe mais: cai para a padrão
      if (deviceId && error instanceof DOMException && (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { ...base, facingMode: 'user' }, audio: false })
      } else throw error
    }
    this.stream = stream
    const track = stream.getVideoTracks()[0]
    track.addEventListener('ended', this.handleEnded)
    this.video.srcObject = stream
    await this.video.play().catch(() => {})
    await this.waitForMetadata()
    return { stream, deviceId: track.getSettings().deviceId ?? deviceId }
  }

  private waitForMetadata() {
    return new Promise<void>((resolve) => {
      if (this.video.readyState >= 1 && this.video.videoWidth > 0) return resolve()
      const done = () => { window.clearTimeout(timer); this.video.removeEventListener('loadedmetadata', done); resolve() }
      const timer = window.setTimeout(done, 4000)
      this.video.addEventListener('loadedmetadata', done)
    })
  }

  stop() {
    this.stream?.getVideoTracks().forEach((t) => t.removeEventListener('ended', this.handleEnded))
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.video.srcObject = null
  }
}
