'use client'

import { useProgress } from '@react-three/drei'
import { Orbit } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { planets } from './data'
import { useTexturesWarm } from './warmup'

const names: Record<string, string> = {
  sun: 'Sol',
  'saturn-ring': 'Anéis de Saturno',
  ...Object.fromEntries(planets.map((planet) => [planet.key, planet.name])),
}

/** "/textures/jupiter.jpg" -> "Júpiter" */
function labelFor(item: string) {
  const file = item.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? ''
  return names[file] ?? 'texturas'
}

const MAX_WAIT_MS = 8000
const FADE_MS = 600

/**
 * Tela de carregamento. Vive isolada do explorador: o useProgress re-renderiza SÓ este componente
 * (antes re-renderizava o explorador inteiro a cada textura). A barra anda por requestAnimationFrame
 * com suavização, direto no DOM, então não "pula" quando uma textura grande termina de baixar.
 */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const { progress, active, item } = useProgress()
  const warm = useTexturesWarm()
  const [leaving, setLeaving] = useState(false)

  const fill = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const shown = useRef(0)
  // alvo da barra: download (até 90%) + envio à GPU (últimos 10%)
  const target = useRef(0)
  const timedOut = useRef(false)

  const loaded = progress >= 100 && !active
  target.current = timedOut.current ? 100 : loaded ? (warm ? 100 : 96) : Math.min(90, progress * 0.9)

  useEffect(() => {
    const id = window.setTimeout(() => { timedOut.current = true }, MAX_WAIT_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let lastPercent = -1
    let finished = false
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const goal = timedOut.current ? 100 : target.current
      // aproximação exponencial + velocidade mínima, para nunca parecer travada nem voltar atrás
      const step = Math.max((goal - shown.current) * (1 - Math.exp(-dt * 5)), goal > shown.current ? dt * 6 : 0)
      shown.current = Math.min(goal, shown.current + step)
      if (fill.current) fill.current.style.transform = `scaleX(${shown.current / 100})`
      const percent = Math.round(shown.current)
      if (percent !== lastPercent && text.current) {
        lastPercent = percent
        text.current.textContent = `${percent}%`
      }
      if (shown.current >= 99.5 && !finished) {
        finished = true
        setLeaving(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const id = window.setTimeout(onDone, FADE_MS)
    return () => window.clearTimeout(id)
  }, [leaving, onDone])

  return (
    <div className={`loader-overlay ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite" aria-busy={!leaving}>
      <div className="loader-box">
        <Orbit className="loader-spin" size={28} />
        <span className="loader-title">
          {leaving ? 'PRONTO' : `CARREGANDO ${loaded ? 'CENA' : labelFor(item).toUpperCase()}`} · <span ref={text}>0%</span>
        </span>
        <div className="loader-track"><div className="loader-fill" ref={fill} /></div>
      </div>
    </div>
  )
}
