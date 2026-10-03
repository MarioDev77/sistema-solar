import * as THREE from 'three'

/** Ganhos da tradução gesto → câmera. Unidades: alturas de quadro da webcam (mover) e ln(razão) (zoom). */
export const HAND_GAIN = {
  azimuth: 2.4, // rad por altura de quadro de deslocamento horizontal do portal
  polar: 1.6, // rad por altura de quadro de deslocamento vertical
  zoom: 1.5, // ln(distância da câmera) por ln(razão entre as mãos)
  spin: 0.55, // rad/s de rotação da cena por rad/s de giro das mãos
  spinMax: 2.2, // rad/s: limite da rotação da cena
} as const

export type OrbitLimits = { minDist: number; maxDist: number; minPhi: number; maxPhi: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const _sph = new THREE.Spherical()

/**
 * Aplica ao vetor câmera→alvo uma rotação em azimute (theta, em torno de Y), uma inclinação (phi)
 * e um zoom logarítmico. Mesma convenção do OrbitControls: theta > 0 leva a câmera para +x.
 * zoomLn > 0 aproxima (mãos se afastando), < 0 afasta. Sempre respeita os limites de distância e inclinação.
 */
export function orbitStep(offset: THREE.Vector3, dTheta: number, dPhi: number, zoomLn: number, lim: OrbitLimits) {
  _sph.setFromVector3(offset)
  _sph.theta += dTheta
  _sph.phi = clamp(_sph.phi + dPhi, lim.minPhi, lim.maxPhi)
  _sph.radius = clamp(_sph.radius * Math.exp(-zoomLn * HAND_GAIN.zoom), lim.minDist, lim.maxDist)
  offset.setFromSpherical(_sph)
  return offset
}

export type Body = { pos: THREE.Vector3; radius: number }

/** Se a câmera entrou numa esfera de segurança (planeta, Sol), empurra-a para a superfície dela. */
export function keepClear(cam: THREE.Vector3, bodies: Body[]) {
  let pushed = false
  for (const b of bodies) {
    const d = cam.distanceTo(b.pos)
    if (d < b.radius) {
      if (d < 1e-6) cam.set(b.pos.x, b.pos.y + b.radius, b.pos.z + 1e-3)
      else cam.sub(b.pos).setLength(b.radius).add(b.pos)
      pushed = true
    }
  }
  return pushed
}
