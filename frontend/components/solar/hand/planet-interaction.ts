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
  | { type: 'release'; name: string; moved: boolean }

export type TrailPoint = { x: number; y: number; t: number }

/** Estado visível para o overlay 2D e para o React (preenchido aos poucos pelo bridge). */
export type InteractionView = {
  hover: string | null
  held: { name: string; slot: 0 | 1; moved: boolean } | null
  /** planeta em destaque (hover ou segurado) já projetado na tela */
  focus: { name: string; x: number; y: number; r: number; mode: 'hover' | 'held' } | null
  trail: TrailPoint[]
}

export const HOVER_DWELL_MS = 90
export const HOVER_LINGER_MS = 280
export const DRAG_THRESHOLD_PX = 18
const GRAB_MEMORY_MS = 600
const HAND_LOST_MS = 350

export class PlanetInteraction {
  readonly view: InteractionView = { hover: null, held: null, focus: null, trail: [] }
  /** posição (px da janela) da pinça que segura o planeta; null se ninguém está segurando */
  dragPx: { x: number; y: number } | null = null

  private pending: { name: string | null; since: number } = { name: null, since: 0 }
  private lastHoverAt = -1e9
  private lastHoverName: string | null = null
  private heldSeenAt = 0
  private startPx: { x: number; y: number } | null = null

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
          this.view.held = { name, slot: e.slot, moved: false }
          this.startPx = aim; this.dragPx = aim; this.heldSeenAt = now
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
        if (!held.moved && this.startPx && Math.hypot(px.x - this.startPx.x, px.y - this.startPx.y) > DRAG_THRESHOLD_PX) {
          held.moved = true
          out.push({ type: 'drag-start', name: held.name })
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
    this.view.held = null; this.dragPx = null; this.startPx = null
  }

  private setHover(name: string | null, out: InteractionCommand[]) {
    if (this.view.hover === name) return
    this.view.hover = name
    out.push({ type: 'hover', name })
  }
}
