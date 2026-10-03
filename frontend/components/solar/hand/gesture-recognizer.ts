import { dist2D, handSize, palmCenter } from './hand-geometry'
import type { GateState, GestureEvent, GestureFrame, GestureId, HandGestureInfo, PortalInfo, SpinInfo, Vec2, ZoomInfo } from './gesture-types'
import { LM, type HandCalibrationResult, type HandFrame, type Landmark, type TrackedHand } from './types'

// ───────────── parâmetros (tempos em ms, distâncias em "tamanhos de mão" s) ─────────────
const MIN_SCORE = 0.55 // confiança mínima do MediaPipe para a mão participar de qualquer gesto
const MIN_HAND_SIZE = 0.015 // mãos minúsculas (muito longe) são ignoradas
const EXT_RATIO = 1.45 // |ponta→pulso| / |base→pulso| acima disto = dedo estendido
const THUMB_EXT = 0.6 // |ponta do polegar → base do indicador| / s

const PINCH_ENTER = 0.3, PINCH_HOLD = 0.5
const PINCH_REACH = 0.55 // a pinça precisa estar longe do centro da palma: num punho as pontas ficam em cima dela
const PORTAL_TIPS = 0.85, PORTAL_HOLD = 1.25 // multiplicador de histerese quando já ativo
const PORTAL_AXIS_DOT = 0.3 // eixo de cada mão precisa apontar para a outra mão
const PORTAL_MIN_CENTERS = 0.9
const SPIN_ENTER = 1.0, SPIN_HOLD = 0.6 // rad/s
const SPIN_MAX_ZOOM_RATE = 1.3 // 1/s: se a distância muda muito rápido, é zoom e não giro
const ZOOM_MIN_CENTERS = 1.0
const ZOOM_DEADZONE = 0.0025
const PALM_SPEED = 0.45 // s/s
const PALM_RADIUS = 0.5 // s
const PALM_HOLD_MS = 1000
const PUSH_RATIO = 1.38, PUSH_WINDOW = 320
const PULL_RATIO = 0.74, PULL_WINDOW = 520
const PUSHPULL_COOLDOWN = 1100
const FLASH_MS = 700
const DISENGAGE_AFTER_MS = 5000
const POINTER_LOOKBACK = 300

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

/**
 * Porta de confirmação de um gesto: só vira "active" depois de enterMs contínuos,
 * tolera quedas curtas (armGrace/exitMs) e respeita cooldown depois de terminar.
 */
export class ConfirmGate {
  state: GateState = 'idle'
  progress = 0
  private since = 0
  private lostAt = 0
  private cooldownUntil = 0
  private drops = 0
  constructor(private enterMs: number, private exitMs: number, private cooldownMs = 0, private armGraceMs = 80, private maxDrops = 2) {}

  update(raw: boolean, now: number): 'arm' | 'start' | 'end' | null {
    switch (this.state) {
      case 'idle':
        this.progress = 0
        if (raw && now >= this.cooldownUntil) { this.state = 'arming'; this.since = now; this.lostAt = 0; this.drops = 0; return 'arm' }
        return null
      case 'arming':
        if (raw) this.lostAt = 0
        else {
          // quedas curtas são toleradas, mas um sinal que "pisca" (várias quedas) não confirma
          if (this.lostAt === 0) { this.lostAt = now; this.drops++ }
          if (now - this.lostAt >= this.armGraceMs || this.drops > this.maxDrops) { this.state = 'idle'; this.progress = 0; return null }
        }
        this.progress = Math.min(1, (now - this.since) / this.enterMs)
        if (raw && now - this.since >= this.enterMs) { this.state = 'active'; this.progress = 1; this.lostAt = 0; return 'start' }
        return null
      default:
        this.progress = 1
        if (raw) { this.lostAt = 0; return null }
        if (this.lostAt === 0) this.lostAt = now
        if (now - this.lostAt >= this.exitMs) { this.state = 'idle'; this.progress = 0; this.cooldownUntil = now + this.cooldownMs; return 'end' }
        return null
    }
  }
  get active() { return this.state === 'active' }
  reset() { this.state = 'idle'; this.progress = 0; this.lostAt = 0; this.cooldownUntil = 0 }
}

type Features = {
  hand: TrackedHand
  slot: 0 | 1
  size: number
  center: Vec2
  extended: [boolean, boolean, boolean, boolean, boolean]
  fourExt: boolean // indicador + médio + anelar + mínimo
  open5: boolean // os quatro + polegar
  pointing: boolean
  pinchDist: number
  pinchReach: number
  pinchPoint: Vec2
  pointer: Vec2
  thumbTip: Landmark
  indexTip: Landmark
}

function analyze(hand: TrackedHand, aspect: number): Features | null {
  const lm = hand.landmarks
  const size = handSize(lm, aspect)
  if (size < MIN_HAND_SIZE) return null
  const wrist = lm[LM.WRIST]
  const ext = (mcp: number, tip: number) => dist2D(lm[tip], wrist, aspect) / Math.max(dist2D(lm[mcp], wrist, aspect), 1e-4) > EXT_RATIO
  const index = ext(LM.INDEX_MCP, LM.INDEX_TIP), middle = ext(LM.MIDDLE_MCP, LM.MIDDLE_TIP)
  const ring = ext(LM.RING_MCP, LM.RING_TIP), pinky = ext(LM.PINKY_MCP, LM.PINKY_TIP)
  const thumb = dist2D(lm[LM.THUMB_TIP], lm[LM.INDEX_MCP], aspect) / size > THUMB_EXT
  const t = lm[LM.THUMB_TIP], i = lm[LM.INDEX_TIP]
  const fourExt = index && middle && ring && pinky
  const center = palmCenter(lm)
  const pinchPoint = { x: (t.x + i.x) / 2, y: (t.y + i.y) / 2 }
  return {
    hand, slot: hand.slot, size, center,
    extended: [thumb, index, middle, ring, pinky],
    fourExt, open5: fourExt && thumb,
    pointing: index && !middle && !ring && !pinky,
    pinchDist: dist2D(t, i, aspect) / size,
    pinchReach: dist2D(pinchPoint, center, aspect) / size,
    pinchPoint,
    pointer: { x: i.x, y: i.y },
    thumbTip: t, indexTip: i,
  }
}

type Sample = { t: number; size: number; x: number; y: number }

class SlotState {
  pinch = new ConfirmGate(100, 150, 0, 0)
  point = new ConfirmGate(150, 200, 0, 40, 1)
  hist: Sample[] = []
  ptr: { t: number; x: number; y: number }[] = []
  pinchStart: Vec2 | null = null
  reset() { this.pinch.reset(); this.point.reset(); this.hist = []; this.ptr = []; this.pinchStart = null }
}

const wrapHalfPi = (a: number) => { const m = ((a + Math.PI / 2) % Math.PI + Math.PI) % Math.PI; return m - Math.PI / 2 }
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const soft = (v: number, dz: number) => (Math.abs(v) <= dz ? 0 : v - Math.sign(v) * dz)

const NAMES: Record<GestureId, string> = {
  none: '—', portal: 'PORTAL MODE', spin: 'SPIN', zoom: 'TWO-HAND ZOOM', pinch: 'PINCH',
  push: 'PUSH', pull: 'PULL', point: 'POINTING', palm: 'OPEN PALM',
}

/**
 * Transforma frames de landmarks em gestos confirmados. Não conhece React nem a cena 3D:
 * recebe HandFrame e devolve GestureFrame (estado contínuo + eventos de início/fim).
 * Todos os gestos passam por ConfirmGate (tempo mínimo, tolerância a quedas, cooldown),
 * têm histerese nos limiares e dependem da confiança mínima da mão.
 */
export class GestureRecognizer {
  private slots = [new SlotState(), new SlotState()]
  private portalGate = new ConfirmGate(400, 250, 400, 100)
  private zoomGate = new ConfirmGate(250, 250, 0, 100)
  private spinGate = new ConfirmGate(250, 300, 0, 100)
  private palmGate = new ConfirmGate(PALM_HOLD_MS, 150, 1200, 120)

  private engaged = false
  private lastHandsAt = 0
  private flash: { id: 'push' | 'pull'; until: number } | null = null
  private pushPullCooldown = 0

  private portalMid: Vec2 | null = null
  private portalPrev: Vec2 | null = null
  private portalAnchor: Vec2 | null = null
  private portalConf = 0

  private zoomAnchor = 1
  private zoomSmooth: number | null = null
  private zoomRatio = 1
  private zoomDelta = 0

  private angPrev: number | null = null
  private angT = 0
  private distPrev: number | null = null
  private omega = 0
  private lnRate = 0

  private palmAnchor: Vec2 | null = null
  private palmPrev: Vec2 | null = null
  private palmPrevT = 0
  private palmSpeed = 0
  private palmSlot: 0 | 1 | null = null
  private pendingDisengage = false

  reset() {
    this.slots.forEach((s) => s.reset())
    this.portalGate.reset(); this.zoomGate.reset(); this.spinGate.reset(); this.palmGate.reset()
    this.engaged = false; this.flash = null; this.pushPullCooldown = 0
    this.portalMid = this.portalPrev = this.portalAnchor = null; this.portalConf = 0
    this.zoomSmooth = null; this.zoomRatio = 1; this.zoomDelta = 0
    this.angPrev = null; this.distPrev = null; this.omega = 0; this.lnRate = 0
    this.palmAnchor = this.palmPrev = null; this.palmSpeed = 0; this.palmSlot = null
  }

  isEngaged() { return this.engaged }
  /** encerra o modo de manipulação (botão, tecla, desligar câmera…). O evento sai no próximo update. */
  disengage() { if (this.engaged) { this.engaged = false; this.pendingDisengage = true } }

  update(frame: HandFrame, calibration: HandCalibrationResult | null, tolerance: number): GestureFrame {
    const now = frame.time, aspect = frame.aspect
    const scale = 0.75 + 0.25 * clamp(tolerance, 0.5, 2) // limiares de distância: 0.875× … 1.25×
    const deadzone = calibration?.deadzone ?? 0.008
    const events: GestureEvent[] = []
    if (this.pendingDisengage) { this.pendingDisengage = false; events.push({ type: 'disengage', reason: 'manual' }) }

    // 1) características por mão (só mãos confiáveis)
    const feats: (Features | null)[] = [null, null]
    for (const h of frame.hands) {
      if (h.score < MIN_SCORE) continue
      feats[h.slot] = analyze(h, aspect)
    }
    const present = feats.filter((f): f is Features => f !== null)
    const two = feats[0] && feats[1] ? [feats[0], feats[1]] as const : null
    if (frame.hands.length > 0) this.lastHandsAt = now

    // 2) gestos de uma mão: pinça, apontar, push/pull
    for (const slot of [0, 1] as const) {
      const st = this.slots[slot], f = feats[slot]
      if (f) {
        st.ptr.push({ t: now, x: f.pointer.x, y: f.pointer.y })
        while (st.ptr.length > 2 && now - st.ptr[0].t > 700) st.ptr.shift()
      } else st.ptr.length = 0

      const hold = st.pinch.active
      const pinchRaw = !!f && f.pinchDist < (hold ? PINCH_HOLD : PINCH_ENTER) * scale && f.pinchReach > PINCH_REACH * (hold ? 0.7 : 1)
      const pc = st.pinch.update(pinchRaw, now)
      if (pc === 'arm' && f) {
        // alvo = onde o indicador estava um instante antes de a pinça começar a fechar
        const target = st.ptr.find((p) => now - p.t <= POINTER_LOOKBACK) ?? st.ptr[st.ptr.length - 1]
        st.pinchStart = target ? { x: target.x, y: target.y } : { ...f.pinchPoint }
      }
      if (pc === 'start' && f) events.push({ type: 'pinch-start', slot, point: st.pinchStart ?? f.pinchPoint })
      if (pc === 'end') { events.push({ type: 'pinch-end', slot }); st.pinchStart = null }
      if (st.pinch.state === 'idle') st.pinchStart = null

      const pointRaw = !!f && f.pointing && !st.pinch.active
      const pt = st.point.update(pointRaw, now)
      if (pt === 'start') events.push({ type: 'point-start', slot })
      if (pt === 'end') events.push({ type: 'point-end', slot })

      this.stepPushPull(slot, f, now, events)
    }

    // 3) portal (duas mãos)
    const portalHold = this.portalGate.active
    let portalRaw = false
    let tips: PortalInfo['points'] = null
    if (two) {
      const [a, b] = two
      const sBar = (a.size + b.size) / 2
      const limit = PORTAL_TIPS * (portalHold ? PORTAL_HOLD : 1) * scale
      const dTT = dist2D(a.thumbTip, b.thumbTip, aspect) / sBar
      const dII = dist2D(a.indexTip, b.indexTip, aspect) / sBar
      const centers = dist2D(a.center, b.center, aspect) / sBar
      const axis = (f: Features, other: Features) => {
        const lm = f.hand.landmarks
        const ax = (lm[LM.MIDDLE_MCP].x - lm[LM.WRIST].x) * aspect, ay = lm[LM.MIDDLE_MCP].y - lm[LM.WRIST].y
        const tx = (other.center.x - f.center.x) * aspect, ty = other.center.y - f.center.y
        return (ax * tx + ay * ty) / Math.max(Math.hypot(ax, ay) * Math.hypot(tx, ty), 1e-6)
      }
      const dot = Math.min(axis(a, b), axis(b, a))
      const dotMin = PORTAL_AXIS_DOT * (portalHold ? 0.5 : 1)
      const imid = { x: (a.indexTip.x + b.indexTip.x) / 2, y: (a.indexTip.y + b.indexTip.y) / 2 }
      const tmid = { x: (a.thumbTip.x + b.thumbTip.x) / 2, y: (a.thumbTip.y + b.thumbTip.y) / 2 }
      const opening = dist2D(imid, tmid, aspect) / sBar
      portalRaw = dTT < limit && dII < limit && dot > dotMin && centers > PORTAL_MIN_CENTERS && opening > 0.35 && opening < 2.5
      this.portalConf = portalRaw
        ? clamp(0.5 * (1 - Math.max(dTT, dII) / limit) + 0.5 * clamp((dot - dotMin) / 0.5, 0, 1), 0, 1) : 0
      tips = {
        thumbs: [{ x: a.thumbTip.x, y: a.thumbTip.y }, { x: b.thumbTip.x, y: b.thumbTip.y }],
        indices: [{ x: a.indexTip.x, y: a.indexTip.y }, { x: b.indexTip.x, y: b.indexTip.y }],
      }
    } else this.portalConf = 0
    const pEv = this.portalGate.update(portalRaw && this.portalConf >= 0.1, now)
    const portalDelta: Vec2 = { x: 0, y: 0 }
    const portalOffset: Vec2 = { x: 0, y: 0 }
    let portalRadius = 0
    if (tips && this.portalGate.state !== 'idle') {
      const pts = [...tips.thumbs, ...tips.indices]
      const raw = { x: pts.reduce((s, p) => s + p.x, 0) / 4, y: pts.reduce((s, p) => s + p.y, 0) / 4 }
      this.portalMid = this.portalMid ? { x: this.portalMid.x + (raw.x - this.portalMid.x) * 0.5, y: this.portalMid.y + (raw.y - this.portalMid.y) * 0.5 } : raw
      portalRadius = Math.max(...pts.map((p) => dist2D(p, this.portalMid!, aspect)))
    } else if (this.portalGate.state === 'idle') { this.portalMid = null; this.portalPrev = null }
    if (pEv === 'start') {
      this.portalAnchor = this.portalMid ? { ...this.portalMid } : null
      this.portalPrev = this.portalMid ? { ...this.portalMid } : null
      events.push({ type: 'portal-start' })
      if (!this.engaged) { this.engaged = true; events.push({ type: 'engage' }) }
    }
    if (pEv === 'end') { events.push({ type: 'portal-end' }); this.portalAnchor = null }
    if (this.portalGate.active && this.portalMid) {
      if (this.portalPrev) {
        const dx = (this.portalMid.x - this.portalPrev.x) * aspect, dy = this.portalMid.y - this.portalPrev.y
        const m = Math.hypot(dx, dy), k = m > 0 ? soft(m, deadzone * 0.2) / m : 0
        portalDelta.x = dx * k; portalDelta.y = dy * k
      }
      if (this.portalAnchor) {
        const ox = (this.portalMid.x - this.portalAnchor.x) * aspect, oy = this.portalMid.y - this.portalAnchor.y
        const m = Math.hypot(ox, oy), k = m > 0 ? soft(m, deadzone) / m : 0
        portalOffset.x = ox * k; portalOffset.y = oy * k
      }
      this.portalPrev = { ...this.portalMid }
    }
    const portalOn = this.portalGate.state !== 'idle'

    // 4) geometria das duas mãos: ângulo da linha entre elas (giro) e distância (zoom)
    let handsDist = 0
    if (two) {
      const [a, b] = two
      const dx = (b.center.x - a.center.x) * aspect, dy = b.center.y - a.center.y
      const ang = Math.atan2(dy, dx)
      const d = Math.hypot(dx, dy)
      handsDist = d / ((a.size + b.size) / 2)
      const dt = (now - this.angT) / 1000
      if (this.angPrev === null || this.distPrev === null || dt <= 0 || dt > 0.25) { this.omega = 0; this.lnRate = 0 }
      else {
        const dTheta = wrapHalfPi(ang - this.angPrev) // a linha não tem "frente": as mãos podem trocar de lado
        this.omega = this.omega * 0.65 + (dTheta / Math.max(dt, 1 / 120)) * 0.35
        this.lnRate = this.lnRate * 0.65 + (Math.log(Math.max(d, 1e-4) / Math.max(this.distPrev, 1e-4)) / Math.max(dt, 1 / 120)) * 0.35
      }
      this.angPrev = ang; this.distPrev = d; this.angT = now
    } else { this.angPrev = null; this.distPrev = null; this.omega *= 0.8; this.lnRate = 0 }

    // 5) giro circular com as duas mãos
    const anyPinch = this.slots[0].pinch.active || this.slots[1].pinch.active
    const spinMin = this.spinGate.active ? SPIN_HOLD : SPIN_ENTER
    const spinRaw = !!two && !portalOn && !anyPinch && handsDist > 0.8 && Math.abs(this.omega) > spinMin && Math.abs(this.lnRate) < SPIN_MAX_ZOOM_RATE
    const sEv = this.spinGate.update(spinRaw, now)
    if (sEv === 'start') events.push({ type: 'spin-start' })
    if (sEv === 'end') events.push({ type: 'spin-end' })

    // 6) zoom com duas mãos abertas
    const zoomRaw = !!two && two[0].fourExt && two[1].fourExt && !portalOn && !this.spinGate.active && !anyPinch
      && handsDist > ZOOM_MIN_CENTERS && Math.abs(this.omega) < (this.zoomGate.active ? 1.2 : 0.8)
    const zEv = this.zoomGate.update(zoomRaw, now)
    this.zoomDelta = 0
    if (zEv === 'start') {
      this.zoomAnchor = Math.max(handsDist, 1e-3); this.zoomSmooth = handsDist; this.zoomRatio = 1
      events.push({ type: 'zoom-start' })
    }
    if (this.zoomGate.active && two) {
      const prev = this.zoomSmooth ?? handsDist
      const next = prev + (handsDist - prev) * 0.4
      const dl = Math.log(Math.max(next, 1e-3) / Math.max(prev, 1e-3))
      this.zoomDelta = Math.abs(dl) < ZOOM_DEADZONE ? 0 : dl
      this.zoomSmooth = next
      this.zoomRatio = next / this.zoomAnchor
    }
    if (zEv === 'end') { events.push({ type: 'zoom-end' }); this.zoomSmooth = null; this.zoomRatio = 1 }

    // 7) palma aberta estável por ~1 s (uma única mão aberta)
    const openHands = present.filter((f) => f.open5)
    const solo = openHands.length === 1 && present.filter((f) => f.fourExt).length === 1 ? openHands[0] : null
    let palmRaw = false
    if (solo) {
      if (this.palmPrev && now > this.palmPrevT) {
        const dt = (now - this.palmPrevT) / 1000
        const v = dist2D(solo.center, this.palmPrev, aspect) / solo.size / Math.max(dt, 1 / 120)
        this.palmSpeed = this.palmSpeed * 0.7 + v * 0.3
      }
      this.palmPrev = solo.center; this.palmPrevT = now
      if (this.palmGate.state === 'idle' || this.palmSlot !== solo.slot || !this.palmAnchor) { this.palmAnchor = { ...solo.center }; this.palmSlot = solo.slot }
      const drift = dist2D(solo.center, this.palmAnchor, aspect) / solo.size
      palmRaw = this.palmSpeed < PALM_SPEED && drift < PALM_RADIUS
      if (!palmRaw && this.palmSpeed >= PALM_SPEED) this.palmAnchor = { ...solo.center } // moveu: recomeça a contagem onde parou
    } else { this.palmPrev = null; this.palmSpeed = 0; this.palmAnchor = null }
    const palmEv = this.palmGate.update(palmRaw, now)
    if (palmEv === 'start' && this.palmSlot !== null) events.push({ type: 'palm-toggle', slot: this.palmSlot })

    // 8) modo de manipulação: expira se as mãos somem por muito tempo
    if (this.engaged && frame.hands.length === 0 && now - this.lastHandsAt > DISENGAGE_AFTER_MS) {
      this.engaged = false
      events.push({ type: 'disengage', reason: 'timeout' })
    }

    // 9) gesto principal para o HUD (prioridade fixa; "…" enquanto ainda confirma)
    const pinchGate = this.slots.find((s) => s.pinch.active)?.pinch ?? this.slots.find((s) => s.pinch.state === 'arming')?.pinch ?? null
    const pointGate = this.slots.find((s) => s.point.active)?.point ?? this.slots.find((s) => s.point.state === 'arming')?.point ?? null
    const flashing = this.flash && now < this.flash.until ? this.flash.id : null
    if (!flashing) this.flash = null
    const candidates: [GestureId, GateState][] = [
      ['portal', this.portalGate.state], ['pinch', pinchGate?.state ?? 'idle'], ['spin', this.spinGate.state],
      ['zoom', this.zoomGate.state], ['point', pointGate?.state ?? 'idle'], ['palm', this.palmGate.state],
    ]
    let primary: GestureId = 'none'
    let label = NAMES.none
    const active = candidates.find(([, s]) => s === 'active')
    const arming = candidates.find(([, s]) => s === 'arming')
    if (active) {
      primary = active[0]
      label = primary === 'spin' ? `SPIN ${this.omega >= 0 ? 'CW' : 'CCW'}` : NAMES[primary]
    } else if (flashing) { primary = flashing; label = NAMES[flashing] }
    else if (arming) { primary = arming[0]; label = `${NAMES[primary]}…` }

    // 10) saída
    const hands: HandGestureInfo[] = present.map((f) => {
      const st = this.slots[f.slot]
      return {
        slot: f.slot, size: f.size, center: f.center, extended: f.extended, pointer: f.pointer,
        point: { state: st.point.state },
        pinch: { state: st.pinch.state, distance: f.pinchDist, point: f.pinchPoint, start: st.pinchStart },
      }
    })
    const spin: SpinInfo = { state: this.spinGate.state, velocity: this.spinGate.active ? clamp(this.omega, -6, 6) : 0 }
    const zoom: ZoomInfo = { state: this.zoomGate.state, ratio: this.zoomGate.active ? this.zoomRatio : 1, delta: this.zoomGate.active ? this.zoomDelta : 0 }
    const portal: Mutable<PortalInfo> = {
      state: this.portalGate.state, progress: this.portalGate.progress, confidence: this.portalConf,
      mid: portalOn ? this.portalMid : null, radius: portalRadius, delta: portalDelta, offset: portalOffset, points: portalOn ? tips : null,
    }
    return {
      time: now, aspect, engaged: this.engaged, primary, label, hands, portal, zoom, spin,
      palm: { state: this.palmGate.state, progress: this.palmGate.progress, slot: this.palmGate.state === 'idle' ? null : this.palmSlot },
      events,
    }
  }

  /**
   * Empurrar = mão aberta cresce rápido no quadro (vai em direção à câmera).
   * Puxar = mão aberta que estava estendida encolhe (volta para o corpo).
   * Só vale com pouco deslocamento lateral, para não confundir com mover a mão.
   */
  private stepPushPull(slot: 0 | 1, f: Features | null, now: number, events: GestureEvent[]) {
    const st = this.slots[slot]
    if (!f || !f.fourExt || st.pinch.state !== 'idle') { st.hist = []; return }
    st.hist.push({ t: now, size: f.size, x: f.center.x, y: f.center.y })
    while (st.hist.length > 2 && now - st.hist[0].t > 800) st.hist.shift()
    if (now < this.pushPullCooldown) return
    const inWindow = (ms: number) => st.hist.filter((s) => now - s.t <= ms)
    const mean = (xs: Sample[]) => xs.reduce((a, s) => a + s.size, 0) / xs.length
    const check = (ms: number) => {
      const w = inWindow(ms)
      if (w.length < 6 || w[w.length - 1].t - w[0].t < ms * 0.55) return null
      const first = mean(w.slice(0, 2)), last = mean(w.slice(-2))
      const lateral = Math.hypot((w[w.length - 1].x - w[0].x), (w[w.length - 1].y - w[0].y)) // alturas de quadro (grosso modo)
      if (lateral / Math.max(first, 1e-3) > 1.0) return null
      return last / first
    }
    const fast = check(PUSH_WINDOW)
    if (fast !== null && fast >= PUSH_RATIO) return this.fire('push', slot, now, events)
    const slow = check(PULL_WINDOW)
    if (slow !== null && slow <= PULL_RATIO) return this.fire('pull', slot, now, events)
  }

  private fire(id: 'push' | 'pull', slot: 0 | 1, now: number, events: GestureEvent[]) {
    events.push({ type: id, slot })
    this.flash = { id, until: now + FLASH_MS }
    this.pushPullCooldown = now + PUSHPULL_COOLDOWN
    this.slots[slot].hist = []
  }
}
