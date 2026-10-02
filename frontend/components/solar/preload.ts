import { useTexture } from '@react-three/drei'
import { planets } from './data'
import { nebulaTextures, textures } from './textures'

/**
 * Pré-carregamento de texturas. Só o essencial entra na tela de carregamento (Sol, planetas e anel
 * de Saturno); luas e nebulosas carregam sob demanda. Uma chamada por URL, para bater com a chave
 * de cache do useTexture e evitar o "pulo" de FlatPlanet -> TexturedPlanet.
 */
const SATURN_RING = '/textures/saturn-ring.png'

export function preloadCoreTextures() {
  const urls = [textures.sun, ...planets.map((planet) => textures[planet.key]), SATURN_RING]
  urls.filter(Boolean).forEach((url) => useTexture.preload(url))
}

let nebulasPreloaded = false
/** Chamada ao entrar no espaço profundo / abrir o catálogo Cosmos. */
export function preloadNebulaTextures() {
  if (nebulasPreloaded) return
  nebulasPreloaded = true
  Object.values(nebulaTextures).forEach((url) => useTexture.preload(url))
}

if (typeof window !== 'undefined') preloadCoreTextures()
