import { useSyncExternalStore } from 'react'

/**
 * Sinaliza que as texturas essenciais já foram enviadas à GPU (ver texture-warmup.tsx).
 * A tela de carregamento só sai depois disso, para a cena aparecer sem engasgos.
 */
let warm = false
const listeners = new Set<() => void>()

export function markTexturesWarm() {
  if (warm) return
  warm = true
  listeners.forEach((listener) => listener())
}

export function useTexturesWarm() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => warm,
    () => false
  )
}
