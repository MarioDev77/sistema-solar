import * as THREE from 'three'

export const textures: Record<string, string> = {
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

export const nebulaTextures = {
  'Nebulosa de Órion': '/textures/nebula-orion.jpg',
  'Nebulosa do Anel': '/textures/nebula-ring.jpg',
  'Nebulosa do Caranguejo': '/textures/nebula-crab.jpg',
  'Nebulosa da Águia': '/textures/nebula-eagle.jpg',
} as const

export type TexKey = keyof typeof textures

export type RenderQuality = 'high' | 'balanced'

export function configureTexture(
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

export function getRenderQuality(): RenderQuality {
  if (typeof window === 'undefined') return 'balanced'

  const narrowScreen = window.matchMedia('(max-width: 800px)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 8

  return narrowScreen || coarsePointer || cores <= 4
    ? 'balanced'
    : 'high'
}
