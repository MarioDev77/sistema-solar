/* Rodar: npx tsx components/solar/hand/__tests__/planet-interaction.selftest.ts */
import { PlanetInteraction } from '../planet-interaction'
import { pickPlanet, projectedRadius, type Candidate } from '../planet-selection'
import type { GestureEvent, GestureFrame, HandGestureInfo } from '../gesture-types'

let fails = 0
const check = (n: string, ok: boolean, x = '') => { console.log(`${ok ? '  ok ' : ' FAIL'}  ${n}${x ? ' — ' + x : ''}`); if (!ok) fails++ }
const W = 1000, H = 600
const cands: Candidate[] = [
  { name: 'Júpiter', x: 400, y: 300, r: 40, depth: 14 },
  { name: 'Saturno', x: 700, y: 300, r: 36, depth: 18 },
  { name: 'Mercúrio', x: 100, y: 300, r: 3, depth: 20 },
]

// ── seleção ──
check('acerta o centro do planeta', pickPlanet(cands, 405, 305) === 'Júpiter')
check('longe de tudo não seleciona', pickPlanet(cands, 550, 100) === null)
check('planeta minúsculo continua fácil de apontar (≥28 px)', pickPlanet(cands, 100 + 24, 300) === 'Mercúrio')
check('histerese: o planeta em foco aceita um raio maior', pickPlanet(cands, 400 + 60, 300) === null && pickPlanet(cands, 400 + 60, 300, 'Júpiter') === 'Júpiter')
check('sobreposição: vence o mais próximo da câmera', pickPlanet([{ name: 'A', x: 0, y: 0, r: 40, depth: 9 }, { name: 'B', x: 0, y: 0, r: 40, depth: 5 }], 0, 0) === 'B')
check('raio projetado cresce quando a câmera chega perto', projectedRadius(0.78, 10, 44, 600) < projectedRadius(0.78, 5, 44, 600))

// ── máquina de estados ──
type Opts = { events?: GestureEvent[]; hands?: HandGestureInfo[]; engaged?: boolean; portal?: boolean }
const hand = (slot: 0 | 1, o: { point?: 'idle' | 'arming' | 'active'; pinch?: 'idle' | 'arming' | 'active'; ptr?: [number, number]; pp?: [number, number]; start?: [number, number] | null } = {}): HandGestureInfo => ({
  slot, size: 0.2, center: { x: 0.5, y: 0.5 }, extended: [true, true, false, false, false],
  pointer: { x: (o.ptr ?? [0.4, 0.5])[0], y: (o.ptr ?? [0.4, 0.5])[1] },
  point: { state: o.point ?? 'idle' },
  pinch: { state: o.pinch ?? 'idle', distance: 0.2, point: { x: (o.pp ?? [0.4, 0.5])[0], y: (o.pp ?? [0.4, 0.5])[1] }, start: o.start ? { x: o.start[0], y: o.start[1] } : null },
})
const frame = (t: number, o: Opts = {}): GestureFrame => ({
  time: t, aspect: 1.33, engaged: o.engaged ?? true, primary: 'none', label: '—', hands: o.hands ?? [], events: o.events ?? [],
  portal: { state: o.portal ? 'active' : 'idle', progress: 0, confidence: 0, mid: null, radius: 0, delta: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, points: null },
  zoom: { state: 'idle', ratio: 1, delta: 0 }, spin: { state: 'idle', velocity: 0 }, palm: { state: 'idle', progress: 0, slot: null },
})
const types = (c: { type: string }[]) => c.map((x) => x.type).join(',')

// 1) apontar sobre Júpiter: só vira hover depois do tempo de estabilidade
{
  const pi = new PlanetInteraction()
  const pointing = [hand(0, { point: 'active', ptr: [0.4, 0.5] })]
  let c = pi.update(frame(0, { hands: pointing }), cands, W, H, 0, true)
  check('hover não dispara no primeiro frame (evita acidente)', c.length === 0 && pi.view.hover === null)
  c = pi.update(frame(120, { hands: pointing }), cands, W, H, 120, true)
  check('hover dispara depois de ~90 ms estável', types(c) === 'hover' && pi.view.hover === 'Júpiter')
  // passou rápido por cima de outro planeta: não troca
  c = pi.update(frame(150, { hands: [hand(0, { point: 'active', ptr: [0.7, 0.5] })] }), cands, W, H, 150, true)
  check('passada rápida por outro planeta não troca o foco', pi.view.hover === 'Júpiter')
  // dedo some: o foco permanece um instante e depois solta
  pi.update(frame(200), cands, W, H, 200, true)
  check('foco persiste brevemente sem o dedo (tolera falha de rastreamento)', pi.view.hover === 'Júpiter')
  c = pi.update(frame(520), cands, W, H, 520, true)
  check('foco solta depois de ~280 ms sem apontar', pi.view.hover === null && types(c) === 'hover')
}

// 2) pinça sem mover: seleciona, não arrasta, não congela
{
  const pi = new PlanetInteraction()
  let c = pi.update(frame(0, { hands: [hand(0, { pinch: 'active', pp: [0.4, 0.5] })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  check('pinça sobre Júpiter agarra', types(c).includes('grab') && pi.view.held?.name === 'Júpiter')
  c = pi.update(frame(100, { hands: [hand(0, { pinch: 'active', pp: [0.41, 0.5] })] }), cands, W, H, 100, true)
  check('tremor pequeno (<18 px) não inicia arrasto', c.length === 0 && pi.view.held?.moved === false)
  c = pi.update(frame(200, { hands: [hand(0, { pinch: 'idle' })], events: [{ type: 'pinch-end', slot: 0 }] }), cands, W, H, 200, true)
  check('soltar sem arrastar avisa moved=false', c.some((x) => x.type === 'release' && !x.moved) && pi.view.held === null)
}

// 3) pinça + arrastar + soltar
{
  const pi = new PlanetInteraction()
  pi.update(frame(0, { hands: [hand(0, { pinch: 'active', pp: [0.7, 0.5] })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.7, y: 0.5 } }] }), cands, W, H, 0, true)
  const c = pi.update(frame(100, { hands: [hand(0, { pinch: 'active', pp: [0.78, 0.4] })] }), cands, W, H, 100, true)
  check('mover a pinça >18 px inicia o arrasto uma única vez', types(c) === 'drag-start' && pi.view.held?.moved === true)
  check('posição da pinça é entregue em pixels', Math.abs((pi.dragPx?.x ?? 0) - 780) < 1e-6 && Math.abs((pi.dragPx?.y ?? 0) - 240) < 1e-6)
  const again = pi.update(frame(150, { hands: [hand(0, { pinch: 'active', pp: [0.8, 0.4] })] }), cands, W, H, 150, true)
  check('arrasto não repete drag-start', again.length === 0)
  const rel = pi.update(frame(300, { hands: [hand(0, { pinch: 'idle' })], events: [{ type: 'pinch-end', slot: 0 }] }), cands, W, H, 300, true)
  check('soltar depois de arrastar avisa moved=true', rel.some((x) => x.type === 'release' && x.moved))
}

// 4) alvo = onde o indicador mirava, não onde a pinça acabou
{
  const pi = new PlanetInteraction()
  pi.update(frame(0, { hands: [hand(0, { pinch: 'active', pp: [0.55, 0.9] })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  check('usa a mira anterior ao fechamento da pinça', pi.view.held?.name === 'Júpiter')
}

// 5) pinça no vazio não agarra; memória do hover cobre pequeno desvio
{
  const pi = new PlanetInteraction()
  const c = pi.update(frame(0, { hands: [hand(0, { pinch: 'active' })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.55, y: 0.1 } }] }), cands, W, H, 0, true)
  check('pinça no vazio não agarra nada', c.length === 0 && pi.view.held === null)
}

// 6) segurança
{
  const pi = new PlanetInteraction()
  pi.update(frame(0, { hands: [hand(0, { pinch: 'active', pp: [0.4, 0.5] })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  let c = pi.update(frame(100, { hands: [], engaged: true }), cands, W, H, 100, true)
  check('mão some por pouco tempo: continua segurando', pi.view.held !== null && c.length === 0)
  c = pi.update(frame(600, { hands: [] }), cands, W, H, 600, true)
  check('mão perdida por >350 ms solta o planeta', c.some((x) => x.type === 'release') && pi.view.held === null)

  const pj = new PlanetInteraction()
  pj.update(frame(0, { hands: [hand(0, { pinch: 'active', pp: [0.4, 0.5] })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  c = pj.update(frame(50, { engaged: false }), cands, W, H, 50, true)
  check('encerrar o modo holográfico solta o planeta', c.some((x) => x.type === 'release') && pj.view.held === null)

  const pk = new PlanetInteraction()
  c = pk.update(frame(0, { engaged: false, hands: [hand(0, { pinch: 'active' })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  check('fora do modo holográfico a pinça é ignorada', c.length === 0 && pk.view.held === null)

  const pl = new PlanetInteraction()
  c = pl.update(frame(0, { portal: true, hands: [hand(0, { pinch: 'active' })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, true)
  check('com o portal ativo não agarra planeta por engano', pl.view.held === null)

  const pm = new PlanetInteraction()
  c = pm.update(frame(0, { hands: [hand(0, { pinch: 'active' })], events: [{ type: 'pinch-start', slot: 0, point: { x: 0.4, y: 0.5 } }] }), cands, W, H, 0, false)
  check('com a cena não interativa (vista próxima) nada é agarrado', pm.view.held === null)
}

console.log(fails === 0 ? '\nTudo certo.' : `\n${fails} falha(s).`)
process.exit(fails === 0 ? 0 : 1)
