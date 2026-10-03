import { planetFacts, planets } from '../data'
import { planetPhysics } from '../physics-formulas'

/** Temperatura média (°C). Nos gigantes é a do nível de 1 bar; em Mercúrio e Marte varia muito entre dia e noite. */
const MEAN_TEMPERATURE_C: Record<string, number> = {
  'Mercúrio': 167, 'Vênus': 464, 'Terra': 15, 'Marte': -65, 'Júpiter': -110, 'Saturno': -140, 'Urano': -195, 'Netuno': -200, 'Plutão': -230,
}

const SUPERSCRIPT: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

/** 5,972e24 → "5,97 × 10²⁴ kg" */
export function formatMass(kg: number) {
  const exp = Math.floor(Math.log10(kg))
  const mant = kg / 10 ** exp
  return `${mant.toFixed(2).replace('.', ',')} × 10${String(exp).split('').map((c) => SUPERSCRIPT[c] ?? c).join('')} kg`
}

export type QuickFacts = { name: string; type: string; distance: string; temperature: string; gravity: string; mass: string; radius: string }

export function quickFacts(name: string): QuickFacts | null {
  const planet = planets.find((p) => p.name === name)
  if (!planet) return null
  const phys = planetPhysics[name]
  const temp = MEAN_TEMPERATURE_C[name]
  return {
    name, type: planet.type,
    distance: `${planet.distance} do Sol`,
    temperature: temp === undefined ? '—' : `${temp.toLocaleString('pt-BR')} °C`,
    gravity: planetFacts[name]?.gravity ?? '—',
    mass: phys ? formatMass(phys.mass) : '—',
    radius: phys ? `${Math.round(phys.radius / 1000).toLocaleString('pt-BR')} km` : '—',
  }
}
