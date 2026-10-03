/* Auto-teste com mãos sintéticas. Rodar: npx tsx components/solar/hand/__tests__/gesture-recognizer.selftest.ts */
import { GestureRecognizer } from '../gesture-recognizer'
import type { GestureEvent, GestureFrame } from '../gesture-types'
import type { HandFrame, Landmark, TrackedHand } from '../types'

const ASPECT = 16 / 9
type Pose = { thumb?: number; index?: number; middle?: number; ring?: number; pinky?: number }
type Opts = { cx: number; cy: number; s: number; rot?: number; pose: Pose; pinch?: boolean }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** mão em coordenadas locais (unidades de s, x à direita, y para cima, pulso na origem) */
function hand(slot: 0 | 1, o: Opts): TrackedHand {
  const e = { thumb: 1, index: 1, middle: 1, ring: 1, pinky: 1, ...o.pose }
  const L: [number, number][] = new Array(21)
  L[0] = [0, 0]
  const fing = (mcp: [number, number], l: [number, number, number], ex: number, base: number) => {
    const ext1: [number, number] = [mcp[0], mcp[1] + l[0]], ext2: [number, number] = [mcp[0], ext1[1] + l[1]], ext3: [number, number] = [mcp[0], ext2[1] + l[2]]
    const c1: [number, number] = [mcp[0], mcp[1] + 0.3], c2: [number, number] = [mcp[0], mcp[1] + 0.15], c3: [number, number] = [mcp[0], mcp[1] - 0.35]
    L[base] = mcp
    L[base + 1] = [lerp(c1[0], ext1[0], ex), lerp(c1[1], ext1[1], ex)]
    L[base + 2] = [lerp(c2[0], ext2[0], ex), lerp(c2[1], ext2[1], ex)]
    L[base + 3] = [lerp(c3[0], ext3[0], ex), lerp(c3[1], ext3[1], ex)]
  }
  fing([-0.3, 0.95], [0.38, 0.22, 0.17], e.index, 5)
  fing([0, 1], [0.42, 0.25, 0.18], e.middle, 9)
  fing([0.28, 0.95], [0.4, 0.24, 0.18], e.ring, 13)
  fing([0.55, 0.85], [0.3, 0.17, 0.15], e.pinky, 17)
  L[1] = [-0.35, 0.2]; L[2] = [-0.6, 0.5]
  L[3] = [lerp(-0.35, -0.95, e.thumb), lerp(0.65, 0.7, e.thumb)]
  L[4] = [lerp(-0.1, -1.15, e.thumb), lerp(0.7, 0.8, e.thumb)]
  if (o.pinch) { L[4] = [L[8][0] + 0.04, L[8][1] - 0.04] }
  const rot = o.rot ?? 0, cos = Math.cos(rot), sin = Math.sin(rot)
  const lm: Landmark[] = L.map(([x, y]) => {
    const rx = x * cos + y * sin, ry = -x * sin + y * cos // rot > 0: gira no sentido horário (tela)
    return { x: (o.cx + (rx * o.s) / ASPECT), y: o.cy - ry * o.s, z: 0 }
  })
  return { slot, landmarks: lm, score: 0.95 }
}

class Runner {
  rec = new GestureRecognizer()
  t = 1000
  events: GestureEvent[] = []
  last!: GestureFrame
  step(hands: TrackedHand[], dtMs = 33) {
    this.t += dtMs
    const frame: HandFrame = { time: this.t, aspect: ASPECT, hands }
    this.last = this.rec.update(frame, null, 1)
    this.events.push(...this.last.events)
    return this.last
  }
  hold(fn: (i: number) => TrackedHand[], ms: number) { const n = Math.round(ms / 33); for (let i = 0; i < n; i++) this.step(fn(i)); return this.last }
  has(type: string) { return this.events.some((e) => e.type === type) }
  count(type: string) { return this.events.filter((e) => e.type === type).length }
}

let fails = 0
const check = (name: string, ok: boolean, extra = '') => { console.log(`${ok ? '  ok ' : ' FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails++ }

const open: Pose = {}
const fist: Pose = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }
const pointPose: Pose = { thumb: 0, index: 1, middle: 0, ring: 0, pinky: 0 }

/** losango: mãos inclinadas se encarando, pontas dos indicadores juntas em cima e dos polegares juntas embaixo */
function diamond(cx = 0.5, cy = 0.55, jitter = 0): TrackedHand[] {
  const s = 0.16
  const a = hand(0, { cx: cx - 0.2 / ASPECT * 1.0, cy, s, rot: (50 * Math.PI) / 180, pose: open })
  const b = hand(1, { cx: cx + 0.2 / ASPECT * 1.0, cy, s, rot: (-50 * Math.PI) / 180, pose: open })
  const top = { x: cx + jitter, y: cy - 0.22 }, bot = { x: cx + jitter, y: cy - 0.07 }
  a.landmarks[8] = { ...top, x: top.x - 0.004, z: 0 }; b.landmarks[8] = { ...top, x: top.x + 0.004, z: 0 }
  a.landmarks[4] = { ...bot, x: bot.x - 0.004, z: 0 }; b.landmarks[4] = { ...bot, x: bot.x + 0.004, z: 0 }
  return [a, b]
}

console.log('\n[portal]')
{
  const r = new Runner()
  r.hold(() => [hand(0, { cx: 0.3, cy: 0.5, s: 0.16, pose: open }), hand(1, { cx: 0.7, cy: 0.5, s: 0.16, pose: open })], 300)
  check('mãos abertas separadas não são portal', !r.has('portal-start'))
  const r0 = new Runner()
  const fr = r0.hold(() => diamond(), 200)
  check('portal ainda confirmando aos 200 ms (tempo mínimo)', !r0.has('portal-start'), `label=${fr.label}`)
  check('  ...mas já mostra "…" enquanto confirma', fr.label === 'PORTAL MODE…', fr.label)
  r.hold(() => diamond(), 600)
  check('portal confirmado após ~600 ms', r.has('portal-start') && r.has('engage'), r.last.label)
  check('modo holográfico engajado', r.last.engaged)
  const before = r.last.portal.mid!
  r.hold((i) => diamond(0.5 + i * 0.004), 500)
  const after = r.last.portal.mid!
  check('mover o portal para a direita desloca o centro', after.x - before.x > 0.03, `Δx=${(after.x - before.x).toFixed(3)}`)
  check('offset desde a ativação é positivo em x', r.last.portal.offset.x > 0)
  r.hold(() => [hand(0, { cx: 0.3, cy: 0.5, s: 0.16, pose: open }), hand(1, { cx: 0.7, cy: 0.5, s: 0.16, pose: open })], 600)
  check('portal termina ao abrir as mãos', r.has('portal-end'))
  check('...mas o modo continua engajado', r.last.engaged)
}
{
  const r = new Runner()
  r.hold(() => [hand(0, { cx: 0.42, cy: 0.5, s: 0.16, pose: open }), hand(1, { cx: 0.58, cy: 0.5, s: 0.16, pose: open })], 1200)
  check('palmas lado a lado (quase juntas) não disparam portal', !r.has('portal-start'))
  const r2 = new Runner()
  r2.hold(() => { const d = diamond(); d[0].score = 0.3; return d }, 1000)
  check('confiança baixa da mão bloqueia o portal', !r2.has('portal-start'))
  const r3 = new Runner()
  for (let i = 0; i < 30; i++) r3.step(diamond())
  r3.step([]); r3.step([])
  for (let i = 0; i < 12; i++) r3.step(diamond())
  check('queda curta de 2 frames não zera a confirmação', r3.has('portal-start'))
}

console.log('\n[pinça e apontar]')
{
  const r = new Runner()
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: pointPose })], 500)
  check('apontar confirmado', r.has('point-start'), r.last.label)
  check('cursor é a ponta do indicador', Math.abs(r.last.hands[0].pointer.y - r.last.hands[0].pointer.y) < 1e-9 && r.last.hands[0].pointer.y < 0.5)
  const target = { ...r.last.hands[0].pointer }
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: { thumb: 1, index: 0.8, middle: 0, ring: 0, pinky: 0 }, pinch: true })], 60)
  check('pinça ainda não confirmou aos 60 ms', !r.has('pinch-start'))
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: { thumb: 1, index: 0.8, middle: 0, ring: 0, pinky: 0 }, pinch: true })], 300)
  const ev = r.events.find((e) => e.type === 'pinch-start') as Extract<GestureEvent, { type: 'pinch-start' }> | undefined
  check('pinça confirmada', !!ev, r.last.label)
  if (ev) check('alvo da pinça = onde o indicador estava antes de fechar', Math.hypot(ev.point.x - target.x, ev.point.y - target.y) < 0.06, `Δ=${Math.hypot(ev.point.x - target.x, ev.point.y - target.y).toFixed(3)}`)
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: pointPose })], 400)
  check('soltar a pinça emite pinch-end', r.has('pinch-end'))
  const r2 = new Runner()
  r2.hold((i) => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: pointPose, pinch: i % 2 === 0 })], 800)
  check('tremida (pinça piscando a cada frame) não gera pinch-start', !r2.has('pinch-start'))
  const r3 = new Runner()
  r3.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: fist })], 800)
  check('punho fechado não é pinça nem apontar', !r3.has('pinch-start') && !r3.has('point-start'), r3.last.label)
}

console.log('\n[palma aberta (pausa)]')
{
  const r = new Runner()
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: open })], 800)
  check('palma aos 800 ms ainda não alterna', !r.has('palm-toggle'), r.last.label)
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: open })], 400)
  check('palma estável por ~1,2 s alterna uma vez', r.count('palm-toggle') === 1)
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.16, pose: open })], 2000)
  check('segurar a palma não repete o comando', r.count('palm-toggle') === 1)
  const r2 = new Runner()
  r2.hold((i) => [hand(0, { cx: 0.3 + 0.01 * (i % 40), cy: 0.5, s: 0.16, pose: open })], 3000)
  check('palma em movimento não alterna', !r2.has('palm-toggle'))
  const r3 = new Runner()
  r3.hold(() => [hand(0, { cx: 0.3, cy: 0.5, s: 0.16, pose: open }), hand(1, { cx: 0.7, cy: 0.5, s: 0.16, pose: open })], 1500)
  check('duas mãos abertas não contam como "uma palma"', !r3.has('palm-toggle'))
}

console.log('\n[zoom com duas mãos]')
{
  const r = new Runner()
  const two = (gap: number) => [hand(0, { cx: 0.5 - gap / 2, cy: 0.5, s: 0.14, pose: open }), hand(1, { cx: 0.5 + gap / 2, cy: 0.5, s: 0.14, pose: open })]
  r.hold(() => two(0.3), 500)
  check('zoom confirmado com duas mãos abertas', r.has('zoom-start'), r.last.label)
  let sum = 0
  r.hold((i) => { return two(0.3 + i * 0.006) }, 600)
  sum = r.last.zoom.ratio
  check('afastar as mãos → ratio > 1 (zoom in)', sum > 1.2, `ratio=${sum.toFixed(2)}`)
  let acc = 0
  const rr = new Runner()
  rr.hold(() => two(0.5), 500)
  for (let i = 0; i < 18; i++) { const f = rr.step(two(0.5 - i * 0.01)); acc += f.zoom.delta }
  check('aproximar as mãos → delta acumulado negativo (zoom out)', acc < -0.1, `Σδ=${acc.toFixed(3)}`)
  const r2 = new Runner()
  r2.hold((i) => two(0.4 + 0.0007 * Math.sin(i * 2.1)), 1000)
  let jitterSum = 0
  for (let i = 0; i < 20; i++) jitterSum += Math.abs(r2.step(two(0.4 + 0.0007 * Math.sin(i * 2.1))).zoom.delta)
  check('tremor mínimo não gera zoom (zona morta)', jitterSum < 0.02, `Σ|δ|=${jitterSum.toFixed(4)}`)
}

console.log('\n[giro com duas mãos]')
{
  const spin = (dir: number) => {
    const r = new Runner()
    const mk = (th: number) => [
      hand(0, { cx: 0.5 - (0.2 * Math.cos(th)) / ASPECT, cy: 0.5 - 0.2 * Math.sin(th), s: 0.14, pose: open }),
      hand(1, { cx: 0.5 + (0.2 * Math.cos(th)) / ASPECT, cy: 0.5 + 0.2 * Math.sin(th), s: 0.14, pose: open }),
    ]
    r.hold(() => mk(0), 300)
    r.hold((i) => mk(dir * i * 0.07), 1500) // ~2,1 rad/s
    return r
  }
  const cw = spin(1), ccw = spin(-1)
  check('giro horário detectado (velocity > 0)', cw.has('spin-start') && cw.last.spin.velocity > 1, `ω=${cw.last.spin.velocity.toFixed(2)} ${cw.last.label}`)
  check('giro anti-horário detectado (velocity < 0)', ccw.has('spin-start') && ccw.last.spin.velocity < -1, `ω=${ccw.last.spin.velocity.toFixed(2)} ${ccw.last.label}`)
  check('durante o giro rápido o zoom não fica ativo', cw.last.zoom.state !== 'active' && ccw.last.zoom.state !== 'active')
}

console.log('\n[empurrar / puxar]')
{
  const grow = (from: number, to: number, n: number) => (i: number) => [hand(0, { cx: 0.5, cy: 0.5, s: from + ((to - from) * Math.min(i, n)) / n, pose: open })]
  const r = new Runner()
  r.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.12, pose: open })], 300)
  r.hold(grow(0.12, 0.2, 8), 400)
  check('empurrar (mão cresce rápido) → push', r.has('push') && !r.has('pull'), r.last.label)
  const p = new Runner()
  p.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.2, pose: open })], 300)
  p.hold(grow(0.2, 0.13, 12), 650)
  check('puxar (mão encolhe) → pull', p.has('pull') && !p.has('push'))
  const slow = new Runner()
  slow.hold(() => [hand(0, { cx: 0.5, cy: 0.5, s: 0.12, pose: open })], 300)
  slow.hold(grow(0.12, 0.2, 45), 1500)
  check('estender a mão devagar não dispara push', !slow.has('push'))
  const lat = new Runner()
  lat.hold((i) => [hand(0, { cx: 0.2 + i * 0.01, cy: 0.5, s: 0.12, pose: open })], 600)
  check('mover a mão para o lado não dispara push/pull', !lat.has('push') && !lat.has('pull'))
}

console.log('\n[modo engajado]')
{
  const r = new Runner()
  r.hold(() => diamond(), 800)
  r.hold(() => [], 6000)
  check('sem mãos por 5 s encerra o modo (timeout)', r.events.some((e) => e.type === 'disengage' && e.reason === 'timeout') && !r.last.engaged)
}

console.log(fails === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${fails} FALHA(S)`)
process.exit(fails === 0 ? 0 : 1)
