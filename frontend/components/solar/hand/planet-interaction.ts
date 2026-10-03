import type { GestureFrame } from './gesture-types'
import { pickPlanet, type Candidate } from './planet-selection'

/**
 * PlanetInteraction: máquina de estados "apontar → pinçar → arrastar → soltar".
 * Não conhece Three.js nem React: recebe o GestureFrame e a lista de planetas projetados na tela
 * e devolve comandos. Quem executa (move o planeta, avisa o HUD) é o HandPlanetBridge.
 *
 *  - hover: dedo apontando por ~150 ms (gesto confirmado) sobre um planeta, mais ~90 ms de estabilidade;
 *  - grab: a pinça confirmou. O alvo é o que o indicador mirava ANTES de fechar a pinça (pinch-start.point);
 *  - drag-start: só depois de a pinça se mover >18 px. Pinçar sem mover apenas seleciona (o planeta segue orbitando);
 *  - release: pinça aberta, mão perdida ou modo holográfico encerrado.
 */
export type InteractionCommand =
  | { type: 'hover'; name: string | null }
  | { type: 'grab'; name: string; slot: 0 | 1 }
  | { type: 'drag-start'; name: string }
  | { type: 'rotate-start'; name: string }
  | { type: 'release'; name: string; moved: boolean }

export type TrailPoint = { x: number; y: number; t: number }

/** Estado visível para o overlay 2D e para o React (preenchido aos poucos pelo bridge). */
export type InteractionView = {
  hover: string | null
  /** moved = arrastando · rotating = girando o planeta (círculo com a pinça). omega em rad/s, + = sentido horário na tela */
  held: { name: string; slot: 0 | 1; moved: boolean; rotating: boolean; omega: number } | null
  /** planeta em destaque (hover ou segurado) já projetado na tela */
  focus: { name: string; x: number; y: number; r: number; mode: 'hover' | 'held' } | null
  trail: TrailPoint[]
}

export const HOVER_DWELL_MS = 90
export const HOVER_LINGER_MS = 280
export const DRAG_THRESHOLD_PX = 18
export const CLASSIFY_MIN_MS = 300 // tempo mínimo olhando o movimento antes de decidir "linha" (arrastar)
export const CLASSIFY_MAX_MS = 600
const ROTATE_TURN = 1.0 // rad de curvatura acumulada que caracteriza um círculo
const LINE_TURN = 0.5
const STEP_PX = 4 // amostras mais próximas que isso são ignoradas (ruído)
const OMEGA_WINDOW_MS = 500
const OMEGA_DEADZONE = 0.35 // rad/s: abaixo disso a mão está "parada" para fins de giro
const GRAB_MEMORY_MS = 600
const HAND_LOST_MS = 350

type Pt = { x: number; y: number; t: number }

/** Curvatura acumulada do caminho (rad, + = horário na tela, que tem y para baixo) e o tempo que ela cobre. */
export function pathTurning(hist: readonly Pt[], sinceMs = Infinity, now = 0) {
  const pts: Pt[] = []
  for (const p of hist) {
    if (now - p.t > sinceMs) continue
    const last = pts[pts.length - 1]
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= STEP_PX) pts.push(p)
  }
  let turn = 0
  for (let i = 2; i < pts.length; i++) {
    const ax = pts[i - 1].x - pts[i - 2].x, ay = pts[i - 1].y - pts[i - 2].y
    const bx = pts[i].x - pts[i - 1].x, by = pts[i].y - pts[i - 1].y
    turn += Math.atan2(ax * by - ay * bx, ax * bx + ay * by)
  }
  return { turn, span: pts.length > 1 ? pts[pts.length - 1].t - pts[0].t : 0, count: pts.length }
}

export class PlanetInteraction {
  readonly view: InteractionView = { hover: null, held: null, focus: null, trail: [] }
  /** posição (px da janela) da pinça que segura o planeta; null se ninguém está segurando */
  dragPx: { x: number; y: number } | null = null

  private pending: { name: string | null; since: number } = { name: null, since: 0 }
  private lastHoverAt = -1e9
  private lastHoverName: string | null = null
  private heldSeenAt = 0
  private startPx: { x: number; y: number } | null = null
  private hist: Pt[] = []
  private crossedAt = 0

  /** Larga tudo (modo holográfico encerrado, câmera desligada, sem gestos há tempo). */
  drop(): InteractionCommand[] {
    const out: InteractionCommand[] = []
    this.release(out)
    this.setHover(null, out)
    this.pending = { name: null, since: 0 }
    return out
  }

  update(g: GestureFrame, cands: readonly Candidate[], w: number, h: number, now: number, enabled: boolean): InteractionCommand[] {
    if (!enabled || !g.engaged) return this.drop()
    const out: InteractionCommand[] = []
    const busy = g.portal.state === 'active' || g.zoom.state === 'active' || g.spin.state === 'active'

    for (const e of g.events) {
      if (e.type === 'pinch-end' && this.view.held && e.slot === this.view.held.slot) this.release(out)
      else if (e.type === 'pinch-start' && !this.view.held && !busy) {
        const aim = { x: e.point.x * w, y: e.point.y * h }
        const name = pickPlanet(cands, aim.x, aim.y, this.view.hover)
          ?? (now - this.lastHoverAt <= GRAB_MEMORY_MS ? this.lastHoverName : null)
        if (name && cands.some((c) => c.name === name)) {
          this.view.held = { name, slot: e.slot, moved: false, rotating: false, omega: 0 }
          this.startPx = aim; this.dragPx = aim; this.heldSeenAt = now; this.hist = []; this.crossedAt = 0
          this.setHover(name, out)
          out.push({ type: 'grab', name, slot: e.slot })
        }
      }
    }

    const held = this.view.held
    if (held) {
      const hand = g.hands.find((x) => x.slot === held.slot)
      if (hand && hand.pinch.state !== 'idle') {
        this.heldSeenAt = now
        const px = { x: hand.pinch.point.x * w, y: hand.pinch.point.y * h }
        this.dragPx = px
        this.hist.push({ x: px.x, y: px.y, t: now })
        while (this.hist.length > 2 && now - this.hist[0].t > 800) this.hist.shift()

        if (!held.moved && !held.rotating && this.startPx && Math.hypot(px.x - this.startPx.x, px.y - this.startPx.y) > DRAG_THRESHOLD_PX) {
          // a mão saiu do lugar: é uma LINHA (arrastar) ou um CÍRCULO (girar o planeta)?
          if (!this.crossedAt) this.crossedAt = now
          const waited = now - this.crossedAt
          const { turn, count } = pathTurning(this.hist, CLASSIFY_MAX_MS + 200, now)
          if (count >= 4 && Math.abs(turn) > ROTATE_TURN) {
            held.rotating = true
            out.push({ type: 'rotate-start', name: held.name })
          } else if (waited >= CLASSIFY_MAX_MS || (waited >= CLASSIFY_MIN_MS && Math.abs(turn) < LINE_TURN)) {
            held.moved = true
            out.push({ type: 'drag-start', name: held.name })
          }
        }
        if (held.rotating) {
          // velocidade angular = curvatura / tempo na janela recente; zona morta evita giro com a mão parada
          const { turn, span, count } = pathTurning(this.hist, OMEGA_WINDOW_MS, now)
          const raw = count >= 3 ? turn / Math.max(span / 1000, 0.25) : 0
          const target = Math.abs(raw) < OMEGA_DEADZONE ? 0 : Math.max(-9, Math.min(9, raw))
          held.omega += (target - held.omega) * 0.35
        }
      } else if (!hand && now - this.heldSeenAt > HAND_LOST_MS) this.release(out)
      else if (hand && hand.pinch.state === 'idle') this.release(out)
      return out
    }

    // sem planeta na mão: o dedo apontando (ou a pinça ainda fechando) define o alvo em foco
    let src: { x: number; y: number } | null = null
    if (!busy) {
      for (const hand of g.hands) if (hand.point.state === 'active') src = hand.pointer
      if (!src) for (const hand of g.hands) if (hand.pinch.state === 'arming') src = hand.pinch.start ?? hand.pinch.point
    }
    const cand = src ? pickPlanet(cands, src.x * w, src.y * h, this.view.hover) : null
    if (cand === this.view.hover) {
      this.pending = { name: cand, since: now }
      if (cand) { this.lastHoverAt = now; this.lastHoverName = cand }
    } else {
      if (this.pending.name !== cand) this.pending = { name: cand, since: now }
      else if (now - this.pending.since >= (cand ? HOVER_DWELL_MS : HOVER_LINGER_MS)) {
        this.setHover(cand, out)
        if (cand) { this.lastHoverAt = now; this.lastHoverName = cand }
      }
    }
    return out
  }

  private release(out: InteractionCommand[]) {
    const held = this.view.held
    if (!held) return
    out.push({ type: 'release', name: held.name, moved: held.moved })
    this.view.held = null; this.dragPx = null; this.startPx = null; this.hist = []; this.crossedAt = 0
  }

  private setHover(name: string | null, out: InteractionCommand[]) {
    if (this.view.hover === name) return
    this.view.hover = name
    out.push({ type: 'hover', name })
  }
}
