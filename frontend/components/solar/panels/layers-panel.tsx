'use client'

import type { Dispatch, SetStateAction } from 'react'
import { ExternalLink, Ruler } from 'lucide-react'

export function LayersPanel({ showOrbits, belt, kuiperBelt, comets, setShowOrbits, setBelt, setKuiperBelt, setComets }: { showOrbits: boolean; belt: boolean; kuiperBelt: boolean; comets: boolean; setShowOrbits: Dispatch<SetStateAction<boolean>>; setBelt: Dispatch<SetStateAction<boolean>>; setKuiperBelt: Dispatch<SetStateAction<boolean>>; setComets: Dispatch<SetStateAction<boolean>> }) {
  return (
    <section className="layers-panel">
      <div className="eyebrow">CAMADAS DA CENA</div>

      <div className="layer-always">
        <strong>Planetas e luas</strong>
        <small>SEMPRE VISÍVEIS NESTA VERSÃO</small>
      </div>

      <button
        className={`layer-toggle ${showOrbits ? 'selected' : ''}`}
        aria-pressed={showOrbits}
        onClick={() => setShowOrbits(!showOrbits)}
      >
        <span className="mini-dot" />
        Órbitas
      </button>

      <button
        className={`layer-toggle ${belt ? 'selected' : ''}`}
        aria-pressed={belt}
        onClick={() => setBelt(!belt)}
      >
        <span className="mini-dot" />
        Cinturão principal
      </button>

      <button className={`layer-toggle ${kuiperBelt ? 'selected' : ''}`} aria-pressed={kuiperBelt} onClick={() => setKuiperBelt(!kuiperBelt)}><span className="mini-dot" /> Cinturão de Kuiper <small>VISUALIZAÇÃO ESQUEMÁTICA</small></button>
      <button className={`layer-toggle ${comets ? 'selected' : ''}`} aria-pressed={comets} onClick={() => setComets(!comets)}><span className="mini-dot" /> Cometa demonstrativo <small>ÓRBITA ILUSTRATIVA</small></button>
      <p className="layers-note">Nebulosas estão fora do Sistema Solar e podem ser exploradas em Cosmos. A Nuvem de Oort é conceitual; não aparece na cena 3D.</p>
      <details className="scale-explainer">
        <summary><Ruler size={14} /> Como ler as escalas</summary>
        <p>Os tamanhos dos corpos e as distâncias entre órbitas são representativos e não seguem uma escala única. As posições e velocidades da animação são simplificadas para facilitar a visualização. Os valores físicos ficam identificados nos painéis de dados.</p>
      </details>
      <details className="texture-credits">
        <summary>Fontes das texturas <ExternalLink size={13} /></summary>
        <div className="texture-credit-links">
          <a href="https://maps.jpl.nasa.gov/tmaps/saturn.html" target="_blank" rel="noreferrer">Saturno · NASA/JPL <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/resource/color-map-of-mimas-2014/" target="_blank" rel="noreferrer">Mimas · Cassini PIA18437 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/resource/color-maps-of-tethys-2014/" target="_blank" rel="noreferrer">Tétis · Cassini PIA18439 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/photojournal/titan-global-map-june-2015/" target="_blank" rel="noreferrer">Titã · Cassini PIA19658 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/photojournal/color-maps-of-enceladus-2014/" target="_blank" rel="noreferrer">Encélado · Cassini PIA18435 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/photojournal/color-maps-of-dione-2014/" target="_blank" rel="noreferrer">Dione · Cassini PIA18434 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/photojournal/color-maps-of-rhea-2014/" target="_blank" rel="noreferrer">Reia · Cassini PIA18438 <ExternalLink size={11} /></a>
          <a href="https://science.nasa.gov/photojournal/color-maps-of-iapetus-2014/" target="_blank" rel="noreferrer">Jápeto · Cassini PIA18436 <ExternalLink size={11} /></a>
        </div>
      </details>
    </section>
  )
}
