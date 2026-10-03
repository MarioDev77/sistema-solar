import type { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { CameraController, describeCameraError } from './camera-controller'
import { HandCalibration } from './hand-calibration'
import { palmCenter } from './hand-geometry'
import { GestureSmoother } from './gesture-smoother'
import type { HandCalibrationResult, HandFrame, HandSettings, Landmark, TrackedHand, TrackingStatus } from './types'

// Carregados em runtime (só quando o controle por mãos é ligado): nada disso entra no zip nem no bundle.
const MEDIAPIPE_VERSION = '1.0.1'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const ACTIVE_INTERVAL_MS = 33 // ~30 inferências/s com mãos na imagem
const IDLE_INTERVAL_MS = 125 // ~8/s quando não há mão (economiza CPU/GPU)
const IDLE_AFTER_MS = 1000
const STATUS_THROTTLE_MS = 120
const GESTURE_NONE = '—'

export const DEFAULT_SETTINGS: HandSettings = { mirror: true, showLandmarks: true, tolerance: 1, lowLight: false }

export const INITIAL_STATUS: TrackingStatus = {
  enabled: false, camera: 'off', cameraError: null, model: 'idle', modelError: null, phase: 'off',
  hands: 0, gesture: GESTURE_NONE, fps: 0, devices: [], deviceId: null, stream: null,
  calibrationProgress: 0, calibrationHint: '', calibratedAt: null, stability: null,
}

// mudanças nestas chaves chegam ao React na hora; as demais (fps, progresso) são limitadas a ~8/s
const IMMEDIATE_KEYS = new Set<keyof TrackingStatus>([
  'enabled', 'camera', 'cameraError', 'model', 'modelError', 'phase', 'hands', 'gesture', 'devices', 'deviceId', 'stream', 'calibratedAt',
])

type StatusListener = (status: TrackingStatus) => void
type FrameListener = (frame: HandFrame) => void

/**
 * Orquestra câmera → MediaPipe → suavização → calibração e publica:
 *  - status de baixa frequência (para HUD/painel React);
 *  - frames de landmarks (para overlay e, nas próximas etapas, reconhecimento de gestos).
 * Roda no PRÓPRIO laço de requestAnimationFrame, separado do Canvas 3D, e nunca causa re-render por frame.
 */
export class HandTrackingController {
  private camera = new CameraController()
  private landmarker: HandLandmarker | null = null
  private modelPromise: Promise<HandLandmarker> | null = null
  private smoother = new GestureSmoother()
  private calibration = new HandCalibration()
  private calibrationResult: HandCalibrationResult | null = null
  private settings: HandSettings = { ...DEFAULT_SETTINGS }
  private status: TrackingStatus = { ...INITIAL_STATUS }
  private statusListeners = new Set<StatusListener>()
  private frameListeners = new Set<FrameListener>()

  private token = 0
  private destroyed = false
  private running = false
  private raf = 0
  private lastRun = 0
  private lastVideoTime = -1
  private lastHandSeen = -1e9
  private lastSeen = [-1e9, -1e9]
  private slotCenters: ({ x: number; y: number } | null)[] = [null, null]
  private inferMs = 8
  private fpsCount = 0
  private fpsStart = 0
  private lastEmit = 0
  private preferredDevice: string | null = null

  constructor() {
    this.smoother.setStrength(this.strengthFor(this.settings.tolerance))
    this.camera.onEnded = () => this.handleCameraLost('A câmera foi desconectada.')
    navigator.mediaDevices?.addEventListener?.('devicechange', this.onDeviceChange)
  }

  // ───────────── API pública ─────────────
  subscribeStatus(fn: StatusListener) { this.statusListeners.add(fn); return () => { this.statusListeners.delete(fn) } }
  subscribeFrames(fn: FrameListener) { this.frameListeners.add(fn); return () => { this.frameListeners.delete(fn) } }
  getStatus() { return this.status }
  getSettings() { return this.settings }
  getCalibration() { return this.calibrationResult }

  setPreferredDevice(id: string | null) { this.preferredDevice = id; this.status = { ...this.status, deviceId: id } }

  setSettings(partial: Partial<HandSettings>) {
    const prev = this.settings
    this.settings = { ...prev, ...partial }
    if (partial.tolerance !== undefined) this.smoother.setStrength(this.strengthFor(this.settings.tolerance))
    if (partial.lowLight !== undefined && partial.lowLight !== prev.lowLight) {
      const c = this.settings.lowLight ? 0.35 : 0.5
      void this.landmarker?.setOptions({ minHandDetectionConfidence: c, minHandPresenceConfidence: c, minTrackingConfidence: c })
    }
    if (partial.mirror !== undefined && partial.mirror !== prev.mirror) {
      // espelhar inverte todas as coordenadas: filtros e calibração antigos deixam de valer
      this.smoother.reset(); this.slotCenters = [null, null]
      if (this.status.enabled && this.status.phase === 'ready') this.beginCalibration()
    }
  }

  async enable() {
    if (this.destroyed || this.status.enabled) return
    const token = ++this.token
    this.patch({
      enabled: true, phase: 'loading', camera: 'requesting', cameraError: null, modelError: null,
      model: this.landmarker ? 'ready' : 'loading', hands: 0, gesture: GESTURE_NONE,
      calibrationProgress: 0, calibrationHint: '', calibratedAt: null, stability: null,
    })
    // pedido de permissão e download do modelo andam em paralelo
    const [cam, model] = await Promise.allSettled([this.startCamera(this.preferredDevice ?? this.status.deviceId), this.ensureModel()])
    if (token !== this.token || this.destroyed) {
      if (!this.status.enabled) this.camera.stop()
      return
    }
    if (cam.status === 'rejected') {
      this.camera.stop()
      this.patch({ enabled: false, phase: 'off', camera: 'error', cameraError: describeCameraError(cam.reason), model: this.landmarker ? 'ready' : 'idle', stream: null })
      return
    }
    if (model.status === 'rejected') {
      this.camera.stop()
      this.patch({ enabled: false, phase: 'off', camera: 'off', model: 'error', stream: null, modelError: 'Não foi possível carregar o modelo de rastreamento. Verifique a conexão com a internet.' })
      return
    }
    this.patch({ camera: 'connected', model: 'ready' })
    void this.refreshDevices()
    this.smoother.reset(); this.slotCenters = [null, null]
    this.beginCalibration()
    this.startLoop()
  }

  disable() {
    this.token++
    this.stopLoop()
    this.camera.stop()
    this.smoother.reset(); this.calibration.reset(); this.calibrationResult = null
    this.slotCenters = [null, null]
    this.patch({
      enabled: false, phase: 'off', camera: 'off', hands: 0, stream: null, gesture: GESTURE_NONE, fps: 0,
      calibrationProgress: 0, calibrationHint: '', calibratedAt: null, stability: null,
    })
    this.emitFrame({ time: performance.now(), aspect: 1, hands: [] })
  }

  toggle() { return this.status.enabled ? (this.disable(), Promise.resolve()) : this.enable() }

  recalibrate() {
    if (!this.status.enabled || this.status.phase === 'loading') return
    this.beginCalibration()
  }

  async selectDevice(id: string) {
    this.preferredDevice = id
    this.patch({ deviceId: id })
    if (!this.status.enabled || this.status.phase === 'loading') return
    const token = ++this.token
    this.patch({ camera: 'requesting' })
    try {
      await this.startCamera(id)
      if (token !== this.token) return
      this.patch({ camera: 'connected' })
      this.smoother.reset(); this.slotCenters = [null, null]
      void this.refreshDevices()
      this.beginCalibration() // enquadramento novo → calibra de novo
    } catch (error) {
      if (token === this.token) this.handleCameraLost(describeCameraError(error))
    }
  }

  destroy() {
    this.destroyed = true
    this.disable()
    navigator.mediaDevices?.removeEventListener?.('devicechange', this.onDeviceChange)
    this.landmarker?.close(); this.landmarker = null
    this.statusListeners.clear(); this.frameListeners.clear()
  }

  // ───────────── câmera / modelo ─────────────
  private strengthFor(tolerance: number) { return Math.min(1, Math.max(0, (tolerance - 0.5) / 1.5)) }

  private async startCamera(id: string | null) {
    const { stream, deviceId } = await this.camera.start(id)
    this.camera.onEnded = () => this.handleCameraLost('A câmera foi desconectada.')
    this.patch({ stream, deviceId })
  }

  private handleCameraLost(message: string) {
    if (this.destroyed) return
    this.token++
    this.stopLoop(); this.camera.stop()
    this.patch({ enabled: false, phase: 'off', camera: 'error', cameraError: message, hands: 0, stream: null, fps: 0 })
    this.emitFrame({ time: performance.now(), aspect: 1, hands: [] })
  }

  private onDeviceChange = () => { if (this.status.enabled) void this.refreshDevices() }

  private async refreshDevices() {
    try { this.patch({ devices: await CameraController.listDevices() }) } catch { /* sem lista: segue com a câmera atual */ }
  }

  private ensureModel(): Promise<HandLandmarker> {
    if (this.landmarker) return Promise.resolve(this.landmarker)
    if (!this.modelPromise) {
      this.modelPromise = this.createLandmarker()
        .then((lm) => { if (this.destroyed) { lm.close(); throw new Error('destroyed') } this.landmarker = lm; return lm })
        .finally(() => { this.modelPromise = null })
    }
    return this.modelPromise
  }

  private async createLandmarker(): Promise<HandLandmarker> {
    const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
    const c = this.settings.lowLight ? 0.35 : 0.5
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: c, minHandPresenceConfidence: c, minTrackingConfidence: c,
    })
    try { return await HandLandmarker.createFromOptions(fileset, options('GPU')) }
    catch { return await HandLandmarker.createFromOptions(fileset, options('CPU')) }
  }

  // ───────────── calibração ─────────────
  private beginCalibration() {
    this.calibration.reset(); this.calibrationResult = null
    this.patch({
      phase: this.status.hands > 0 ? 'calibrating' : 'waiting', calibrationProgress: 0,
      calibrationHint: '', calibratedAt: null, stability: null,
    })
  }

  // ───────────── laço de rastreamento ─────────────
  private startLoop() {
    if (this.running) return
    this.running = true
    this.lastRun = 0; this.lastVideoTime = -1; this.fpsStart = performance.now(); this.fpsCount = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private stopLoop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private tick = (now: number) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.tick)
    if (document.hidden) return
    const idle = this.status.hands === 0 && now - this.lastHandSeen > IDLE_AFTER_MS
    // se a inferência ficar pesada em notebooks mais fracos, o intervalo cresce sozinho
    const interval = idle ? IDLE_INTERVAL_MS : Math.max(ACTIVE_INTERVAL_MS, this.inferMs * 2.2)
    if (now - this.lastRun < interval) return
    const video = this.camera.video
    if (video.readyState < 2 || video.videoWidth === 0 || video.currentTime === this.lastVideoTime) return
    this.lastVideoTime = video.currentTime
    this.lastRun = now
    this.process(video)
  }

  private process(video: HTMLVideoElement) {
    const landmarker = this.landmarker
    if (!landmarker) return
    const t0 = performance.now()
    let result: HandLandmarkerResult
    try { result = landmarker.detectForVideo(video, t0) } catch { return }
    this.inferMs = this.inferMs * 0.8 + (performance.now() - t0) * 0.2

    const aspect = video.videoWidth / Math.max(1, video.videoHeight)
    const mirror = this.settings.mirror
    const detected = result.landmarks.slice(0, 2).map((points, i) => ({
      points: points.map((p): Landmark => ({ x: mirror ? 1 - p.x : p.x, y: p.y, z: p.z })),
      score: result.handedness[i]?.[0]?.score ?? 0,
    }))

    const hands: TrackedHand[] = this.assignSlots(detected).map(({ slot, points, score }) => {
      if (t0 - this.lastSeen[slot] > 250) this.smoother.reset(slot) // mão reapareceu: não arrasta filtro velho
      this.lastSeen[slot] = t0
      return { slot, score, landmarks: this.smoother.smooth(slot, points, t0) }
    })

    if (hands.length > 0) this.lastHandSeen = t0
    else if (t0 - this.lastHandSeen > 600) this.slotCenters = [null, null]

    const frame: HandFrame = { time: t0, aspect, hands }
    this.stepCalibration(frame)

    this.fpsCount++
    let fps = this.status.fps
    if (t0 - this.fpsStart >= 1000) { fps = Math.round((this.fpsCount * 1000) / (t0 - this.fpsStart)); this.fpsCount = 0; this.fpsStart = t0 }
    this.patch({ hands: hands.length, fps })
    this.emitFrame(frame)
  }

  /** Slot 0/1 estável: com duas mãos, a da esquerda da tela é 0; com uma, vale a mais próxima da anterior. */
  private assignSlots(detected: { points: Landmark[]; score: number }[]) {
    const withCenter = detected.map((d) => ({ ...d, center: palmCenter(d.points) }))
    if (withCenter.length >= 2) {
      withCenter.sort((a, b) => a.center.x - b.center.x)
      withCenter.forEach((d, i) => { this.slotCenters[i] = d.center })
      return withCenter.map((d, i) => ({ slot: i as 0 | 1, points: d.points, score: d.score }))
    }
    if (withCenter.length === 1) {
      const d = withCenter[0]
      const gap = (s: number) => { const c = this.slotCenters[s]; return c ? Math.hypot(c.x - d.center.x, c.y - d.center.y) : Infinity }
      const slot: 0 | 1 = gap(1) < gap(0) ? 1 : 0
      this.slotCenters[slot] = d.center
      return [{ slot, points: d.points, score: d.score }]
    }
    return []
  }

  private stepCalibration(frame: HandFrame) {
    const { phase } = this.status
    if (phase !== 'waiting' && phase !== 'calibrating') return
    if (frame.hands.length === 0) {
      if (phase === 'calibrating') this.calibration.reset()
      this.patch({ phase: 'waiting', calibrationProgress: 0, calibrationHint: 'Mostre as mãos para a câmera.' })
      return
    }
    const update = this.calibration.update(frame, this.settings.tolerance)
    if (update.result) {
      this.calibrationResult = update.result
      this.patch({ phase: 'ready', calibrationProgress: 1, calibrationHint: '', calibratedAt: update.result.calibratedAt, stability: update.result.stability })
    } else {
      this.patch({ phase: 'calibrating', calibrationProgress: update.progress, calibrationHint: update.hint })
    }
  }

  // ───────────── publicação ─────────────
  private patch(partial: Partial<TrackingStatus>) {
    const prev = this.status
    let immediate = false
    for (const key of Object.keys(partial) as (keyof TrackingStatus)[]) {
      if (prev[key] !== partial[key] && IMMEDIATE_KEYS.has(key)) immediate = true
    }
    this.status = { ...prev, ...partial }
    const now = performance.now()
    if (immediate || now - this.lastEmit >= STATUS_THROTTLE_MS) {
      this.lastEmit = now
      for (const fn of this.statusListeners) fn(this.status)
    }
  }

  private emitFrame(frame: HandFrame) { for (const fn of this.frameListeners) fn(frame) }
}
