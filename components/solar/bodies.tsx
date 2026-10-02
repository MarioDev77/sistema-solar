'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { Suspense, useLayoutEffect, useMemo, useRef, useEffect, type RefObject } from 'react'
import { Planet as TexturedPlanet, FlatPlanet } from '@/components/planet'
import { SimClock } from './clock'
import { MoonData } from './data'
import { configureTexture, RenderQuality, textures } from './textures'

export function Sun({ quality }: { quality: RenderQuality }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08
  })

  return (
    <group>
      <Suspense
        fallback={
          <mesh ref={ref}>
            <sphereGeometry args={[1.35, 64, 48]} />
            <meshBasicMaterial color="#ffb21c" />
          </mesh>
        }
      >
        <TexturedSun meshRef={ref} />
      </Suspense>

      <pointLight
        color="#ffd29a"
        intensity={quality === 'high' ? 18 : 14}
        distance={72}
        decay={1.15}
        castShadow={quality === 'high'}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
      />

      {/* Brilho solar externo propositalmente discreto. */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1.35, 48, 32]} />
        <meshBasicMaterial
          color="#ff9f2f"
          transparent
          opacity={0.09}
          depthWrite={false}
        />
      </mesh>

      <Html center distanceFactor={25}>
        <span className="space-label sun-label">
          SOL
          <small>ESTRELA ANÃ AMARELA</small>
        </span>
      </Html>
    </group>
  )
}

function TexturedSun({ meshRef }: { meshRef: React.RefObject<THREE.Mesh | null> }) {
  const texture = useTexture(textures.sun)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    configureTexture(texture, gl, 16)
  }, [texture, gl])

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.35, 64, 48]} />
      <meshBasicMaterial map={texture} color="#fff4df" />
    </mesh>
  )
}

export function SaturnRings({ size }: { size: number }) {
  const inner = size * 1.35
  const outer = size * 2.25

  const geometry = useMemo(() => {
    const ring = new THREE.RingGeometry(inner, outer, 192, 1)
    const position = ring.attributes.position
    const uv = ring.attributes.uv
    const vertex = new THREE.Vector3()

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position as THREE.BufferAttribute, i)
      uv.setXY(
        i,
        (vertex.length() - inner) / (outer - inner),
        1
      )
    }

    return ring
  }, [inner, outer])

  const map = useTexture('/textures/saturn-ring.png')
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    configureTexture(map, gl, 16)
  }, [map, gl])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <group rotation-z={-0.18}>
      <mesh
        geometry={geometry}
        rotation-x={Math.PI / 2}
        castShadow
        receiveShadow
        renderOrder={2}
      >
        <meshStandardMaterial
          map={map}
          color="#fff8ea"
          transparent
          opacity={0.92}
          alphaTest={0.06}
          side={THREE.DoubleSide}
          roughness={0.96}
          metalness={0}
          depthWrite={false}
          dithering
        />
      </mesh>
    </group>
  )
}

/**
 * Atmosfera com contorno de Fresnel.
 *
 * Diferente de uma esfera aditiva uniforme, a camada concentra a cor
 * na borda vista do observador. Isso evita halo artificial sobre todo
 * o planeta e mantém o efeito legível em Vênus, Terra, Titã e Netuno.
 */
export function Atmosphere({
  size,
  color,
  opacity,
  scale = 1.12,
}: {
  size: number
  color: string
  opacity: number
  scale?: number
}) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.BackSide,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vViewDirection;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(mat3(modelMatrix) * normal);
          vViewDirection = normalize(cameraPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;

        varying vec3 vNormal;
        varying vec3 vViewDirection;

        void main() {
          float rim = 1.0 - abs(
            dot(normalize(vNormal), normalize(vViewDirection))
          );

          float edge = smoothstep(0.16, 1.0, rim);
          gl_FragColor = vec4(uColor, edge * uOpacity);
        }
      `,
    })
  }, [color, opacity])

  useEffect(() => {
    return () => material.dispose()
  }, [material])

  return (
    <mesh material={material} scale={scale}>
      <sphereGeometry args={[size, 40, 28]} />
    </mesh>
  )
}


export function MoonBody({
  moon,
  onSelect,
  planetSize,
  clock,
  showLabel,
  detail,
}: {
  moon: MoonData
  onSelect: () => void
  planetSize: number
  clock: RefObject<SimClock>
  showLabel: boolean
  detail: number
}) {
  const ref = useRef<THREE.Group>(null!)
  const dist = planetSize * moon.dist
  const size = planetSize * moon.relSize

  const place = () => {
    if (!ref.current) return

    const direction = moon.retro ? -1 : 1
    const t = direction * (
      clock.current.t * moon.speed + moon.dist * 5
    )

    ref.current.position.set(
      Math.cos(t) * dist,
      0,
      Math.sin(t) * dist
    )
  }

  useLayoutEffect(() => {
    place()
  }, [])

  useFrame(place, -2)

  return (
    <group ref={ref} onClick={(event) => { event.stopPropagation(); onSelect() }} onDoubleClick={(event) => { event.stopPropagation(); onSelect() }}>
      <Suspense
        fallback={
          <FlatPlanet
            size={size}
            color={moon.color}
            segments={Math.min(32, detail)}
          />
        }
      >
        <TexturedPlanet
          textureUrl={textures[moon.key]}
          size={size}
          materialColor={moon.key === 'titan' ? '#d3914f' : '#f8f4ec'}
          rotationSpeed={0.1}
          segments={Math.min(40, detail)}
          roughness={0.9}
        />
      </Suspense>

      {moon.atmosphere && (
        <Atmosphere
          size={size}
          color={moon.atmosphere.color}
          opacity={moon.atmosphere.opacity}
          scale={moon.atmosphere.scale ?? 1.12}
        />
      )}

      {showLabel && (
        <Html
          center
          position={[0, size + 0.06, 0]}
          distanceFactor={2.6}
          style={{ pointerEvents: 'none' }}
        >
          <span className="moon-3d-label">
            {moon.name.toUpperCase()}
          </span>
        </Html>
      )}
    </group>
  )
}
