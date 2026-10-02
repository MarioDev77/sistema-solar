'use client'

import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useMemo, useRef, type RefObject } from 'react'
import { SimClock } from './clock'

export function AsteroidBelt({
  enabled,
  clock,
  count,
}: {
  enabled: boolean
  clock: RefObject<SimClock>
  count: number
}) {
  const ref = useRef<THREE.Group>(null)

  const positions = useMemo(() => {
    const particles = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 8.5 + Math.random() * 1.2

      particles[i * 3] = Math.cos(angle) * radius
      particles[i * 3 + 1] = (Math.random() - 0.5) * 0.22
      particles[i * 3 + 2] = Math.sin(angle) * radius
    }

    return particles
  }, [count])

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y = clock.current.t * 0.012
    }
  }, -2)

  if (!enabled) return null

  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#9a8d7c"
          size={0.024}
          sizeAttenuation
          transparent
          opacity={0.62}
        />
      </points>
    </group>
  )
}

export function KuiperBelt({ enabled, clock, count }: { enabled: boolean; clock: RefObject<SimClock>; count: number }) {
  const ref = useRef<THREE.Group>(null)
  const positions = useMemo(() => {
    const particles = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 22.8 + Math.random() * 4.3
      particles[i * 3] = Math.cos(angle) * radius
      particles[i * 3 + 1] = (Math.random() - 0.5) * 0.8
      particles[i * 3 + 2] = Math.sin(angle) * radius
    }
    return particles
  }, [count])
  useFrame(() => { if (ref.current) ref.current.rotation.y = clock.current.t * 0.0015 }, -2)
  return <group ref={ref} visible={enabled}><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#86a9c5" size={0.055} sizeAttenuation transparent opacity={0.58} depthWrite={false} /></points></group>
}

export function Comet({ enabled, clock }: { enabled: boolean; clock: RefObject<SimClock> }) {
  const body = useRef<THREE.Group>(null)
  const points = useMemo(() => Array.from({ length: 121 }, (_, i) => {
    const angle = (i / 120) * Math.PI * 2
    const a = 13.5; const e = 0.78
    return new THREE.Vector3(a * (Math.cos(angle) - e), 0, a * Math.sqrt(1 - e * e) * Math.sin(angle))
  }), [])
  useFrame(() => {
    if (!body.current) return
    const angle = clock.current.t * 0.0015
    const a = 13.5; const e = 0.78
    const x = a * (Math.cos(angle) - e); const z = a * Math.sqrt(1 - e * e) * Math.sin(angle)
    body.current.position.set(x, 0.08, z)
    body.current.rotation.y = Math.atan2(-z, x)
  }, -1)
  if (!enabled) return null
  return <group><Line points={points} color="#8bb8c8" transparent opacity={0.28} lineWidth={0.7} /><group ref={body}><mesh><sphereGeometry args={[0.12, 12, 12]} /><meshStandardMaterial color="#d9f3ed" emissive="#8bded5" emissiveIntensity={1.3} /></mesh><mesh position={[0.28, 0, 0]} rotation-z={-Math.PI / 2}><coneGeometry args={[0.11, 0.65, 12, 1, true]} /><meshBasicMaterial color="#92c9e8" transparent opacity={0.34} side={THREE.DoubleSide} depthWrite={false} /></mesh></group></group>
}
