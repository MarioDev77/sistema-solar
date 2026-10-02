'use client'

import { ExternalLink, PanelRightClose } from 'lucide-react'
import { CosmosObject } from '../data'
import { nebulaTextures } from '../textures'

/** Card lateral da nebulosa em foco. Pode ser ocultado para ver a nebulosa sem nada na frente. */
export function NebulaCard({ object, onHide }: { object: CosmosObject; onHide: () => void }) {
  return (
    <section className="info-panel nebula-card" aria-label={`Dados de ${object.name}`}>
      <div className="panel-header">
        <div><span className="eyebrow">NEBULOSA SELECIONADA</span><h2>{object.name}</h2></div>
        <div className="planet-panel-actions">
          <button className="close-small" aria-label="Ocultar card (continua vendo a nebulosa)" title="Ocultar card" onClick={onHide}><PanelRightClose size={16} /></button>
        </div>
      </div>
      <div className="nebula-card-art">
        <img src={nebulaTextures[object.name as keyof typeof nebulaTextures]} alt={`Imagem científica de ${object.name}`} />
        <small>IMAGEM {object.imageCredit}</small>
      </div>
      <div className="object-meta"><span className="tag">{object.summary}</span>{object.distance && <span className="meta-line"><span /> {object.distance.toUpperCase()}</span>}</div>
      <p>{object.detail}</p>
      <strong className="nebula-card-fact">{object.fact}</strong>
      <a className="fact-source" href={object.source} target="_blank" rel="noreferrer">Fonte: {object.sourceLabel} <ExternalLink size={11} /></a>
    </section>
  )
}
