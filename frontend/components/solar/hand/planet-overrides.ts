import * as THREE from 'three'

/**
 * Planetas tirados da órbita pela mão. Fica fora do React: o Planet lê `get(name)` a cada frame
 * e, se houver posição, usa-a no lugar da órbita. Soltar deixa o planeta onde está;
 * restaurar faz o planeta voltar suavemente até a posição orbital atual e só então remove a exceção.
 */
export type PlanetOverride = { pos: THREE.Vector3; held: boolean; returning: boolean }

type Spin = { v: number; target: number; angle: number; driven: boolean }

export class PlanetOverrides {
  private map = new Map<string, PlanetOverride>()
  private spins = new Map<string, Spin>()
  private listeners = new Set<(names: string[]) => void>()

  get(name: string) { return this.map.get(name) }
  names() { return [...this.map.keys()] }
  entries() { return this.map.entries() }
  get size() { return this.map.size }

  subscribe(fn: (names: string[]) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }

  /** Começa (ou retoma) o controle manual a partir da posição atual do planeta. */
  hold(name: string, pos: THREE.Vector3) {
    const cur = this.map.get(name)
    if (cur) { cur.held = true; cur.returning = false; return cur }
    const ov: PlanetOverride = { pos: pos.clone(), held: true, returning: false }
    this.map.set(name, ov); this.emit()
    return ov
  }

  /** Larga o planeta onde ele está. */
  drop(name: string) { const ov = this.map.get(name); if (ov) ov.held = false }

  restore(name: string) { const ov = this.map.get(name); if (ov && !ov.held) ov.returning = true }
  restoreAll() { for (const ov of this.map.values()) if (!ov.held) ov.returning = true; for (const sp of this.spins.values()) { sp.driven = false; sp.target = 0 } }

  remove(name: string) { if (this.map.delete(name)) this.emit() }
  clear() { if (this.map.size) { this.map.clear(); this.emit() } }

  // ── rotação do planeta (rad/s extra sobre a rotação própria) ──
  /** Define a velocidade desejada. driven=true enquanto a mão controla; false = inércia (desacelera sozinho). */
  setSpin(name: string, target: number, driven: boolean) {
    let sp = this.spins.get(name)
    if (!sp) { if (!driven && target === 0) return; sp = { v: 0, target: 0, angle: 0, driven: false }; this.spins.set(name, sp) }
    sp.target = driven ? target : 0; sp.driven = driven
  }
  spinAngle(name: string) { return this.spins.get(name)?.angle ?? 0 }
  spinSpeed(name: string) { return this.spins.get(name)?.v ?? 0 }
  /** Avança a física da rotação: acompanha a mão rápido e perde velocidade devagar quando solta. */
  stepSpin(dt: number) {
    for (const sp of this.spins.values()) {
      const k = sp.driven ? 6 : 0.9
      sp.v += (sp.target - sp.v) * (1 - Math.exp(-dt * k))
      if (!sp.driven && Math.abs(sp.v) < 0.004) sp.v = 0
      sp.angle += sp.v * dt
    }
  }
  /** Zera a rotação extra (restaurar tudo). */
  clearSpin() { this.spins.clear() }

  private emit() { const names = this.names(); for (const fn of this.listeners) fn(names) }
}
