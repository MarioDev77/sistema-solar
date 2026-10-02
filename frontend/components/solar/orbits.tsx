'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { MoonData } from './data'

/** Círculo no plano XZ (fechado). */
function circlePoints(radius: number, segments: number) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2
    return [Math.cos(a) * radius, 0, Math.sin(a) * radius] as [number, number, number]
  })
}

/** Linha de órbita com espessura CONSTANTE em pixels (não some de lado, não engrossa de perto, não cintila). */
export function OrbitLine({ radius, visible, opacity = .24 }: { radius: number; visible: boolean; opacity?: number }) {
  const points = useMemo(() => circlePoints(radius, radius > 2 ? 256 : 128), [radius])
  if (!visible) return null
  return <Line points={points} color="#91a4b8" lineWidth={1} transparent opacity={opacity} depthWrite={false} />
}

/** Órbitas das luas: só aparecem quando a câmera está perto do planeta (ou na vista próxima). Sem estado React. */
export function MoonOrbits({ planetSize, moons, enabled, force }: { planetSize: number; moons: MoonData[]; enabled: boolean; force: boolean }) {
  const camera = useThree((s) => s.camera)
  const groupRef = useRef<THREE.Group>(null!)
  const pos = useMemo(() => new THREE.Vector3(), [])
  const far = Math.max(...moons.map((m) => m.dist)) * planetSize
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    if (!enabled) { g.visible = false; return }
    if (force) { g.visible = true; return }
    g.getWorldPosition(pos)
    g.visible = camera.position.distanceTo(pos) < Math.max(far * 5, 3)
  })
  return <group ref={groupRef} visible={false}>{moons.map((m) => <OrbitLine key={m.name} radius={planetSize * m.dist} visible opacity={.2} />)}</group>
}
