import type { Landmark } from './types'

const alphaFor = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

/**
 * Filtro One Euro: suaviza forte quando a mão está parada (tira o tremor) e quase não atrasa
 * quando a mão se move rápido (mantém baixa latência).
 */
export class OneEuroFilter {
  private prev: number | null = null
  private prevDeriv = 0
  private lastT: number | null = null
  constructor(public minCutoff: number, public beta: number, private dCutoff = 1) {}

  filter(value: number, tMs: number) {
    if (this.prev === null || this.lastT === null) {
      this.prev = value; this.lastT = tMs; this.prevDeriv = 0
      return value
    }
    const dt = Math.max((tMs - this.lastT) / 1000, 1 / 120)
    this.lastT = tMs
    const deriv = (value - this.prev) / dt
    this.prevDeriv += alphaFor(this.dCutoff, dt) * (deriv - this.prevDeriv)
    const cutoff = this.minCutoff + this.beta * Math.abs(this.prevDeriv)
    this.prev += alphaFor(cutoff, dt) * (value - this.prev)
    return this.prev
  }
}

const COORDS = 21 * 3

/** Suavização dos 21 landmarks de cada mão (uma bateria de filtros por "slot" de mão). */
export class GestureSmoother {
  private banks = new Map<number, OneEuroFilter[]>()
  private minCutoff = 1.8
  private beta = 6

  /** strength 0 (mais responsivo) … 1 (mais estável). */
  setStrength(strength: number) {
    const s = Math.min(1, Math.max(0, strength))
    this.minCutoff = 3.2 - s * 2.4 // 3.2 → 0.8 Hz
    this.beta = 7 - s * 3 // 7 → 4
    for (const bank of this.banks.values()) for (const f of bank) { f.minCutoff = this.minCutoff; f.beta = this.beta }
  }

  smooth(slot: number, landmarks: Landmark[], tMs: number): Landmark[] {
    let bank = this.banks.get(slot)
    if (!bank) {
      bank = Array.from({ length: COORDS }, () => new OneEuroFilter(this.minCutoff, this.beta))
      this.banks.set(slot, bank)
    }
    return landmarks.map((p, i) => ({
      x: bank![i * 3].filter(p.x, tMs),
      y: bank![i * 3 + 1].filter(p.y, tMs),
      z: bank![i * 3 + 2].filter(p.z, tMs),
    }))
  }

  reset(slot?: number) {
    if (slot === undefined) this.banks.clear()
    else this.banks.delete(slot)
  }
}
