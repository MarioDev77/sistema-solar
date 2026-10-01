'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Line, Sparkles, useTexture, useProgress } from '@react-three/drei'
import { Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect, type RefObject } from 'react'
import * as THREE from 'three'
import { Planet as TexturedPlanet, FlatPlanet } from './planet'
import { Search, Orbit, Hand, Play, Pause, RotateCcw, Maximize2, Crosshair, ChevronLeft, ChevronRight, X, Layers3, Camera, MousePointer2, ZoomIn, ArrowLeft, Compass, ExternalLink, GitCompareArrows, Ruler } from 'lucide-react'

const textures: Record<string, string> = {
  mercury: '/textures/mercury.jpg',
  venus: '/textures/venus.jpg',
  earth: '/textures/earth.jpg',
  mars: '/textures/mars.jpg',
  jupiter: '/textures/jupiter.jpg',
  saturn: '/textures/saturn.jpg',
  uranus: '/textures/uranus.jpg',
  neptune: '/textures/neptune.jpg',
  moon: '/textures/moon.jpg',
  sun: '/textures/sun.jpg',
  // novos corpos
  pluto: '/textures/pluto.jpg',
  charon: '/textures/charon.jpg',
  io: '/textures/io.jpg',
  europa: '/textures/europa.jpg',
  ganymede: '/textures/ganymede.jpg',
  callisto: '/textures/callisto.jpg',
  titan: '/textures/titan.jpg',
  mimas: '/textures/mimas.jpg',
  tethys: '/textures/tethys.jpg',
  enceladus: '/textures/enceladus.jpg',
  rhea: '/textures/rhea.jpg',
  iapetus: '/textures/iapetus.jpg',
  dione: '/textures/dione.jpg',
  triton: '/textures/triton.jpg',
  titania: '/textures/titania.jpg',
  oberon: '/textures/oberon.jpg',
  umbriel: '/textures/umbriel.jpg',
  ariel: '/textures/ariel.jpg',
  miranda: '/textures/miranda.jpg',
  phobos: '/textures/phobos.jpg',
  deimos: '/textures/deimos.jpg',
}

type TexKey = keyof typeof textures

type RenderQuality = 'high' | 'balanced'

function configureTexture(
  texture: THREE.Texture,
  gl: THREE.WebGLRenderer,
  maxAnisotropy = 16
) {
  const maxSupported = Math.max(1, gl.capabilities.getMaxAnisotropy())

  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(maxAnisotropy, maxSupported)
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
}

function getRenderQuality(): RenderQuality {
  if (typeof window === 'undefined') return 'balanced'

  const narrowScreen = window.matchMedia('(max-width: 800px)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 8

  return narrowScreen || coarsePointer || cores <= 4
    ? 'balanced'
    : 'high'
}


type MoonData = {
  name: string; key: TexKey; relSize: number; dist: number; speed: number;
  color: string; retro?: boolean;
  atmosphere?: { color: string; opacity: number; scale?: number };
}

type PlanetData = {
  name: string; key: TexKey; orbit: number; size: number; color: string; type: string;
  moons: string; distance: string; period: string; description: string;
  atmosphere?: { color: string; opacity: number; scale?: number };
  moonList: MoonData[];
}

type MoonSelection = { moon: MoonData; planet: PlanetData }
type CatalogObject = { name: string; kind: string; planet: PlanetData; moon?: MoonData }
type MoonKnowledge = { diameter: string; orbit: string; period: string; fact: string }

const planets: PlanetData[] = [
  { name: 'Mercúrio', key: 'mercury', orbit: 3.5, size: .16, color: '#9e9e9e', type: 'Planeta rochoso', moons: '0', distance: '0,39 AU', period: '88 dias', description: 'O menor planeta e o mais próximo do Sol.', moonList: [] },
  { name: 'Vênus', key: 'venus', orbit: 4.8, size: .27, color: '#c8904d', type: 'Planeta rochoso', moons: '0', distance: '0,72 AU', period: '225 dias', description: 'Um mundo de nuvens densas e atmosfera extrema.', atmosphere: { color: '#e8c46a', opacity: .22 }, moonList: [] },
  { name: 'Terra', key: 'earth', orbit: 6.2, size: .3, color: '#3c75b9', type: 'Planeta rochoso', moons: '1', distance: '1,00 AU', period: '365,25 dias', description: 'Nosso planeta azul, com oceanos e vida conhecida.', atmosphere: { color: '#4da3ff', opacity: .18 }, moonList: [{ name: 'Lua', key: 'moon', relSize: .27, dist: 2.4, speed: .3, color: '#b8b8b8' }] },
  { name: 'Marte', key: 'mars', orbit: 7.6, size: .23, color: '#a85635', type: 'Planeta rochoso', moons: '2', distance: '1,52 AU', period: '687 dias', description: 'O planeta vermelho, marcado por vulcões e vales.', atmosphere: { color: '#d88a5a', opacity: .1 }, moonList: [{ name: 'Fobos', key: 'phobos', relSize: .17, dist: 1.6, speed: .9, color: '#7a6f66' }, { name: 'Deimos', key: 'deimos', relSize: .12, dist: 2.2, speed: .6, color: '#8a7a6a' }] },
  { name: 'Júpiter', key: 'jupiter', orbit: 10.4, size: .78, color: '#d4a36e', type: 'Gigante gasoso', moons: '115', distance: '5,20 AU', period: '11,86 anos', description: 'O maior planeta do Sistema Solar.', atmosphere: { color: '#d4a36e', opacity: .08 }, moonList: [{ name: 'Io', key: 'io', relSize: .18, dist: 1.9, speed: .7, color: '#d9c04a' }, { name: 'Europa', key: 'europa', relSize: .16, dist: 2.3, speed: .55, color: '#d8cbb0' }, { name: 'Ganímedes', key: 'ganymede', relSize: .24, dist: 2.8, speed: .4, color: '#9a8a78' }, { name: 'Calisto', key: 'callisto', relSize: .21, dist: 3.4, speed: .3, color: '#6a5f52' }] },
  { name: 'Saturno', key: 'saturn', orbit: 13.8, size: .68, color: '#c6a276', type: 'Gigante gasoso', moons: '293', distance: '9,54 AU', period: '29,45 anos', description: 'Gigante gasoso conhecido pelo seu magnífico sistema de anéis.', atmosphere: { color: '#e0c890', opacity: .08 }, moonList: [{ name: 'Mimas', key: 'mimas', relSize: .075, dist: 1.55, speed: .95, color: '#c7c4bd' }, { name: 'Encélado', key: 'enceladus', relSize: .1, dist: 1.9, speed: .8, color: '#e8f0f2' }, { name: 'Tétis', key: 'tethys', relSize: .115, dist: 2.2, speed: .68, color: '#c8c6c0' }, { name: 'Dione', key: 'dione', relSize: .12, dist: 2.55, speed: .58, color: '#b8b4ac' }, { name: 'Reia', key: 'rhea', relSize: .14, dist: 2.95, speed: .48, color: '#c4c0b8' }, { name: 'Titã', key: 'titan', relSize: .24, dist: 3.55, speed: .35, color: '#d08a3a', atmosphere: { color: '#e08b3a', opacity: .4, scale: 1.6 } }, { name: 'Jápeto', key: 'iapetus', relSize: .13, dist: 4.25, speed: .25, color: '#8a8278' }] },
  { name: 'Urano', key: 'uranus', orbit: 17.1, size: .46, color: '#78b8c4', type: 'Gigante de gelo', moons: '29', distance: '19,19 AU', period: '84 anos', description: 'Um gigante de gelo que gira inclinado de lado.', atmosphere: { color: '#9fd8e0', opacity: .1 }, moonList: [{ name: 'Miranda', key: 'miranda', relSize: .09, dist: 1.7, speed: .8, color: '#a8a49e' }, { name: 'Ariel', key: 'ariel', relSize: .13, dist: 2.0, speed: .6, color: '#c8c4bc' }, { name: 'Umbriel', key: 'umbriel', relSize: .12, dist: 2.4, speed: .5, color: '#6a6866' }, { name: 'Titânia', key: 'titania', relSize: .17, dist: 2.9, speed: .4, color: '#a8988a' }, { name: 'Oberon', key: 'oberon', relSize: .16, dist: 3.3, speed: .32, color: '#988578' }] },
  { name: 'Netuno', key: 'neptune', orbit: 20.4, size: .45, color: '#3558ca', type: 'Gigante de gelo', moons: '16', distance: '30,06 AU', period: '164,8 anos', description: 'O mundo mais distante, com ventos supersônicos.', atmosphere: { color: '#5a7fe0', opacity: .12 }, moonList: [{ name: 'Tritão', key: 'triton', relSize: .25, dist: 2.3, speed: .45, color: '#d8c4bc', retro: true }] },
  { name: 'Plutão', key: 'pluto', orbit: 23.5, size: .14, color: '#c8b8a8', type: 'Planeta anão', moons: '5', distance: '39,48 AU', period: '248 anos', description: 'O mais famoso planeta anão, com o coração de gelo Sputnik Planitia.', moonList: [{ name: 'Caronte', key: 'charon', relSize: .55, dist: 1.9, speed: .5, color: '#8a8a8c' }] },
]

const planetSizes: Record<string, number> = Object.fromEntries(planets.map(p => [p.name, p.size]))
const planetFacts: Record<string, { diameter: string; gravity: string }> = {
  'Mercúrio': { diameter: '4.879 km', gravity: '3,7 m/s²' },
  'Vênus': { diameter: '12.104 km', gravity: '8,9 m/s²' },
  'Terra': { diameter: '12.756 km', gravity: '9,8 m/s²' },
  'Marte': { diameter: '6.792 km', gravity: '3,7 m/s²' },
  'Júpiter': { diameter: '142.984 km', gravity: '23,1 m/s²' },
  'Saturno': { diameter: '120.536 km', gravity: '9,0 m/s²' },
  'Urano': { diameter: '51.118 km', gravity: '8,7 m/s²' },
  'Netuno': { diameter: '49.528 km', gravity: '11,0 m/s²' },
  'Plutão': { diameter: '2.376 km', gravity: '0,7 m/s²' },
}

const moonKnowledge: Record<string, MoonKnowledge> = {
  'Lua': { diameter: '3.475 km', orbit: '384.400 km da Terra', period: '27,3 dias', fact: 'A Lua ajuda a estabilizar a inclinação do eixo terrestre e influencia as marés.' },
  'Fobos': { diameter: '22 km', orbit: '9.376 km de Marte', period: '7,7 horas', fact: 'Fobos orbita tão perto de Marte que completa três voltas enquanto Marte gira uma vez.' },
  'Deimos': { diameter: '12 km', orbit: '23.463 km de Marte', period: '30,3 horas', fact: 'Deimos é a menor e mais externa das duas luas de Marte.' },
  'Io': { diameter: '3.643 km', orbit: '421.700 km de Júpiter', period: '1,77 dias', fact: 'Io é o corpo com maior atividade vulcânica conhecida do Sistema Solar.' },
  'Europa': { diameter: '3.122 km', orbit: '671.100 km de Júpiter', period: '3,55 dias', fact: 'Europa tem uma crosta de gelo e fortes evidências de um oceano sob a superfície.' },
  'Ganímedes': { diameter: '5.268 km', orbit: '1.070.400 km de Júpiter', period: '7,15 dias', fact: 'Ganímedes é a maior lua do Sistema Solar e possui campo magnético próprio.' },
  'Calisto': { diameter: '4.821 km', orbit: '1.882.700 km de Júpiter', period: '16,69 dias', fact: 'Calisto tem uma superfície muito antiga, marcada por crateras de impacto.' },
  'Mimas': { diameter: '396 km', orbit: '185.500 km de Saturno', period: '22,6 horas', fact: 'A enorme cratera Herschel dá a Mimas uma aparência parecida com a Estrela da Morte.' },
  'Encélado': { diameter: '504 km', orbit: '237.900 km de Saturno', period: '1,37 dias', fact: 'Jatos de vapor d’água e partículas de gelo saem de fissuras próximas ao polo sul.' },
  'Tétis': { diameter: '1.062 km', orbit: '294.600 km de Saturno', period: '1,89 dias', fact: 'Tétis abriga a grande cratera Odysseus e o longo cânion Ithaca Chasma.' },
  'Dione': { diameter: '1.123 km', orbit: '377.400 km de Saturno', period: '2,74 dias', fact: 'Dione tem fraturas e escarpas brilhantes formadas por terreno gelado.' },
  'Reia': { diameter: '1.527 km', orbit: '527.100 km de Saturno', period: '4,52 dias', fact: 'Reia é a segunda maior lua de Saturno e tem uma superfície muito craterada.' },
  'Titã': { diameter: '5.150 km', orbit: '1.221.900 km de Saturno', period: '15,95 dias', fact: 'Titã tem atmosfera densa e lagos e mares de metano e etano líquidos.' },
  'Jápeto': { diameter: '1.469 km', orbit: '3.560.800 km de Saturno', period: '79,3 dias', fact: 'Jápeto tem hemisférios com brilho muito diferente e uma crista que percorre o equador.' },
  'Miranda': { diameter: '472 km', orbit: '129.900 km de Urano', period: '1,41 dias', fact: 'Miranda apresenta falésias e terrenos muito diferentes, como se fossem grandes mosaicos.' },
  'Ariel': { diameter: '1.158 km', orbit: '190.900 km de Urano', period: '2,52 dias', fact: 'Ariel possui vales e cânions que indicam uma história geológica ativa.' },
  'Umbriel': { diameter: '1.169 km', orbit: '266.000 km de Urano', period: '4,14 dias', fact: 'Umbriel é uma das luas mais escuras de Urano e tem uma superfície antiga e craterada.' },
  'Titânia': { diameter: '1.578 km', orbit: '436.300 km de Urano', period: '8,71 dias', fact: 'Titânia é a maior lua de Urano e possui grandes cânions em sua superfície.' },
  'Oberon': { diameter: '1.523 km', orbit: '583.500 km de Urano', period: '13,46 dias', fact: 'Oberon é a lua principal mais distante de Urano, com terreno antigo e craterado.' },
  'Tritão': { diameter: '2.707 km', orbit: '354.800 km de Netuno', period: '5,88 dias · retrógrado', fact: 'Tritão orbita Netuno no sentido contrário à rotação do planeta e apresenta atividade de gêiseres.' },
  'Caronte': { diameter: '1.212 km', orbit: '19.600 km de Plutão', period: '6,39 dias', fact: 'Caronte é tão grande em relação a Plutão que os dois orbitam um ponto comum no espaço.' },
}

const catalogObjects: CatalogObject[] = planets.flatMap((planet) => [
  { name: planet.name, kind: planet.type, planet },
  ...planet.moonList.map((moon) => ({ name: moon.name, kind: `Lua de ${planet.name}`, planet, moon })),
])

const guideStops = [
  { name: 'Mercúrio', fact: 'Mercúrio completa uma volta ao redor do Sol em cerca de 88 dias terrestres.' },
  { name: 'Vênus', fact: 'Vênus é o planeta mais quente: sua atmosfera densa retém muito calor.' },
  { name: 'Terra', fact: 'Até agora, a Terra é o único mundo onde sabemos que existe vida.' },
  { name: 'Marte', fact: 'Marte abriga o Olympus Mons, o maior vulcão conhecido do Sistema Solar.' },
  { name: 'Júpiter', fact: 'Júpiter é o maior planeta do Sistema Solar e tem faixas de nuvens em movimento.' },
  { name: 'Saturno', fact: 'Os anéis de Saturno são compostos principalmente de fragmentos de gelo e rocha.' },
  { name: 'Urano', fact: 'O eixo de rotação de Urano é muito inclinado, fazendo o planeta girar quase de lado.' },
  { name: 'Netuno', fact: 'Netuno é um gigante de gelo distante, com ventos extremamente velozes.' },
  { name: 'Plutão', fact: 'Plutão é um planeta anão; Caronte é tão grande em relação a ele que ambos orbitam um centro comum fora de Plutão.' },
]

// Pré-carrega TODAS as texturas (uma chamada por URL, para bater com a chave de cache do useTexture).
// Evita o "pulo" de FlatPlanet -> TexturedPlanet e alimenta a tela de carregamento (useProgress).
if (typeof window !== 'undefined') {
  Object.values(textures).forEach((url) => useTexture.preload(url))
  useTexture.preload('/textures/saturn-ring.png')
}

/**
 * Relógio da simulação. Fica FORA do estado do React: é um objeto mutável avançado em UM único
 * useFrame (frame-rate independente). Planetas, luas e cinturão só leem `clock.current.t`.
 * Assim nada re-renderiza por frame e a posição de tudo muda de forma contínua (sem degraus).
 */
type SimClock = { t: number; speed: number; playing: boolean }
const SIM_T0 = 1
/** Mantém a mesma escala do antigo setInterval (speed / 10000 a cada 50 ms = speed / 500 por segundo). */
const SIM_RATE = 1 / 500

function planetAngle(orbit: number, t: number) {
  const s = orbit < 8 ? .16 : .05
  return t * s / 2 + orbit
}

function SimulationClock({ clock }: { clock: RefObject<SimClock> }) {
  // prioridade -3: roda ANTES dos corpos (-2), da câmera (-1.5) e do OrbitControls do drei (-1)
  useFrame((_, delta) => {
    const c = clock.current
    if (c.playing) c.t += Math.min(delta, .05) * c.speed * SIM_RATE
  }, -3)
  return null
}


function Sun({ quality }: { quality: RenderQuality }) {
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

function SaturnRings({ size }: { size: number }) {
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
function Atmosphere({
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


function MoonBody({
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


/** Interface mínima do OrbitControls usada pelo CameraRig (evita depender de tipos internos). */
type Controls = {
  target: THREE.Vector3; minDistance: number; maxDistance: number; enablePan: boolean
  addEventListener: (type: 'start', fn: () => void) => void
  removeEventListener: (type: 'start', fn: () => void) => void
}
const MIN_DIST = .4
const MAX_DIST = 40
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
function CameraRig({ followName, closeUp, planetRefs, controlsRef, onFollowEnd }: { followName: string | null; closeUp: string | null; planetRefs: RefObject<Record<string, THREE.Group>>; controlsRef: RefObject<any>; onFollowEnd: () => void }) {
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
    const controls = controlsRef.current as Controls | null
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

/** Círculo no plano XZ (fechado). */
function circlePoints(radius: number, segments: number) {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2
    return [Math.cos(a) * radius, 0, Math.sin(a) * radius] as [number, number, number]
  })
}

/** Linha de órbita com espessura CONSTANTE em pixels (não some de lado, não engrossa de perto, não cintila). */
function OrbitLine({ radius, visible, opacity = .24 }: { radius: number; visible: boolean; opacity?: number }) {
  const points = useMemo(() => circlePoints(radius, radius > 2 ? 256 : 128), [radius])
  if (!visible) return null
  return <Line points={points} color="#91a4b8" lineWidth={1} transparent opacity={opacity} depthWrite={false} />
}

/** Órbitas das luas: só aparecem quando a câmera está perto do planeta (ou na vista próxima). Sem estado React. */
function MoonOrbits({ planetSize, moons, enabled, force }: { planetSize: number; moons: MoonData[]; enabled: boolean; force: boolean }) {
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

function Planet({
  data,
  selected,
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
              showLabel={closeUpActive}
              detail={Math.min(40, detail)}
            />
          </Suspense>
        ))}

        {!observing && (
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

function AsteroidBelt({
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

function Scene({
  selected,
  followName,
  closeUp,
  onSelect,
  onMoonSelect,
  showOrbits,
  belt,
  clock,
  onFollowEnd,
}: {
  selected: string
  followName: string | null
  closeUp: string | null
  onSelect: (planet: PlanetData) => void
  onMoonSelect: (moon: MoonData, planet: PlanetData) => void
  showOrbits: boolean
  belt: boolean
  clock: RefObject<SimClock>
  onFollowEnd: () => void
}) {
  const controlsRef = useRef<any>(null)
  const planetRefs = useRef<Record<string, THREE.Group>>({})

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
      <fog attach="fog" args={['#02050b', 28, 52]} />

      <ambientLight intensity={0.1} />
      <hemisphereLight args={['#9ab5cc', '#05070d', 0.24]} />

      <Stars
        radius={90}
        depth={50}
        count={quality === 'high' ? 2600 : 1500}
        factor={1.15}
        saturation={0.16}
        fade
        speed={0.12}
      />

      <Sparkles
        count={quality === 'high' ? 220 : 110}
        scale={[40, 18, 40]}
        size={0.85}
        speed={0.08}
        color="#9fbdd8"
      />

      <SimulationClock clock={clock} />
      <Sun quality={quality} />

      {planets.map((planet) => (
        <Planet
          key={planet.name}
          data={planet}
          selected={selected === planet.name}
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
      />
    </Canvas>
  )
}

export default function SolarSystemExplorer() {
  const [selected, setSelected] = useState<PlanetData>(planets[5])
  const [selectedMoon, setSelectedMoon] = useState<MoonSelection | null>(null)
  const [infoOpen, setInfoOpen] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [belt, setBelt] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1000)
  const [query, setQuery] = useState('')
  const [hand, setHand] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [layers, setLayers] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [simulationOpen, setSimulationOpen] = useState(false)
  const [guidedOpen, setGuidedOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareA, setCompareA] = useState('Terra')
  const [compareB, setCompareB] = useState('Saturno')
  const [guideIndex, setGuideIndex] = useState(0)
  const [followName, setFollowName] = useState<string | null>(null)
  const [closeUp, setCloseUp] = useState<string | null>(null)
  const clock = useRef<SimClock>({ t: SIM_T0, speed: 1000, playing: true })
  const streamRef = useRef<MediaStream | null>(null)
  const { progress, active } = useProgress(); const [ready, setReady] = useState(false)
  // velocidade e play/pausa vão para o relógio por ref: mudar isso NÃO re-renderiza a cena por frame
  useEffect(() => { clock.current.speed = speed; clock.current.playing = playing }, [speed, playing])
  // tela de carregamento: some quando as texturas terminam (com fallback para nunca travar)
  useEffect(() => { if (progress >= 100 && !active) { const id = window.setTimeout(() => setReady(true), 350); return () => window.clearTimeout(id) } }, [progress, active])
  useEffect(() => { const id = window.setTimeout(() => setReady(true), 8000); return () => window.clearTimeout(id) }, [])
  // Esc sai da vista próxima / do seguimento
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (searchOpen) setSearchOpen(false); else if (compareOpen) { setCompareOpen(false); setInfoOpen(true) } else if (closeUp) { setCloseUp(null); setSelectedMoon(null) } else if (followName) setFollowName(null) } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [closeUp, compareOpen, followName, searchOpen])
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setInfoOpen(true)
        window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.search-box input')?.focus())
      }
    }
    window.addEventListener('keydown', handleSearchShortcut)
    return () => window.removeEventListener('keydown', handleSearchShortcut)
  }, [])
  // libera a câmera ao sair da página
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])
  const searchResults = catalogObjects.filter((item) => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
    return normalize(item.name).includes(normalize(query.trim()))
  })
  const selectObject = (item: CatalogObject) => {
    setSelected(item.planet)
    setSelectedMoon(item.moon ? { moon: item.moon, planet: item.planet } : null)
    setInfoOpen(true)
    setCompareOpen(false)
    setFollowName(null)
    setCloseUp(item.moon ? item.planet.name : null)
  }
  const guideStop = guideStops[guideIndex]
  const guidePlanet = planets.find((planet) => planet.name === guideStop.name) ?? planets[0]
  const changeSelectedPlanet = (offset: number) => {
    const currentIndex = planets.findIndex((planet) => planet.name === selected.name)
    const nextIndex = (currentIndex + offset + planets.length) % planets.length
    setSelected(planets[nextIndex])
    setSelectedMoon(null)
    setInfoOpen(true)
    setFollowName(null)
    setCloseUp(null)
  }
  const toggleCamera = async () => {
    if (cameraActive) { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraActive(false); return }
    try { streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true }); setCameraActive(true) } catch { setCameraActive(false) }
  }
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Permanece em modo normal se o navegador bloquear a tela cheia.
    }
  }
  const closeUpPlanet = planets.find(p => p.name === closeUp)
  const selectedMoonFacts = selectedMoon ? moonKnowledge[selectedMoon.moon.name] : null
  const comparedA = catalogObjects.find((item) => item.name === compareA) ?? catalogObjects[0]
  const comparedB = catalogObjects.find((item) => item.name === compareB) ?? catalogObjects[1]
  return (
    <main className={`explorer ${closeUp ? 'is-closeup' : ''}`}>
      {!ready && <div className="loader-overlay" role="status" aria-live="polite"><div className="loader-box"><Orbit className="loader-spin" size={28} /><span>CARREGANDO TEXTURAS · {Math.round(progress)}%</span><div className="loader-track"><div className="loader-fill" style={{ width: `${progress}%` }} /></div></div></div>}
      <div className="scene">
        <Scene selected={selected.name} followName={followName} closeUp={closeUp}
          onSelect={(p) => { setSelected(p); setSelectedMoon(null); setInfoOpen(true); setFollowName(null); setCloseUp(p.name) }}
          onMoonSelect={(moon, planet) => { setSelected(planet); setSelectedMoon({ moon, planet }); setInfoOpen(true); setFollowName(null); setCloseUp(planet.name) }}
          showOrbits={showOrbits} belt={belt} clock={clock} onFollowEnd={() => setFollowName(null)} />
      </div>

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Orbit size={17} />
          </div>

          <div>
            <strong>ASTRA<span>/</span>LAB</strong>
            <small>OBSERVATÓRIO VIRTUAL</small>
          </div>
        </div>

        <div className="top-status">
          <span className="status-dot" />
          SISTEMA ONLINE
          <span className="divider" />
          SIMULAÇÃO VISUAL
          <span className="divider" />
          ESCALA REPRESENTATIVA
        </div>

        <button
          className="icon-button fullscreen-button"
          aria-label="Alternar tela cheia"
          onClick={toggleFullscreen}
        >
          <Maximize2 size={16} />
        </button>
      </header>

      <aside className="left-rail">
        <button className={`rail-button ${searchOpen ? 'active' : ''}`} aria-pressed={searchOpen} aria-label="Abrir busca" onClick={() => { setSearchOpen(!searchOpen); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setInfoOpen(true) }}><Search size={17} /><span>BUSCA</span></button>
        <button className={`rail-button ${layers ? 'active' : ''}`} aria-pressed={layers} onClick={() => { setLayers(!layers); setSearchOpen(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setInfoOpen(true) }}><Layers3 size={17} /><span>CAMADAS</span></button>
        <button className={`rail-button ${simulationOpen ? 'active' : ''}`} aria-pressed={simulationOpen} onClick={() => { setSimulationOpen(!simulationOpen); setSearchOpen(false); setLayers(false); setHand(false); setGuidedOpen(false); setCompareOpen(false); setInfoOpen(true) }}><Orbit size={17} /><span>TEMPO</span></button>
        <button className={`rail-button ${guidedOpen ? 'active' : ''}`} aria-pressed={guidedOpen} onClick={() => { setGuidedOpen(!guidedOpen); setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setCompareOpen(false); setInfoOpen(true) }}><Compass size={17} /><span>GUIA</span></button>
        <button className={`rail-button ${compareOpen ? 'active' : ''}`} aria-pressed={compareOpen} aria-label="Comparar objetos" onClick={() => { const opening = !compareOpen; setCompareOpen(opening); setInfoOpen(!opening); setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false) }}><GitCompareArrows size={17} /><span>COMPARAR</span></button>
        <button className={`rail-button ${hand ? 'active' : ''}`} aria-pressed={hand} onClick={() => { setHand(!hand); setSearchOpen(false); setLayers(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setInfoOpen(true) }}><Hand size={17} /><span>GESTOS</span></button>
        <div className="rail-bottom">
          <button
            className="rail-button"
            onClick={toggleCamera}
          >
            <Camera size={17} />
            <span>CÂMERA</span>
          </button>
        </div>
        {searchOpen && <section className="search-panel" aria-label="Buscar planetas e luas">
          <div className="search-panel-heading">
            <span className="eyebrow">BUSCAR OBJETO</span>
            <button className="close-small" aria-label="Fechar busca" onClick={() => setSearchOpen(false)}><X size={15} /></button>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Planeta ou lua..."
              aria-label="Buscar planeta ou lua"
            />
            <kbd>⌘ K</kbd>
          </div>
          {query && (
            <div className="search-results">
              {searchResults.map((item) => (
                <button
                  key={`${item.kind}-${item.name}`}
                  onClick={() => {
                    selectObject(item)
                    setSearchOpen(false)
                    setQuery('')
                  }}
                >
                  <span>{item.name}<small className="search-kind">{item.kind}</small></span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {searchResults.length === 0 && <p className="search-empty">Nenhum planeta ou lua encontrado.</p>}
            </div>
          )}
        </section>}
      </aside>

      {infoOpen && <section className="info-panel">
        <div className="panel-header">
          <div><span className="eyebrow">{selectedMoon ? `LUA DE ${selectedMoon.planet.name.toUpperCase()}` : 'OBJETO SELECIONADO'}</span><h2>{selectedMoon?.moon.name ?? selected.name}</h2></div>
          <div className="planet-panel-actions">
            <span className="planet-index">{selectedMoon ? 'LUA' : `0${planets.indexOf(selected) + 1} / 0${planets.length}`}</span>
            {!selectedMoon && <><button className="planet-nav" aria-label="Planeta anterior" onClick={() => changeSelectedPlanet(-1)}><ChevronLeft size={16} /></button><button className="planet-nav" aria-label="Próximo planeta" onClick={() => changeSelectedPlanet(1)}><ChevronRight size={16} /></button></>}
            <button className="close-small" aria-label="Fechar painel de dados" onClick={() => { setInfoOpen(false); setSelectedMoon(null); setCloseUp(null); setFollowName(null) }}><X size={16} /></button>
          </div>
        </div>
        <div className="planet-orb" style={textures[selectedMoon?.moon.key ?? selected.key] ? { backgroundImage: `url(${textures[selectedMoon?.moon.key ?? selected.key]})`, ...((selectedMoon?.moon.key ?? selected.key) === 'titan' ? { backgroundColor: '#d3914f', backgroundBlendMode: 'multiply' as const } : {}) } : { backgroundColor: selectedMoon?.moon.color ?? selected.color }}><div className="orb-glow" /></div>
        <div className="object-meta">
          <span className="tag">{selectedMoon ? `Lua natural · ${selectedMoon.planet.name}` : selected.type}</span>
          <span className="meta-line"><span /> ESCALA VISUAL REPRESENTATIVA</span>
        </div>
        {selectedMoon ? <>
          <p>{selectedMoonFacts?.fact ?? `Satélite natural de ${selectedMoon.planet.name}.`}</p>
          <div className="data-grid moon-data-grid">
            <div><small>DIÂMETRO MÉDIO</small><strong>{selectedMoonFacts?.diameter ?? '—'}</strong></div>
            <div><small>ÓRBITA AO REDOR DE {selectedMoon.planet.name.toUpperCase()}</small><strong>{selectedMoonFacts?.orbit ?? '—'}</strong></div>
            <div><small>PERÍODO ORBITAL</small><strong>{selectedMoonFacts?.period ?? '—'}</strong></div>
            <div><small>PLANETA HOSPEDEIRO</small><strong>{selectedMoon.planet.name}</strong></div>
          </div>
          <a className="fact-source" href="https://ssd.jpl.nasa.gov/sats/phys_par/" target="_blank" rel="noreferrer">Parâmetros físicos: NASA/JPL</a>
          {selectedMoon.planet.name === 'Saturno' && <a className="fact-source" href="https://science.nasa.gov/saturn/moons/facts/" target="_blank" rel="noreferrer">Curiosidades: NASA · Luas de Saturno</a>}
          <button className="travel-button" onClick={() => { setFollowName(null); setCloseUp(selectedMoon.planet.name) }}><Crosshair size={15} /> VER SISTEMA DE {selectedMoon.planet.name.toUpperCase()} <ChevronRight size={15} /></button>
          <button className="travel-button secondary" onClick={() => setSelectedMoon(null)}><ArrowLeft size={15} /> VOLTAR A {selectedMoon.planet.name.toUpperCase()} <ChevronRight size={15} /></button>
        </> : <>
          <p>{selected.description}</p>
          <div className="data-grid">
            <div><small>DIÂMETRO MÉDIO</small><strong>{planetFacts[selected.name]?.diameter ?? '—'}</strong></div>
            <div><small>GRAVIDADE MÉDIA{selected.type.includes('Gigante') ? ' (1 BAR)' : ''}</small><strong>{planetFacts[selected.name]?.gravity ?? '—'}</strong></div>
            <div><small>DISTÂNCIA MÉDIA DO SOL</small><strong>{selected.distance}</strong></div>
            <div><small>PERÍODO ORBITAL</small><strong>{selected.period}</strong></div>
            <div><small>SATÉLITES CONHECIDOS · 2026</small><strong>{selected.moons}</strong></div>
            <div><small>CLASSIFICAÇÃO</small><strong>{selected.type}</strong></div>
          </div>
          <a className="fact-source" href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noreferrer">Dados: NASA Goddard · Fact Sheet</a>
          <button className="travel-button" onClick={() => { setCloseUp(null); setFollowName(selected.name) }}><Crosshair size={15} /> VIAJAR ATÉ OBJETO <ChevronRight size={15} /></button>
          <button className="travel-button secondary" onClick={() => { setFollowName(null); setCloseUp(selected.name) }}><ZoomIn size={15} /> OBSERVAR DE PERTO <ChevronRight size={15} /></button>
        </>}
      </section>}

      {compareOpen && <section className="compare-panel" aria-label="Comparar dois objetos">
        <div className="panel-header"><div><span className="eyebrow">COMPARAÇÃO</span><h2>Comparar objetos</h2></div><button className="close-small" aria-label="Fechar comparação" onClick={() => { setCompareOpen(false); setInfoOpen(true) }}><X size={15} /></button></div>
        <div className="compare-selectors">
          <label>OBJETO A<select value={compareA} onChange={(event) => setCompareA(event.target.value)}>{catalogObjects.map((item) => <option key={`a-${item.name}`} value={item.name}>{item.name} · {item.kind}</option>)}</select></label>
          <label>OBJETO B<select value={compareB} onChange={(event) => setCompareB(event.target.value)}>{catalogObjects.map((item) => <option key={`b-${item.name}`} value={item.name}>{item.name} · {item.kind}</option>)}</select></label>
        </div>
        <div className="comparison-table" role="table" aria-label="Dados comparativos">
          <div className="comparison-head" role="row"><span role="columnheader">DADO</span><strong role="columnheader">{comparedA.name}</strong><strong role="columnheader">{comparedB.name}</strong></div>
          <div role="row"><span role="cell">Diâmetro</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.diameter ?? '—' : planetFacts[comparedA.name]?.diameter ?? '—'}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.diameter ?? '—' : planetFacts[comparedB.name]?.diameter ?? '—'}</strong></div>
          <div role="row"><span role="cell">Distância orbital</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.orbit ?? '—' : `${comparedA.planet.distance} do Sol`}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.orbit ?? '—' : `${comparedB.planet.distance} do Sol`}</strong></div>
          <div role="row"><span role="cell">Período orbital</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.period ?? '—' : comparedA.planet.period}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.period ?? '—' : comparedB.planet.period}</strong></div>
          <div role="row"><span role="cell">Tipo</span><strong role="cell">{comparedA.kind}</strong><strong role="cell">{comparedB.kind}</strong></div>
        </div>
        <p className="compare-note">Distâncias de luas são medidas a partir do planeta hospedeiro; de planetas, a partir do Sol.</p>
      </section>}

      {/* Barra da vista próxima: voltar, atmosfera e luas visíveis */}
      {closeUp && closeUpPlanet && (
        <section className="closeup-bar">
          <button
            className="back-button"
            onClick={() => setCloseUp(null)}
          >
            <ArrowLeft size={15} />
            VOLTAR
          </button>

          <div>
            <strong>{closeUpPlanet.name.toUpperCase()}</strong>
            <small>
              VISTA PRÓXIMA · ESCALA REPRESENTATIVA
            </small>
          </div>

          {closeUpPlanet.moonList.length > 0 && (
            <div className="moon-chips">
              {closeUpPlanet.moonList.map((moon) => (
                <button className={`moon-chip ${selectedMoon?.moon.name === moon.name ? 'selected' : ''}`} key={moon.name} onClick={() => { setSelectedMoon({ moon, planet: closeUpPlanet }); setSelected(closeUpPlanet); setInfoOpen(true) }} aria-label={`Ver dados de ${moon.name}`}>
                  <span className="moon-dot" />
                  {moon.name}
                </button>
              ))}

              <span className="moon-count">
                {closeUpPlanet.moonList.length} de{' '}
                {closeUpPlanet.moons} luas representadas
              </span>
            </div>
          )}
        </section>
      )}

      {simulationOpen && <section className="bottom-controls">
        <div className="control-group">
          <span className="eyebrow">SIMULAÇÃO TEMPORAL</span>

          <div className="time-row">
            <button
              className="play-button"
              aria-label={playing ? 'Pausar simulação' : 'Reproduzir simulação'}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <div>
              <strong>TEMPO SIMULADO</strong>
              <small>
                {playing
                  ? 'CONTAGEM EM ANDAMENTO'
                  : 'CONTAGEM PAUSADA'}
              </small>
            </div>

            <button
              className="reset-button"
              aria-label="Reiniciar posição simulada"
              onClick={() => {
                clock.current.t = SIM_T0
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="speed-control">
          <span>VELOCIDADE DA SIMULAÇÃO</span>
          <strong>×{speed.toLocaleString('pt-BR')}</strong>

          <input
            aria-label="Velocidade da simulação"
            type="range"
            min="1"
            max="1000000"
            step="1"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
          <div className="speed-presets" aria-label="Presets de velocidade">
            {[{ label: 'NORMAL', value: 1000 }, { label: 'RÁPIDA', value: 10000 }, { label: 'MÁXIMA', value: 1000000 }].map((preset) => (
              <button key={preset.label} className={speed === preset.value ? 'selected' : ''} aria-pressed={speed === preset.value} onClick={() => setSpeed(preset.value)}>{preset.label}</button>
            ))}
          </div>
        </div>

        <div className="view-control">
          <button
            className={showOrbits ? 'selected' : ''}
            aria-pressed={showOrbits}
            onClick={() => setShowOrbits(!showOrbits)}
          >
            <Orbit size={14} />
            ÓRBITAS
          </button>

          <button
            className={belt ? 'selected' : ''}
            aria-pressed={belt}
            onClick={() => setBelt(!belt)}
          >
            <span className="mini-dot" />
            ASTEROIDES
          </button>
        </div>
      </section>}

      {layers && (
        <section className="layers-panel">
          <div className="eyebrow">CAMADAS DA CENA</div>

          <div className="layer-always">
            <strong>Planetas e luas</strong>
            <small>SEMPRE VISÍVEIS NESTA VERSÃO</small>
          </div>

          <button
            className={`layer-toggle ${showOrbits ? 'selected' : ''}`}
            aria-pressed={showOrbits}
            onClick={() => setShowOrbits(!showOrbits)}
          >
            <span className="mini-dot" />
            Órbitas
          </button>

          <button
            className={`layer-toggle ${belt ? 'selected' : ''}`}
            aria-pressed={belt}
            onClick={() => setBelt(!belt)}
          >
            <span className="mini-dot" />
            Cinturão principal
          </button>

          <p className="layers-note">
            Cometas e grade espacial não fazem parte desta cena.
          </p>
          <details className="scale-explainer">
            <summary><Ruler size={14} /> Como ler as escalas</summary>
            <p>Os tamanhos dos corpos e as distâncias entre órbitas são representativos e não seguem uma escala única. As posições e velocidades da animação são simplificadas para facilitar a visualização. Os valores físicos ficam identificados nos painéis de dados.</p>
          </details>
          <details className="texture-credits">
            <summary>Fontes das texturas <ExternalLink size={13} /></summary>
            <div className="texture-credit-links">
              <a href="https://maps.jpl.nasa.gov/tmaps/saturn.html" target="_blank" rel="noreferrer">Saturno · NASA/JPL <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/resource/color-map-of-mimas-2014/" target="_blank" rel="noreferrer">Mimas · Cassini PIA18437 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/resource/color-maps-of-tethys-2014/" target="_blank" rel="noreferrer">Tétis · Cassini PIA18439 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/photojournal/titan-global-map-june-2015/" target="_blank" rel="noreferrer">Titã · Cassini PIA19658 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/photojournal/color-maps-of-enceladus-2014/" target="_blank" rel="noreferrer">Encélado · Cassini PIA18435 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/photojournal/color-maps-of-dione-2014/" target="_blank" rel="noreferrer">Dione · Cassini PIA18434 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/photojournal/color-maps-of-rhea-2014/" target="_blank" rel="noreferrer">Reia · Cassini PIA18438 <ExternalLink size={11} /></a>
              <a href="https://science.nasa.gov/photojournal/color-maps-of-iapetus-2014/" target="_blank" rel="noreferrer">Jápeto · Cassini PIA18436 <ExternalLink size={11} /></a>
            </div>
          </details>
        </section>
      )}

      {hand && (
        <section className="hand-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">RECURSO EXPERIMENTAL</span>
              <h2>Controle por gestos</h2>
            </div>

            <button
              className="close-small"
              aria-label="Fechar painel"
              onClick={() => setHand(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div className="hand-preview">
            <Hand size={34} />

            <div>
              <strong>
                {cameraActive
                  ? 'CÂMERA PERMITIDA'
                  : 'CÂMERA DESLIGADA'}
              </strong>
              <small>
                {cameraActive
                  ? 'Acesso local concedido. Nenhum gesto é interpretado nesta versão.'
                  : 'O rastreamento de gestos não está disponível nesta versão.'}
              </small>
            </div>
          </div>

          <button className="travel-button" onClick={toggleCamera}>
            <Camera size={15} />
            {cameraActive
              ? 'ENCERRAR ACESSO À CÂMERA'
              : 'SOLICITAR ACESSO À CÂMERA'}
          </button>
        </section>
      )}

      {guidedOpen && (
        <section className="guide-panel">
          <div className="panel-header">
            <div><span className="eyebrow">ROTEIRO DE DESCOBERTA</span><h2>Parada {guideIndex + 1} de {guideStops.length}</h2></div>
            <button className="close-small" aria-label="Fechar guia" onClick={() => setGuidedOpen(false)}><X size={15} /></button>
          </div>
          <div className="guide-destination">
            <span className="guide-kicker">PRÓXIMO DESTINO</span>
            <strong>{guideStop.name}</strong>
            <p>{guideStop.fact}</p>
          </div>
          <a className="fact-source" href="https://science.nasa.gov/solar-system/planets/" target="_blank" rel="noreferrer">Curiosidades: NASA Solar System</a>
          <button className="travel-button" onClick={() => { setSelected(guidePlanet); setSelectedMoon(null); setInfoOpen(true); setCloseUp(null); setFollowName(guidePlanet.name) }}><Crosshair size={15} /> VIAJAR ATÉ {guideStop.name.toUpperCase()} <ChevronRight size={15} /></button>
          <button className="guide-next" onClick={() => setGuideIndex((index) => (index + 1) % guideStops.length)}>PRÓXIMA CURIOSIDADE <ChevronRight size={14} /></button>
        </section>
      )}

      <div className="hint"><MousePointer2 size={13} /> Arraste para orbitar · scroll/pinça para aproximar · clique seleciona e aproxima · Esc volta</div>
    </main>
  )
}
