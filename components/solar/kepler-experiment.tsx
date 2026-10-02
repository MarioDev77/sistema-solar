'use client'

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export function KeplerExperiment({ semimajorAxis, centralMass, playing }: { semimajorAxis: number; centralMass: number; playing: boolean }) {
  const [phase, setPhase] = useState(0)
  const [graphMode, setGraphMode] = useState<'position' | 'velocity'>('position')
  const period = Math.sqrt(semimajorAxis ** 3 / centralMass)
  const orbitalSpeed = 29.78 * Math.sqrt(centralMass / semimajorAxis)
  const visualPeriodSeconds = Math.min(20, Math.max(2, period * 2))

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setPhase((value) => (value + 0.05 / visualPeriodSeconds) % 1)
    }, 50)
    return () => window.clearInterval(timer)
  }, [playing, visualPeriodSeconds])

  const currentAngle = phase * Math.PI * 2
  const orbitRadius = 30 + semimajorAxis * 4.5
  const centerX = 140
  const centerY = 66
  const orbitX = centerX + Math.cos(currentAngle) * orbitRadius
  const orbitY = centerY + Math.sin(currentAngle) * orbitRadius
  const samples = Array.from({ length: 81 }, (_, index) => index / 80)
  const graphY = (sample: number) => {
    const angle = sample * Math.PI * 2
    return 65 - (graphMode === 'position' ? Math.cos(angle) : -Math.sin(angle)) * 42
  }
  const graphX = 14 + phase * 292
  const graphCurrentY = graphY(phase)
  const graphPath = samples.map((sample, index) => `${index === 0 ? 'M' : 'L'} ${14 + sample * 292} ${graphY(sample)}`).join(' ')
  const currentValue = graphMode === 'position'
    ? `${(semimajorAxis * Math.cos(currentAngle)).toFixed(2)} AU`
    : `${(-orbitalSpeed * Math.sin(currentAngle)).toFixed(2)} km/s`

  return (
    <div className="kepler-experiment">
      <div className="experiment-heading">
        <div><span className="guide-kicker">MODELO DE DOIS CORPOS</span><strong>Órbita circular idealizada</strong></div>
        <span className="experiment-status"><i className={playing ? 'running' : ''} />{playing ? 'RODANDO' : 'PAUSADO'}</span>
      </div>
      <svg className="orbit-diagram" viewBox="0 0 280 132" role="img" aria-label={`Diagrama orbital; posição atual ${currentValue}`}>
        <line x1="18" y1={centerY} x2="262" y2={centerY} />
        <line x1={centerX} y1="8" x2={centerX} y2="124" />
        <circle className="orbit-track" cx={centerX} cy={centerY} r={orbitRadius} />
        <circle className="orbit-star" cx={centerX} cy={centerY} r={5 + centralMass * 2.5} />
        <circle className="orbit-body" cx={orbitX} cy={orbitY} r="5" />
        <text x="18" y="126">TRAJETO ESQUEMÁTICO · NÃO ESTÁ EM ESCALA</text>
      </svg>
      <div className="experiment-metrics">
        <div><small>PERÍODO CALCULADO</small><strong>{period.toFixed(2)} anos</strong></div>
        <div><small>VELOCIDADE CIRCULAR</small><strong>{orbitalSpeed.toFixed(2)} km/s</strong></div>
      </div>
      <div className="graph-heading">
        <span>{graphMode === 'position' ? 'POSIÇÃO X × TEMPO' : 'VELOCIDADE X × TEMPO'}</span>
        <strong>{currentValue}</strong>
      </div>
      <svg className="orbit-graph" viewBox="0 0 320 92" role="img" aria-label={`${graphMode === 'position' ? 'Posição x' : 'Velocidade x'} ao longo de um período orbital`}>
        <line x1="14" y1="65" x2="306" y2="65" />
        <line x1="14" y1="14" x2="14" y2="82" />
        <path d={graphPath} />
        <line className="graph-playhead" x1={graphX} y1="13" x2={graphX} y2="82" />
        <circle className="graph-current" cx={graphX} cy={graphCurrentY} r="4" />
        <text x="14" y="90">0</text><text x="286" y="90">1 período</text>
      </svg>
      <div className="graph-switches">
        <button className={graphMode === 'position' ? 'selected' : ''} aria-pressed={graphMode === 'position'} onClick={() => setGraphMode('position')}>Posição x</button>
        <button className={graphMode === 'velocity' ? 'selected' : ''} aria-pressed={graphMode === 'velocity'} onClick={() => setGraphMode('velocity')}>Velocidade x</button>
        <button className="graph-reset" onClick={() => setPhase(0)}><RotateCcw size={12} /> Reiniciar fase</button>
      </div>
      <p className="experiment-caveat">Tempo visual comprimido. O modelo considera órbita circular e massa do corpo orbitante desprezível diante da massa central.</p>
      <a className="fact-source" href="https://science.nasa.gov/solar-system/orbits-and-keplers-laws/" target="_blank" rel="noreferrer">Referência: leis de Kepler · NASA</a>
    </div>
  )
}
