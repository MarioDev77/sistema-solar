'use client'

import { useFrame } from '@react-three/fiber'
import { type RefObject } from 'react'

/**
 * Relógio da simulação. Fica FORA do estado do React: é um objeto mutável avançado em UM único
 * useFrame (frame-rate independente). Planetas, luas e cinturão só leem `clock.current.t`.
 * Assim nada re-renderiza por frame e a posição de tudo muda de forma contínua (sem degraus).
 */
export type SimClock = { t: number; speed: number; playing: boolean }
export const SIM_T0 = 1
/** Mantém a mesma escala do antigo setInterval (speed / 10000 a cada 50 ms = speed / 500 por segundo). */
const SIM_RATE = 1 / 500

export function planetAngle(orbit: number, t: number) {
  const s = orbit < 8 ? .16 : .05
  return t * s / 2 + orbit
}

export function SimulationClock({ clock }: { clock: RefObject<SimClock> }) {
  // prioridade -3: roda ANTES dos corpos (-2), da câmera (-1.5) e do OrbitControls do drei (-1)
  useFrame((_, delta) => {
    const c = clock.current
    if (c.playing) c.t += Math.min(delta, .05) * c.speed * SIM_RATE
  }, -3)
  return null
}
