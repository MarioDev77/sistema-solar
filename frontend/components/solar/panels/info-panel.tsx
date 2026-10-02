'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Crosshair, ChevronLeft, ChevronRight, PanelRightClose, ZoomIn, ArrowLeft } from 'lucide-react'
import { MoonKnowledge, MoonSelection, PlanetData, planetFacts, planets } from '../data'
import { textures } from '../textures'

export function InfoPanel({ selected, selectedMoon, selectedMoonFacts, changeSelectedPlanet, setSelectedMoon, setInfoOpen, setFollowName, setCloseUp }: { selected: PlanetData; selectedMoon: MoonSelection | null; selectedMoonFacts: MoonKnowledge | null | undefined; changeSelectedPlanet: (offset: number) => void; setSelectedMoon: Dispatch<SetStateAction<MoonSelection | null>>; setInfoOpen: Dispatch<SetStateAction<boolean>>; setFollowName: Dispatch<SetStateAction<string | null>>; setCloseUp: Dispatch<SetStateAction<string | null>> }) {
  return (
    <section className="info-panel">
      <div className="panel-header">
        <div><span className="eyebrow">{selectedMoon ? `LUA DE ${selectedMoon.planet.name.toUpperCase()}` : 'OBJETO SELECIONADO'}</span><h2>{selectedMoon?.moon.name ?? selected.name}</h2></div>
        <div className="planet-panel-actions">
          <span className="planet-index">{selectedMoon ? 'LUA' : `0${planets.indexOf(selected) + 1} / 0${planets.length}`}</span>
          {!selectedMoon && <><button className="planet-nav" aria-label="Planeta anterior" onClick={() => changeSelectedPlanet(-1)}><ChevronLeft size={16} /></button><button className="planet-nav" aria-label="Próximo planeta" onClick={() => changeSelectedPlanet(1)}><ChevronRight size={16} /></button></>}
          <button className="close-small" aria-label="Ocultar card de dados (continua vendo o objeto)" title="Ocultar card" onClick={() => setInfoOpen(false)}><PanelRightClose size={16} /></button>
        </div>
      </div>
      <div className="planet-orb" style={textures[selectedMoon?.moon.key ?? selected.key] ? { backgroundImage: `url(${textures[selectedMoon?.moon.key ?? selected.key]})`, ...((selectedMoon?.moon.key ?? selected.key) === 'titan' ? { backgroundColor: '#d3914f', backgroundBlendMode: 'multiply' as const } : {}) } : { backgroundColor: selectedMoon?.moon.color ?? selected.color }}><div className="orb-glow" /></div>
      <div className="object-meta">
        <span className="tag">{selectedMoon ? `Lua natural · ${selectedMoon.planet.name}` : selected.type}</span>
        <span className="meta-line"><span /> ESCALA VISUAL REPRESENTATIVA</span>
      </div>
      {selectedMoon ? <>
        <p>{selectedMoonFacts?.fact ?? `Satélite natural de ${selectedMoon.planet.name}.`}</p>
        <div className="data-grid moon-data-grid">
          <div><small>DIÂMETRO MÉDIO</small><strong>{selectedMoonFacts?.diameter ?? '—'}</strong></div>
          <div><small>ÓRBITA AO REDOR DE {selectedMoon.planet.name.toUpperCase()}</small><strong>{selectedMoonFacts?.orbit ?? '—'}</strong></div>
          <div><small>PERÍODO ORBITAL</small><strong>{selectedMoonFacts?.period ?? '—'}</strong></div>
          <div><small>PLANETA HOSPEDEIRO</small><strong>{selectedMoon.planet.name}</strong></div>
        </div>
        <a className="fact-source" href="https://ssd.jpl.nasa.gov/sats/phys_par/" target="_blank" rel="noreferrer">Parâmetros físicos: NASA/JPL</a>
        {selectedMoon.planet.name === 'Saturno' && <a className="fact-source" href="https://science.nasa.gov/saturn/moons/facts/" target="_blank" rel="noreferrer">Curiosidades: NASA · Luas de Saturno</a>}
        <button className="travel-button" onClick={() => { setFollowName(null); setCloseUp(selectedMoon.planet.name) }}><Crosshair size={15} /> VER SISTEMA DE {selectedMoon.planet.name.toUpperCase()} <ChevronRight size={15} /></button>
        <button className="travel-button secondary" onClick={() => setSelectedMoon(null)}><ArrowLeft size={15} /> VOLTAR A {selectedMoon.planet.name.toUpperCase()} <ChevronRight size={15} /></button>
      </> : <>
        <p>{selected.description}</p>
        <div className="data-grid">
          <div><small>DIÂMETRO MÉDIO</small><strong>{planetFacts[selected.name]?.diameter ?? '—'}</strong></div>
          <div><small>GRAVIDADE MÉDIA{selected.type.includes('Gigante') ? ' (1 BAR)' : ''}</small><strong>{planetFacts[selected.name]?.gravity ?? '—'}</strong></div>
          <div><small>DISTÂNCIA MÉDIA DO SOL</small><strong>{selected.distance}</strong></div>
          <div><small>PERÍODO ORBITAL</small><strong>{selected.period}</strong></div>
          <div><small>SATÉLITES CONHECIDOS · 2026</small><strong>{selected.moons}</strong></div>
          <div><small>CLASSIFICAÇÃO</small><strong>{selected.type}</strong></div>
        </div>
        <a className="fact-source" href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noreferrer">Dados: NASA Goddard · Fact Sheet</a>
        <button className="travel-button" onClick={() => { setCloseUp(null); setFollowName(selected.name) }}><Crosshair size={15} /> VIAJAR ATÉ OBJETO <ChevronRight size={15} /></button>
        <button className="travel-button secondary" onClick={() => { setFollowName(null); setCloseUp(selected.name) }}><ZoomIn size={15} /> OBSERVAR DE PERTO <ChevronRight size={15} /></button>
      </>}
    </section>
  )
}
