'use client'

import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Sparkles } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect, type RefObject } from 'react'
import { AsteroidBelt, Comet, KuiperBelt } from './belts'
import { Sun } from './bodies'
import { CameraRig, DeepSpaceCameraRig, MAX_DIST, MIN_DIST, type OrbitControlsRef } from './camera'
import { SimClock, SimulationClock } from './clock'
import { CosmosObject, cosmosObjects, MoonData, PlanetData, planets } from './data'
import { DeepSpaceNebula } from './nebula'
import { Planet } from './planet-system'
import { TextureWarmup } from './texture-warmup'
import { getRenderQuality, RenderQuality } from './textures'

export function Scene({
  selected,
  showLabels,
  followName,
  closeUp,
  onSelect,
  onMoonSelect,
  showOrbits,
  belt,
  kuiperBelt,
  comets,
  deepSpaceMode,
  nebulaFocus,
  onNebulaSelect,
  clock,
  onFollowEnd,
}: {
  selected: string
  showLabels: boolean
  followName: string | null
  closeUp: string | null
  onSelect: (planet: PlanetData) => void
  onMoonSelect: (moon: MoonData, planet: PlanetData) => void
  showOrbits: boolean
  belt: boolean
  kuiperBelt: boolean
  comets: boolean
  deepSpaceMode: boolean
  nebulaFocus: string | null
  onNebulaSelect: (object: CosmosObject) => void
  clock: RefObject<SimClock>
  onFollowEnd: () => void
}) {
  const controlsRef = useRef<OrbitControlsRef>(null)
  const planetRefs = useRef<Record<string, THREE.Group>>({})
  const nebulaRefs = useRef<Record<string, THREE.Object3D>>({})
  const deepNebulas = cosmosObjects.filter((object) => object.group === 'Nebulosa')

  const [quality, setQuality] = useState<RenderQuality>('balanced')

  useEffect(() => {
    setQuality(getRenderQuality())
  }, [])

  const detail = quality === 'high' ? 64 : 40

  return (
    <Canvas
      camera={{ position: [0, 12, 24], fov: 44 }}
      dpr={quality === 'high' ? [1, 1.75] : [1, 1.25]}
      shadows={quality === 'high'}
      gl={{
        antialias: quality === 'high',
        powerPreference: 'high-performance',
        alpha: false,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.04
      }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#02050b']} />
      <fog attach="fog" args={['#02050b', deepSpaceMode ? 100 : 28, deepSpaceMode ? 180 : 52]} />

      <ambientLight intensity={0.1} />
      <hemisphereLight args={['#9ab5cc', '#05070d', 0.24]} />

      <Stars
        radius={90}
        depth={50}
        count={deepSpaceMode ? (quality === 'high' ? 5200 : 3200) : (quality === 'high' ? 2600 : 1500)}
        factor={1.15}
        saturation={0.16}
        fade
        speed={0.12}
      />

      <SimulationClock clock={clock} />
      <TextureWarmup />
      {deepSpaceMode ? <>
        {deepNebulas.map((object) => <Suspense key={object.name} fallback={null}><DeepSpaceNebula object={object} selected={nebulaFocus === object.name} register={(name, node) => { if (node) nebulaRefs.current[name] = node; else delete nebulaRefs.current[name] }} onSelect={onNebulaSelect} quality={quality} /></Suspense>)}
      </> : <>
      <Sparkles count={quality === 'high' ? 220 : 110} scale={[40, 18, 40]} size={0.85} speed={0.08} color="#9fbdd8" />
      <Sun quality={quality} />

      {planets.map((planet) => (
        <Planet
          key={planet.name}
          data={planet}
          selected={selected === planet.name}
          showLabels={showLabels}
          observing={
            followName === planet.name ||
            closeUp === planet.name
          }
          closeUpActive={closeUp === planet.name}
          onSelect={() => onSelect(planet)}
          onMoonSelect={onMoonSelect}
          clock={clock}
          showOrbits={showOrbits}
          planetRefs={planetRefs}
          detail={detail}
        />
      ))}

      <AsteroidBelt
        enabled={belt}
        clock={clock}
        count={quality === 'high' ? 800 : 420}
      />
      <KuiperBelt enabled={kuiperBelt} clock={clock} count={quality === 'high' ? 1500 : 780} />
      <Comet enabled={comets} clock={clock} />
      </>}

      {/* mouse: arrastar/scroll/pan · toque: 1 dedo gira · 2 dedos pinça zoom e pan */}
      <OrbitControls
        ref={controlsRef}
        enableZoom
        enablePan
        enableDamping
        dampingFactor={0.08}
        minDistance={MIN_DIST}
        maxDistance={MAX_DIST}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />

      <CameraRig
        followName={followName}
        closeUp={closeUp}
        planetRefs={planetRefs}
        controlsRef={controlsRef}
        onFollowEnd={onFollowEnd}
        enabled={!deepSpaceMode}
      />
      <DeepSpaceCameraRig enabled={deepSpaceMode} focusName={nebulaFocus} nebulaRefs={nebulaRefs} controlsRef={controlsRef} />
    </Canvas>
  )
}
