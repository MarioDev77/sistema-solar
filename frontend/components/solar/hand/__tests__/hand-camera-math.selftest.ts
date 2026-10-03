/* Rodar: npx tsx components/solar/hand/__tests__/hand-camera-math.selftest.ts */
import * as THREE from 'three'
import { HAND_GAIN, keepClear, orbitStep } from '../hand-camera-math'

let fails = 0
const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? '  ok ' : ' FAIL'}  ${n}${x ? ' — ' + x : ''}`); if (!ok) fails++ }
const LIM = { minDist: 0.4, maxDist: 40, minPhi: 0.2, maxPhi: Math.PI - 0.2 }
const home = () => new THREE.Vector3(0, 12, 24)

{
  const o = home(); const d0 = o.length()
  orbitStep(o, 0.3, 0, 0, LIM)
  check('theta > 0 leva a câmera para +x e mantém a distância', o.x > 0 && Math.abs(o.length() - d0) < 1e-9, `x=${o.x.toFixed(2)}`)
  const p = home(); const y0 = p.y
  orbitStep(p, 0, -0.2, 0, LIM)
  check('phi menor = câmera mais alta (olha mais de cima)', p.y > y0)
  const hi = new THREE.Vector3(0, 40, 0.001); orbitStep(hi, 0, -5, 0, LIM)
  check('inclinação nunca passa do polo (phi mínimo)', new THREE.Spherical().setFromVector3(hi).phi >= 0.2 - 1e-9)
  const lo = home(); orbitStep(lo, 0, 5, 0, LIM)
  check('inclinação nunca passa do polo inferior', new THREE.Spherical().setFromVector3(lo).phi <= Math.PI - 0.2 + 1e-9)
}
{
  const z = home(); const d0 = z.length(); orbitStep(z, 0, 0, 0.2, LIM)
  check('mãos se afastando (ln>0) aproxima a câmera', z.length() < d0, `${d0.toFixed(1)} → ${z.length().toFixed(1)}`)
  const w = home(); const e0 = w.length(); orbitStep(w, 0, 0, -0.2, LIM)
  check('mãos se aproximando afasta a câmera', w.length() > e0)
  const dolly = home(); for (let i = 0; i < 400; i++) orbitStep(dolly, 0, 0, 0.1, LIM)
  check('zoom in contínuo para no limite mínimo', Math.abs(dolly.length() - LIM.minDist) < 1e-6, dolly.length().toFixed(3))
  const out = home(); for (let i = 0; i < 400; i++) orbitStep(out, 0, 0, -0.1, LIM)
  check('zoom out contínuo para no limite máximo', Math.abs(out.length() - LIM.maxDist) < 1e-6)
  const same = home(); orbitStep(same, 0, 0, 0.1, LIM)
  const ratio = same.length() / home().length()
  check('zoom é exponencial (independente da distância)', Math.abs(ratio - Math.exp(-0.1 * HAND_GAIN.zoom)) < 1e-9)
}
{
  const planet = new THREE.Vector3(6, 0, 0)
  const cam = new THREE.Vector3(6.1, 0.1, 0.05)
  const pushed = keepClear(cam, [{ pos: planet, radius: 0.5 }])
  check('câmera dentro do planeta é empurrada para a superfície de segurança', pushed && Math.abs(cam.distanceTo(planet) - 0.5) < 1e-9)
  const far = new THREE.Vector3(0, 12, 24)
  check('câmera longe não é mexida', !keepClear(far, [{ pos: planet, radius: 0.5 }]))
  const exact = planet.clone()
  keepClear(exact, [{ pos: planet, radius: 0.5 }])
  check('câmera exatamente no centro não vira NaN', Number.isFinite(exact.x + exact.y + exact.z) && exact.distanceTo(planet) > 0.49)
}
{
  // suavização: o acumulador consumido por frame com k=1-exp(-dt*16) soma o total sem perder nada
  let acc = 1, applied = 0
  for (let i = 0; i < 120; i++) { const k = 1 - Math.exp(-(1 / 60) * 16); applied += acc * k; acc -= acc * k }
  check('o deslocamento acumulado é aplicado por inteiro (sem perder movimento)', Math.abs(applied - 1) < 1e-3, applied.toFixed(4))
  let spinV = 0
  for (let i = 0; i < 60; i++) spinV += (1 - spinV) * (1 - Math.exp(-(1 / 60) * 7))
  const rise = spinV
  for (let i = 0; i < 60; i++) spinV += (0 - spinV) * (1 - Math.exp(-(1 / 60) * 2.5))
  check('giro tem inércia: sobe rápido e para devagar', rise > 0.95 && spinV > 0.05 && spinV < 0.2, `subiu ${rise.toFixed(2)}, 1 s depois ${spinV.toFixed(2)}`)
}
console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${fails} FALHA(S)`)
process.exit(fails === 0 ? 0 : 1)
