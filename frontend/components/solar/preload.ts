import { useTexture } from '@react-three/drei'
import { planets } from './data'
import { nebulaTextures, textures } from './textures'

/**
 * Pré-carregamento de texturas. Só o essencial entra na tela de carregamento (Sol, planetas e anel
 * de Saturno); luas e nebulosas carregam sob demanda. Uma chamada por URL, para bater com a chave
 * de cache do useTexture e evitar o "pulo" de FlatPlanet -> TexturedPlanet.
 */
const SATURN_RING = '/textures/saturn-ring.png'

export function coreTextureUrls() {
  return [textures.sun, ...planets.map((planet) => textures[planet.key]), SATURN_RING].filter(Boolean)
}

export function preloadCoreTextures() {
  coreTextureUrls().forEach((url) => useTexture.preload(url))
}

let moonsPreloaded = false
/**
 * Baixa as texturas das luas em segundo plano, uma por vez e só quando o navegador está ocioso,
 * depois que a cena já abriu. Assim a vista próxima de um planeta não "pisca" ao carregar as luas.
 * Respeita o modo Economia de dados.
 */
export function preloadMoonTexturesIdle() {
  if (moonsPreloaded || typeof window === 'undefined') return
  moonsPreloaded = true
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return
  const urls = planets.flatMap((planet) => planet.moonList.map((moon) => textures[moon.key])).filter(Boolean)
  const idle = (cb: () => void) =>
    typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb, { timeout: 2000 }) : window.setTimeout(cb, 250)
  const next = () => {
    const url = urls.shift()
    if (!url) return
    useTexture.preload(url)
    idle(next)
  }
  idle(next)
}

let nebulasPreloaded = false
/** Chamada ao entrar no espaço profundo / abrir o catálogo Cosmos. */
export function preloadNebulaTextures() {
  if (nebulasPreloaded) return
  nebulasPreloaded = true
  Object.values(nebulaTextures).forEach((url) => useTexture.preload(url))
}

if (typeof window !== 'undefined') preloadCoreTextures()
