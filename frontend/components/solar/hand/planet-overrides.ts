import * as THREE from 'three'

/**
 * Planetas tirados da órbita pela mão. Fica fora do React: o Planet lê `get(name)` a cada frame
 * e, se houver posição, usa-a no lugar da órbita. Soltar deixa o planeta onde está;
 * restaurar faz o planeta voltar suavemente até a posição orbital atual e só então remove a exceção.
 */
export type PlanetOverride = { pos: THREE.Vector3; held: boolean; returning: boolean }

export class PlanetOverrides {
  private map = new Map<string, PlanetOverride>()
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
  restoreAll() { for (const ov of this.map.values()) if (!ov.held) ov.returning = true }

  remove(name: string) { if (this.map.delete(name)) this.emit() }
  clear() { if (this.map.size) { this.map.clear(); this.emit() } }

  private emit() { const names = this.names(); for (const fn of this.listeners) fn(names) }
}
