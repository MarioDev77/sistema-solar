'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Orbit, Crosshair, ChevronRight, X, ZoomIn, ExternalLink, Sparkles as SparklesIcon } from 'lucide-react'
import { CosmosObject, PlanetData } from '../data'
import { nebulaTextures } from '../textures'

export function CosmosPanel({ selected, cosmosTab, cosmosSelection, nebulaFocus, visibleCosmosObjects, selectedCosmosObject, setCosmosOpen, setCosmosTab, setCosmosSelection, setDeepSpaceMode, setNebulaFocus }: { selected: PlanetData; cosmosTab: 'nebula' | 'solar'; cosmosSelection: string; nebulaFocus: string | null; visibleCosmosObjects: CosmosObject[]; selectedCosmosObject: CosmosObject; setCosmosOpen: Dispatch<SetStateAction<boolean>>; setCosmosTab: Dispatch<SetStateAction<'nebula' | 'solar'>>; setCosmosSelection: Dispatch<SetStateAction<string>>; setDeepSpaceMode: Dispatch<SetStateAction<boolean>>; setNebulaFocus: Dispatch<SetStateAction<string | null>> }) {
  return (
    <section className="cosmos-panel" aria-label="Catálogo de nebulosas e objetos do espaço">
      <div className="panel-header">
        <div><span className="eyebrow">CATÁLOGO ASTRONÔMICO</span><h2>Além do Sistema Solar</h2></div>
        <button className="close-small" aria-label="Fechar catálogo Cosmos" onClick={() => setCosmosOpen(false)}><X size={15} /></button>
      </div>
      <p className="cosmos-intro">Explore nebulosas e complete o mapa dos pequenos corpos do nosso Sistema Solar.</p>
      <div className="classroom-tabs" role="tablist" aria-label="Categorias do catálogo">
        <button role="tab" aria-selected={cosmosTab === 'nebula'} className={cosmosTab === 'nebula' ? 'selected' : ''} onClick={() => { setCosmosTab('nebula'); if (!nebulaTextures[cosmosSelection as keyof typeof nebulaTextures]) setCosmosSelection('Nebulosa de Órion'); setDeepSpaceMode(true); setNebulaFocus(null) }}><SparklesIcon size={14} /> NEBULOSAS</button>
        <button role="tab" aria-selected={cosmosTab === 'solar'} className={cosmosTab === 'solar' ? 'selected' : ''} onClick={() => { setCosmosTab('solar'); setCosmosSelection('Ceres'); setDeepSpaceMode(false); setNebulaFocus(null) }}><Orbit size={14} /> SISTEMA SOLAR</button>
      </div>
      <div className={`cosmos-art cosmos-art-${selectedCosmosObject.style}`} role="img" aria-label={`Ilustração didática de ${selectedCosmosObject.name}`}>
        {selectedCosmosObject.group === 'Nebulosa' ? <><img src={nebulaTextures[selectedCosmosObject.name as keyof typeof nebulaTextures]} alt={`Imagem científica de ${selectedCosmosObject.name}`} /><small>IMAGEM {selectedCosmosObject.imageCredit}</small></> : <><span className="cosmos-starfield" /><span className="cosmos-cloud cloud-one" /><span className="cosmos-cloud cloud-two" /><span className="cosmos-cloud cloud-three" /><span className="cosmos-core" /><small>ILUSTRAÇÃO ESQUEMÁTICA · NÃO É UMA FOTOGRAFIA</small></>}
      </div>
      <div className="cosmos-detail"><span className="guide-kicker">{selectedCosmosObject.group.toUpperCase()} · {selectedCosmosObject.summary.toUpperCase()}</span><h3>{selectedCosmosObject.name}</h3><p>{selectedCosmosObject.detail}</p><strong>{selectedCosmosObject.fact}</strong><a className="fact-source" href={selectedCosmosObject.source} target="_blank" rel="noreferrer">Fonte e mais informações: {selectedCosmosObject.sourceLabel} <ExternalLink size={11} /></a>
        {selectedCosmosObject.group === 'Nebulosa' && <div className="nebula-actions"><button className="travel-button" onClick={() => { setDeepSpaceMode(true); setNebulaFocus(selectedCosmosObject.name); setCosmosOpen(false) }}><Crosshair size={14} /> {nebulaFocus === selectedCosmosObject.name ? 'VISUALIZANDO DE PERTO' : 'VIAJAR ATÉ A NEBULOSA'} <ChevronRight size={14} /></button><button className="travel-button secondary" onClick={() => setNebulaFocus(null)}><ZoomIn size={14} /> VISÃO GERAL DO ESPAÇO</button></div>}
      </div>
      <div className="cosmos-list" aria-label={cosmosTab === 'nebula' ? 'Nebulosas para explorar' : 'Objetos do Sistema Solar para explorar'}>
        {visibleCosmosObjects.map((item) => <button key={item.name} className={item.name === selectedCosmosObject.name ? 'selected' : ''} onClick={() => { setCosmosSelection(item.name); if (item.group === 'Nebulosa') { setDeepSpaceMode(true); setNebulaFocus(null) } else { setDeepSpaceMode(false); setNebulaFocus(null) } }}><span className={`cosmos-list-dot dot-${item.style}`} /><span>{item.name}<small>{item.summary}</small></span><ChevronRight size={14} /></button>)}
      </div>
      <p className="cosmos-caveat">Nuvem 3D reconstruída por amostragem das imagens científicas: a profundidade é estimada para visualização, não medida. Cores de Hubble e Webb combinam filtros e podem diferir da visão humana.</p>
    </section>
  )
}
