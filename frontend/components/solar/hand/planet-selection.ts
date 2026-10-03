/**
 * PlanetSelection: escolhe qual planeta está "sob o dedo". Tudo em pixels da janela.
 * A área de acerto é generosa de propósito (mão no ar é bem menos precisa que mouse) e tem
 * histerese: o planeta que já está em foco aceita um raio maior, então o alvo não "pisca" com o tremor.
 */
export type Candidate = { name: string; x: number; y: number; r: number; depth: number }

const MIN_HIT = 28 // px: mesmo um Mercúrio minúsculo é fácil de apontar
const HIT_SCALE = 1.2
const STICKY = 1.45

export const hitRadius = (c: Candidate, sticky = false) => Math.max(c.r * HIT_SCALE, MIN_HIT) * (sticky ? STICKY : 1)

/** Planeta mais "no centro" do ponto (x, y); em empate vence o mais próximo da câmera. */
export function pickPlanet(cands: readonly Candidate[], x: number, y: number, current: string | null = null): string | null {
  let best: string | null = null
  let bestScore = Infinity
  let bestDepth = Infinity
  for (const c of cands) {
    const limit = hitRadius(c, c.name === current)
    const d = Math.hypot(c.x - x, c.y - y)
    if (d > limit) continue
    const score = d / limit - (c.name === current ? 0.25 : 0)
    if (score < bestScore - 1e-6 || (Math.abs(score - bestScore) <= 1e-6 && c.depth < bestDepth)) {
      best = c.name; bestScore = score; bestDepth = c.depth
    }
  }
  return best
}

/** Raio, em pixels, de uma esfera de raio `size` a `distance` da câmera (perspectiva, fov vertical em graus). */
export function projectedRadius(size: number, distance: number, fovDeg: number, heightPx: number) {
  const t = Math.tan((fovDeg * Math.PI) / 360)
  return distance > 1e-6 && t > 0 ? (size / (distance * t)) * (heightPx / 2) : heightPx
}
