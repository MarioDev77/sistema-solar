'use client'

import type { Dispatch, SetStateAction, RefObject } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { SimClock, SIM_T0 } from '../clock'

export function SimulationPanel({ playing, speed, clock, setPlaying, setSpeed }: { playing: boolean; speed: number; clock: RefObject<SimClock>; setPlaying: Dispatch<SetStateAction<boolean>>; setSpeed: Dispatch<SetStateAction<number>> }) {
  return (
    <section className="bottom-controls">
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

    </section>
  )
}
