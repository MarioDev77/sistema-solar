'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { type OrbitControlsRef } from '../camera'
import { planetSizes } from '../data'
import { HAND_GAIN, keepClear, orbitStep, type Body } from './hand-camera-math'
import type { HandTrackingController } from './hand-tracking-controller'

type Controls = { target: THREE.Vector3; minDistance: number; maxDistance: number; dispatchEvent: (e: { type: string }) => void }

const STALE_MS = 400 // sem frames de gesto por tanto tempo (câmera desligada, aba em segundo plano): trata como "sem gesto"
const PUSH_ZOOM = 0.3 // ln da distância (já multiplicado pelo ganho de zoom) por gesto de empurrar
const SUN_CLEARANCE = 1.55
const PLANET_CLEARANCE = 1.45 // × raio do planeta; menor que o limite do closeUp (1,6×), então a vista próxima não é afetada

/**
 * Ponte gestos → câmera 3D (dentro do <Canvas>). Só age com o modo holográfico engajado:
 *  - portal: mover as duas mãos gira (esq/dir) e inclina (cima/baixo) a câmera ao redor do alvo;
 *  - duas mãos abertas: afastar = aproximar a câmera, aproximar = afastar (logarítmico, com limites);
 *  - giro circular: gira a cena com inércia, proporcional à velocidade do gesto.
 * Os gestos chegam a ~30 Hz; aqui viram acumuladores consumidos com suavização exponencial por frame,
 * então a câmera se move de forma contínua mesmo com o rastreamento mais lento que a renderização.
 * Roda depois do CameraRig (-1.5) e antes do OrbitControls (-1), que só relê a posição da câmera.
 */
export function HandCameraBridge({ controller, controlsRef, planetRefs, pushZoomOut = true }: { controller: HandTrackingController | null; controlsRef: RefObject<OrbitControlsRef | null>; planetRefs: RefObject<Record<string, THREE.Group>>; /** false em vista próxima/seguindo: ali "empurrar" sai da vista (feito pela interface) em vez de afastar */ pushZoomOut?: boolean }) {
  const camera = useThree((s) => s.camera)
  const a = useRef({ theta: 0, phi: 0, zoom: 0, spinTarget: 0, spinV: 0, portal: false, zoomOn: false, spinOn: false, lastAt: -1e9, interacting: false, push: 0, pushOk: pushZoomOut })
  const v = useMemo(() => ({ offset: new THREE.Vector3(), tmp: new THREE.Vector3(), bodies: [] as Body[], pool: new Map<string, Body>(), sun: { pos: new THREE.Vector3(), radius: SUN_CLEARANCE } as Body }), [])

  useEffect(() => { a.current.pushOk = pushZoomOut })

  useEffect(() => {
    if (!controller) return
    const s = a.current
    const clear = () => { s.theta = s.phi = s.zoom = s.push = 0; s.portal = s.zoomOn = s.spinOn = false; s.spinTarget = 0 }
    const off = controller.subscribeGestures((g) => {
      s.lastAt = performance.now()
      if (!g.engaged) { clear(); return }
      s.portal = g.portal.state === 'active'
      s.zoomOn = g.zoom.state === 'active'
      s.spinOn = g.spin.state === 'active'
      if (s.portal) { s.theta += -g.portal.delta.x * HAND_GAIN.azimuth; s.phi += -g.portal.delta.y * HAND_GAIN.polar }
      if (s.zoomOn) s.zoom += g.zoom.delta
      // empurrar: a câmera recua devagar (consumido com constante de tempo longa no useFrame)
      if (s.pushOk) for (const e of g.events) if (e.type === 'push') s.push -= PUSH_ZOOM
      s.spinTarget = s.spinOn ? Math.max(-HAND_GAIN.spinMax, Math.min(HAND_GAIN.spinMax, g.spin.velocity * HAND_GAIN.spin)) : 0
    })
    return () => { off(); clear() }
  }, [controller])

  useFrame((_, raw) => {
    const controls = controlsRef.current as unknown as Controls | null
    if (!controls) return
    const s = a.current
    const dt = Math.min(raw, 0.05)
    const stale = performance.now() - s.lastAt > STALE_MS
    if (stale) { s.theta = s.phi = s.zoom = s.push = 0; s.portal = s.zoomOn = s.spinOn = false; s.spinTarget = 0 }

    // rotação da cena com inércia física: sobe rápido enquanto o gesto dura e vai parando devagar depois
    s.spinV += (s.spinTarget - s.spinV) * (1 - Math.exp(-dt * (s.spinOn ? 7 : 2.5)))
    if (Math.abs(s.spinV) < 1e-3 && !s.spinOn) s.spinV = 0

    const k = 1 - Math.exp(-dt * 16)
    const kp = 1 - Math.exp(-dt * 2.6)
    const dPush = s.push * kp
    s.push -= dPush
    const dTheta = s.theta * k + s.spinV * dt, dPhi = s.phi * k, dZoom = s.zoom * k + dPush
    s.theta -= s.theta * k; s.phi -= s.phi * k; s.zoom -= s.zoom * k

    const driving = s.portal || s.zoomOn || s.spinOn || s.spinV !== 0 || Math.abs(s.push) > 2e-3
    // avisa o CameraRig/DeepSpaceCameraRig, como se o usuário tivesse pegado o mouse (cancela a transição em curso)
    if (driving && !s.interacting) { controls.dispatchEvent({ type: 'start' }); s.interacting = true }
    else if (!driving && s.interacting && Math.abs(s.theta) + Math.abs(s.phi) + Math.abs(s.zoom) + Math.abs(s.push) < 1e-4) { controls.dispatchEvent({ type: 'end' }); s.interacting = false }

    if (Math.abs(dTheta) < 1e-6 && Math.abs(dPhi) < 1e-6 && Math.abs(dZoom) < 1e-6) return

    v.offset.copy(camera.position).sub(controls.target)
    orbitStep(v.offset, dTheta, dPhi, dZoom, { minDist: controls.minDistance, maxDist: controls.maxDistance, minPhi: 0.2, maxPhi: Math.PI - 0.2 })
    camera.position.copy(controls.target).add(v.offset)

    // sem atravessar Sol nem planetas
    v.bodies.length = 0
    v.bodies.push(v.sun)
    const groups = planetRefs.current ?? {}
    for (const name in groups) {
      const g = groups[name]
      if (!g) continue
      let body = v.pool.get(name)
      if (!body) { body = { pos: new THREE.Vector3(), radius: (planetSizes[name] ?? 0.3) * PLANET_CLEARANCE }; v.pool.set(name, body) }
      g.getWorldPosition(body.pos)
      v.bodies.push(body)
    }
    keepClear(camera.position, v.bodies)
  }, -1.4)

  return null
}
