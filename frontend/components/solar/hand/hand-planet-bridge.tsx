'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { planetAngle, type SimClock } from '../clock'
import { planets } from '../data'
import type { GestureFrame } from './gesture-types'
import type { HandTrackingController } from './hand-tracking-controller'
import { PlanetInteraction, type InteractionCommand } from './planet-interaction'
import type { PlanetOverrides } from './planet-overrides'
import { projectedRadius, type Candidate } from './planet-selection'

const STALE_MS = 400 // sem frames de gesto por tanto tempo: trata como "sem mãos" e solta o que estiver segurado
const FOLLOW_RATE = 12 // 1/s: o planeta alcança a mão suavemente (sem saltar)
const RETURN_RATE = 4.5
const MAX_RADIUS = 45 // o planeta não vai para o infinito
const SUN_CLEAR = 1.9 // não deixa o planeta entrar no Sol
const SPIN_GAIN = 1.2 // rad/s de giro do planeta por rad/s de giro da mão
const TRAIL_MAX = 40
const TRAIL_LIFE_MS = 1100
const TRAIL_STEP_PX = 5
const RING_FACTOR: Record<string, number> = { 'Saturno': 1.9 } // os anéis também contam como "acertar o planeta"

type Props = {
  controller: HandTrackingController | null
  interaction: PlanetInteraction
  overrides: PlanetOverrides
  planetRefs: RefObject<Record<string, THREE.Group>>
  clock: RefObject<SimClock>
  /** false em vista próxima / seguindo / espaço profundo: não agarra planeta (apontar e informar continua) */
  interactive: boolean
  /** planeta em foco para a interface (cartão de dados): muda quando o alvo ou o estado "segurado" muda */
  onFocus: (focus: { name: string; held: boolean } | null) => void
  onSelect: (name: string) => void
}

/**
 * Ponte mãos → planetas (dentro do <Canvas>). Fluxo:
 *  1. a cada frame projeta os planetas na tela (candidatos para apontar/agarrar);
 *  2. a cada GestureFrame roda o PlanetInteraction e executa os comandos (selecionar, agarrar, soltar);
 *  3. enquanto agarrado e movendo, traça um raio câmera→pinça e leva o planeta ao ponto do plano
 *     perpendicular à câmera que passa por ele, com suavização exponencial;
 *  4. planetas soltos ficam onde foram deixados; "restaurar órbita" os leva de volta suavemente.
 * Prioridade -2.5: depois do relógio (-3) e antes de os planetas se posicionarem (-2).
 */
export function HandPlanetBridge({ controller, interaction, overrides, planetRefs, clock, interactive, onFocus, onSelect }: Props) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const live = useRef({ last: null as GestureFrame | null, lastAt: -1e9, interactive, onFocus, onSelect, cands: [] as Candidate[], dragName: null as string | null, key: '' })
  const pool = useMemo(() => new Map<string, Candidate>(), [])
  const v = useMemo(() => ({
    p: new THREE.Vector3(), ndc: new THREE.Vector3(), dir: new THREE.Vector3(), hit: new THREE.Vector3(),
    offset: new THREE.Vector3(), target: new THREE.Vector3(), plane: new THREE.Plane(), ray: new THREE.Ray(),
  }), [])

  useEffect(() => { Object.assign(live.current, { interactive, onFocus, onSelect }) })

  /** raio câmera → pixel da janela, cortado no plano de arrasto. */
  const rayOnPlane = (px: { x: number; y: number }, out: THREE.Vector3) => {
    const rect = gl.domElement.getBoundingClientRect()
    v.ndc.set(((px.x - rect.left) / rect.width) * 2 - 1, -(((px.y - rect.top) / rect.height) * 2 - 1), 0.5).unproject(camera)
    v.dir.copy(v.ndc).sub(camera.position).normalize()
    v.ray.set(camera.position, v.dir)
    return v.ray.intersectPlane(v.plane, out) !== null
  }

  const run = (cmds: InteractionCommand[]) => {
    for (const c of cmds) {
      if (c.type === 'grab') {
        live.current.onSelect(c.name)
        controller?.notify(`${c.name.toUpperCase()} SELECIONADO`)
      } else if (c.type === 'drag-start') {
        // só agora o planeta sai da órbita: pinçar sem mexer apenas seleciona
        const group = planetRefs.current?.[c.name]
        if (!group) continue
        group.getWorldPosition(v.p)
        const ov = overrides.hold(c.name, v.p)
        ov.pos.copy(v.p)
        camera.getWorldDirection(v.dir)
        v.plane.setFromNormalAndCoplanarPoint(v.dir, v.p)
        // o deslocamento inicial (<18 px) é "perdoado": o planeta não dá salto ao começar
        if (interaction.dragPx && rayOnPlane(interaction.dragPx, v.hit)) v.offset.copy(v.p).sub(v.hit)
        else v.offset.set(0, 0, 0)
        live.current.dragName = c.name
        interaction.view.trail.length = 0
      } else if (c.type === 'rotate-start') {
        controller?.notify(`GIRANDO ${c.name.toUpperCase()}`)
      } else if (c.type === 'release') {
        if (c.moved) overrides.drop(c.name)
        live.current.dragName = null
        controller?.notify('OBJETO LIBERADO')
      }
    }
    const { held, hover } = interaction.view
    const name = held?.name ?? hover
    const key = name ? `${name}|${held ? 1 : 0}` : ''
    if (key !== live.current.key) { live.current.key = key; live.current.onFocus(name ? { name, held: !!held } : null) }
  }

  useEffect(() => {
    if (!controller) return
    const off = controller.subscribeGestures((g) => {
      const now = performance.now()
      live.current.last = g; live.current.lastAt = now
      run(interaction.update(g, live.current.cands, window.innerWidth, window.innerHeight, now, live.current.interactive))
    })
    return () => { off(); run(interaction.drop()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, interaction])

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    const now = performance.now()
    const s = live.current
    const rect = gl.domElement.getBoundingClientRect()
    const fresh = !!s.last && now - s.lastAt < STALE_MS
    const view = interaction.view

    if (!fresh && (view.held || view.hover)) run(interaction.drop())

    // 1) planetas projetados na tela (só enquanto há gestos recentes e modo holográfico ligado)
    const cands = s.cands
    cands.length = 0
    if (fresh && s.last?.engaged) {
      for (const p of planets) {
        const group = planetRefs.current?.[p.name]
        if (!group) continue
        group.getWorldPosition(v.p)
        v.ndc.copy(v.p).project(camera)
        if (v.ndc.z < -1 || v.ndc.z > 1) continue
        let c = pool.get(p.name)
        if (!c) { c = { name: p.name, x: 0, y: 0, r: 0, depth: 0 }; pool.set(p.name, c) }
        c.depth = camera.position.distanceTo(v.p)
        c.x = rect.left + (v.ndc.x * 0.5 + 0.5) * rect.width
        c.y = rect.top + (-v.ndc.y * 0.5 + 0.5) * rect.height
        c.r = projectedRadius(p.size * (RING_FACTOR[p.name] ?? 1), c.depth, camera.fov, rect.height)
        cands.push(c)
      }
    }

    // 2) planeta em destaque para o overlay (anel, nome, trajetória)
    const focusName = view.held?.name ?? view.hover
    const fc = focusName ? cands.find((c) => c.name === focusName) : undefined
    view.focus = fc ? { name: fc.name, x: fc.x, y: fc.y, r: Math.max(fc.r, 10), mode: view.held ? 'held' : 'hover' } : null

    // 3) arrasto: o planeta persegue o ponto da pinça no plano da câmera
    const held = view.held
    if (held?.moved && interaction.dragPx) {
      const ov = overrides.get(held.name)
      if (ov && rayOnPlane(interaction.dragPx, v.hit)) {
        v.target.copy(v.hit).add(v.offset)
        const r = Math.hypot(v.target.x, v.target.z)
        const min = SUN_CLEAR + (planets.find((p) => p.name === held.name)?.size ?? 0.3)
        if (v.target.length() < min) v.target.setLength(min)
        if (r > MAX_RADIUS) { v.target.x *= MAX_RADIUS / r; v.target.z *= MAX_RADIUS / r }
        ov.pos.lerp(v.target, 1 - Math.exp(-dt * FOLLOW_RATE))
        if (fc) {
          const tr = view.trail, last = tr[tr.length - 1]
          if (!last || Math.hypot(last.x - fc.x, last.y - fc.y) > TRAIL_STEP_PX) {
            tr.push({ x: fc.x, y: fc.y, t: now })
            if (tr.length > TRAIL_MAX) tr.shift()
          }
        }
      }
    }
    if (view.trail.length) { // a trajetória some sozinha depois que o gesto termina
      const tr = view.trail
      while (tr.length && now - tr[0].t > TRAIL_LIFE_MS) tr.shift()
    }

    // 3b) rotação do planeta: o círculo da mão define sentido e velocidade; ao soltar, a inércia desacelera
    for (const p of planets) {
      const driven = held?.name === p.name && held.rotating
      if (driven) overrides.setSpin(p.name, held!.omega * SPIN_GAIN, true)
      else if (overrides.spinSpeed(p.name) !== 0 || overrides.spinAngle(p.name) !== 0) overrides.setSpin(p.name, 0, false)
    }
    overrides.stepSpin(dt)

    // 4) planetas soltos que estão voltando para a órbita
    if (overrides.size) {
      for (const [name, ov] of overrides.entries()) {
        if (!ov.returning || ov.held) continue
        const data = planets.find((p) => p.name === name)
        if (!data) { overrides.remove(name); continue }
        const ang = planetAngle(data.orbit, clock.current.t)
        v.target.set(Math.cos(ang) * data.orbit, 0, Math.sin(ang) * data.orbit)
        ov.pos.lerp(v.target, 1 - Math.exp(-dt * RETURN_RATE))
        if (ov.pos.distanceTo(v.target) < 0.03) overrides.remove(name) // encaixa de volta na órbita sem salto
      }
    }
  }, -2.5)

  return null
}
