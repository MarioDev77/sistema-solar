'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useEffect, type ComponentRef, type RefObject } from 'react'
import { planets, planetSizes } from './data'

/** Tipo da instância do OrbitControls do drei (para tipar o ref compartilhado com as câmeras). */
export type OrbitControlsRef = ComponentRef<typeof OrbitControls>

/** Interface mínima do OrbitControls usada pelo CameraRig (evita depender de tipos internos). */
type Controls = {
  target: THREE.Vector3; minDistance: number; maxDistance: number; enablePan: boolean
  addEventListener: (type: 'start', fn: () => void) => void
  removeEventListener: (type: 'start', fn: () => void) => void
}
export const MIN_DIST = .4
export const MAX_DIST = 40
const HOME_POS = new THREE.Vector3(0, 12, 24)
const HOME_TARGET = new THREE.Vector3(0, 0, 0)

/**
 * Câmera: "closeUp" (observar de perto), "follow" (viajar até) e retorno suave à visão geral.
 *
 * Por que não treme:
 *  - NÃO chama controls.update() (o drei já chama, em useFrame com prioridade -1).
 *  - Roda DEPOIS dos corpos (-2) e ANTES do OrbitControls (-1), no mesmo frame.
 *  - Suavização exponencial com delta de tempo (independente de FPS), sem lerp de fator fixo.
 *  - Depois de chegar, "trava" no planeta somando à câmera E ao target o mesmo deslocamento do
 *    planeta a cada frame: o offset relativo não muda, então não há atraso nem oscilação, e o
 *    usuário pode orbitar/dar zoom livremente ao redor do planeta.
 */
export function CameraRig({ followName, closeUp, planetRefs, controlsRef, onFollowEnd, enabled = true }: { followName: string | null; closeUp: string | null; planetRefs: RefObject<Record<string, THREE.Group>>; controlsRef: RefObject<OrbitControlsRef | null>; onFollowEnd: () => void; enabled?: boolean }) {
  const camera = useThree((s) => s.camera)
  const st = useRef({ kind: null as 'closeUp' | 'follow' | null, name: null as string | null, hasLast: false, arrived: false, limited: false, returning: false, bound: null as Controls | null })
  const v = useMemo(() => ({ pos: new THREE.Vector3(), last: new THREE.Vector3(), delta: new THREE.Vector3(), dir: new THREE.Vector3(), want: new THREE.Vector3() }), [])
  const live = useRef({ followName, closeUp, onFollowEnd })
  useEffect(() => { live.current = { followName, closeUp, onFollowEnd } })

  // Quando o usuário começa a arrastar: no closeUp só encerra a transição (continua na vista);
  // no "follow" sai do seguimento; qualquer interação cancela o retorno automático.
  const onStart = useRef(() => {
    const s = st.current, l = live.current
    s.returning = false
    if (l.closeUp) s.arrived = true
    else if (l.followName) l.onFollowEnd()
  })
  useEffect(() => () => {
    const s = st.current
    s.bound?.removeEventListener('start', onStart.current)
    s.bound = null
  }, [])

  useFrame((_, rawDelta) => {
    if (!enabled) return
    const controls = controlsRef.current as unknown as Controls | null
    if (!controls) return
    const s = st.current
    if (s.bound !== controls) {
      s.bound?.removeEventListener('start', onStart.current)
      controls.addEventListener('start', onStart.current)
      s.bound = controls
    }
    const dt = Math.min(rawDelta, .05)
    const kind = closeUp ? 'closeUp' : followName ? 'follow' : null
    const name = closeUp || followName

    // mudou de alvo/modo: reinicia a transição e devolve os limites globais de zoom
    if (kind !== s.kind || name !== s.name) {
      if (!kind && s.kind === 'closeUp') s.returning = true
      if (kind) { s.returning = false; s.hasLast = false; s.arrived = false }
      if (s.limited) { controls.minDistance = MIN_DIST; controls.maxDistance = MAX_DIST; s.limited = false }
      s.kind = kind; s.name = name
    }
    const wantPan = kind !== 'closeUp'
    if (controls.enablePan !== wantPan) controls.enablePan = wantPan

    if (kind && name) {
      const group = planetRefs.current?.[name]
      if (!group) return
      group.getWorldPosition(v.pos)
      if (!s.hasLast) { v.last.copy(v.pos); s.hasLast = true }
      // acompanha o deslocamento do planeta neste frame (câmera e alvo juntos => offset intacto)
      v.delta.copy(v.pos).sub(v.last); v.last.copy(v.pos)
      camera.position.add(v.delta); controls.target.add(v.delta)
      const k = 1 - Math.exp(-dt * 5)

      if (kind === 'closeUp') {
        const size = planetSizes[name] ?? .3
        const dist = size * 4.6 + .5
        if (!s.arrived) {
          controls.target.lerp(v.pos, k)
          v.dir.copy(camera.position).sub(v.pos)
          if (v.dir.lengthSq() < 1e-6) v.dir.set(0, .4, 1)
          v.dir.normalize()
          v.want.copy(v.dir).multiplyScalar(dist).add(v.pos)
          camera.position.lerp(v.want, k)
          if (controls.target.distanceTo(v.pos) < .004 && camera.position.distanceTo(v.want) < .01) s.arrived = true
        }
        // limites de zoom da vista próxima (só aplica quando a câmera já está dentro da faixa, para não dar "snap")
        if (!s.limited) {
          const moons = planets.find((p) => p.name === name)?.moonList ?? []
          const moonMax = Math.max(0, ...moons.map((m) => m.dist)) * size
          const min = size * 1.6
          const max = Math.max(size * 10, moonMax * 3.2, dist * 1.6)
          const d = camera.position.distanceTo(controls.target)
          if (d >= min && d <= max) { controls.minDistance = min; controls.maxDistance = max; s.limited = true }
        }
      } else {
        // "viajar até": centraliza o alvo no planeta mantendo a distância atual da câmera
        v.want.copy(v.pos); v.want.y += .35
        v.dir.copy(v.want).sub(controls.target).multiplyScalar(k)
        controls.target.add(v.dir); camera.position.add(v.dir)
      }
      return
    }

    // volta suavemente ao enquadramento geral depois de sair da vista próxima
    if (s.returning) {
      const k = 1 - Math.exp(-dt * 4)
      controls.target.lerp(HOME_TARGET, k)
      camera.position.lerp(HOME_POS, k)
      if (controls.target.distanceTo(HOME_TARGET) < .02 && camera.position.distanceTo(HOME_POS) < .05) s.returning = false
    }
  }, -1.5)
  return null
}

export function DeepSpaceCameraRig({ enabled, focusName, nebulaRefs, controlsRef }: { enabled: boolean; focusName: string | null; nebulaRefs: RefObject<Record<string, THREE.Object3D>>; controlsRef: RefObject<OrbitControlsRef | null> }) {
  const camera = useThree((state) => state.camera)
  const target = useMemo(() => new THREE.Vector3(), [])
  const desiredCamera = useMemo(() => new THREE.Vector3(), [])
  const state = useRef({ key: '', arrived: false, bound: null as Controls | null, onStart: null as (() => void) | null })
  useEffect(() => { state.current.key = `${enabled ? 'deep' : 'solar'}:${focusName ?? 'overview'}`; state.current.arrived = false }, [enabled, focusName])
  useEffect(() => () => { const s = state.current; if (s.bound && s.onStart) s.bound.removeEventListener('start', s.onStart); s.bound = null; s.onStart = null }, [])
  useFrame((_, rawDelta) => {
    const controls = controlsRef.current as unknown as Controls | null
    if (!controls) return
    const s = state.current
    if (s.bound !== controls) {
      if (s.bound && s.onStart) s.bound.removeEventListener('start', s.onStart)
      const onStart = () => { s.arrived = true }
      controls.addEventListener('start', onStart)
      s.bound = controls
      s.onStart = onStart
    }
    if (!s.key) return
    if (s.arrived) return
    const isDeep = enabled
    const nebula = focusName ? nebulaRefs.current?.[focusName] : null
    if (isDeep && focusName && !nebula) return
    if (isDeep) {
      if (nebula) {
        nebula.getWorldPosition(target)
        const direction = camera.position.clone().sub(controls.target)
        if (direction.lengthSq() < 0.001) direction.set(0, .25, 1)
        direction.normalize()
        desiredCamera.copy(target).addScaledVector(direction, 4.1)
        controls.enablePan = false
        controls.minDistance = 1.15
        controls.maxDistance = 90
      } else {
        target.set(0, 0, 0)
        desiredCamera.set(0, 17, 37)
        controls.enablePan = true
        controls.minDistance = MIN_DIST
        controls.maxDistance = 90
      }
    } else {
      target.copy(HOME_TARGET)
      desiredCamera.copy(HOME_POS)
      controls.enablePan = true
      controls.minDistance = MIN_DIST
      controls.maxDistance = MAX_DIST
    }
    const blend = 1 - Math.exp(-Math.min(rawDelta, .05) * 4.5)
    controls.target.lerp(target, blend)
    camera.position.lerp(desiredCamera, blend)
    if (camera.position.distanceTo(desiredCamera) < .035 && controls.target.distanceTo(target) < .02) s.arrived = true
  }, -1.65)
  return null
}
