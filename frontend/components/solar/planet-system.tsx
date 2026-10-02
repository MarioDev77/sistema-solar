'use client'

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Planet as TexturedPlanet, FlatPlanet } from '@/components/planet'
import { Atmosphere, MoonBody, SaturnRings } from './bodies'
import { planetAngle, SimClock } from './clock'
import { MoonData, PlanetData } from './data'
import { MoonOrbits, OrbitLine } from './orbits'
import { textures } from './textures'

export function Planet({
  data,
  selected,
  showLabels,
  observing,
  closeUpActive,
  onSelect,
  onMoonSelect,
  clock,
  showOrbits,
  planetRefs,
  detail,
}: {
  data: PlanetData
  selected: boolean
  showLabels: boolean
  observing: boolean
  closeUpActive: boolean
  onSelect: () => void
  onMoonSelect: (moon: MoonData, planet: PlanetData) => void
  clock: RefObject<SimClock>
  showOrbits: boolean
  planetRefs: RefObject<Record<string, THREE.Group>>
  detail: number
}) {
  const ref = useRef<THREE.Group | null>(null)
  const camera = useThree((state) => state.camera)
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  // Texturas das luas só são baixadas quando o planeta é selecionado/observado ou a câmera chega perto.
  const [moonsReady, setMoonsReady] = useState(false)
  const moonReach = useMemo(
    () => Math.max(0, ...data.moonList.map((moon) => moon.dist)) * data.size,
    [data]
  )

  useEffect(() => {
    if (selected || observing) setMoonsReady(true)
  }, [selected, observing])

  useFrame(() => {
    if (moonsReady || data.moonList.length === 0 || !ref.current) return
    ref.current.getWorldPosition(worldPos)
    if (camera.position.distanceTo(worldPos) < Math.max(moonReach * 6, 4)) setMoonsReady(true)
  })

  const place = () => {
    const group = ref.current
    if (!group) return

    const angle = planetAngle(data.orbit, clock.current.t)
    group.position.set(
      Math.cos(angle) * data.orbit,
      0,
      Math.sin(angle) * data.orbit
    )
  }

  const setRef = useCallback(
    (group: THREE.Group | null) => {
      ref.current = group
      if (group) planetRefs.current[data.name] = group
    },
    [data.name, planetRefs]
  )

  useLayoutEffect(() => {
    place()
  }, [])

  useFrame(place, -2)

  return (
    <>
      <OrbitLine radius={data.orbit} visible={showOrbits} />

      <group
        ref={setRef}
        onClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
        onDoubleClick={(event) => {
          event.stopPropagation()
          onSelect()
        }}
      >
        {textures[data.key] ? (
          <Suspense
            fallback={
              <FlatPlanet
                size={data.size}
                color={data.color}
                segments={Math.max(28, Math.round(detail * 0.7))}
              />
            }
          >
            <TexturedPlanet
              textureUrl={textures[data.key]}
              size={data.size}
              materialColor={data.key === 'saturn' ? '#e6cfaa' : '#f8f4ec'}
              rotationSpeed={data.orbit < 8 ? 0.25 : 0.5}
              segments={detail}
              roughness={
                data.type === 'Gigante gasoso'
                  ? 0.84
                  : data.type === 'Gigante de gelo'
                    ? 0.8
                    : 0.88
              }
            />
          </Suspense>
        ) : (
          <FlatPlanet
            size={data.size}
            color={data.color}
            segments={Math.max(28, Math.round(detail * 0.7))}
          />
        )}

        {data.atmosphere && (
          <Atmosphere
            size={data.size}
            color={data.atmosphere.color}
            opacity={data.atmosphere.opacity}
            scale={data.atmosphere.scale ?? 1.12}
          />
        )}

        {data.name === 'Saturno' && (
          <Suspense
            fallback={
              <group rotation-z={-0.18}>
                <mesh rotation-x={Math.PI / 2}>
                  <ringGeometry
                    args={[
                      data.size * 1.35,
                      data.size * 2.25,
                      96,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#bba58a"
                    transparent
                    opacity={0.72}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            }
          >
            <SaturnRings size={data.size} />
          </Suspense>
        )}

        {data.moonList.length > 0 && (
          <MoonOrbits
            planetSize={data.size}
            moons={data.moonList}
            enabled={showOrbits}
            force={closeUpActive}
          />
        )}

        {data.moonList.map((moon) => (
          <Suspense key={moon.name} fallback={null}>
            <MoonBody
              moon={moon}
              onSelect={() => onMoonSelect(moon, data)}
              planetSize={data.size}
              clock={clock}
              showLabel={showLabels && closeUpActive}
              detail={Math.min(40, detail)}
              loadTexture={moonsReady}
            />
          </Suspense>
        ))}

        {showLabels && !observing && (
          <Html center distanceFactor={18}>
            <button
              className={`space-label planet-label ${selected ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                onSelect()
              }}
            >
              {data.name.toUpperCase()}
              <small>{data.distance}</small>
            </button>
          </Html>
        )}
      </group>
    </>
  )
}
