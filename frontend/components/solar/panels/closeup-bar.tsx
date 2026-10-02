'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ArrowLeft } from 'lucide-react'
import { MoonSelection, PlanetData } from '../data'

export function CloseUpBar({ selectedMoon, closeUpPlanet, setSelected, setSelectedMoon, setInfoOpen, setCloseUp }: { selectedMoon: MoonSelection | null; closeUpPlanet: PlanetData; setSelected: Dispatch<SetStateAction<PlanetData>>; setSelectedMoon: Dispatch<SetStateAction<MoonSelection | null>>; setInfoOpen: Dispatch<SetStateAction<boolean>>; setCloseUp: Dispatch<SetStateAction<string | null>> }) {
  return (
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
  )
}
