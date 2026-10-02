'use client'

import type { Dispatch, SetStateAction } from 'react'
import { X } from 'lucide-react'
import { CatalogObject, catalogObjects, moonKnowledge, planetFacts } from '../data'

export function ComparePanel({ compareA, compareB, comparedA, comparedB, setInfoOpen, setCompareOpen, setCompareA, setCompareB }: { compareA: string; compareB: string; comparedA: CatalogObject; comparedB: CatalogObject; setInfoOpen: Dispatch<SetStateAction<boolean>>; setCompareOpen: Dispatch<SetStateAction<boolean>>; setCompareA: Dispatch<SetStateAction<string>>; setCompareB: Dispatch<SetStateAction<string>> }) {
  return (
    <section className="compare-panel" aria-label="Comparar dois objetos">
      <div className="panel-header"><div><span className="eyebrow">COMPARAÇÃO</span><h2>Comparar objetos</h2></div><button className="close-small" aria-label="Fechar comparação" onClick={() => { setCompareOpen(false); setInfoOpen(true) }}><X size={15} /></button></div>
      <div className="compare-selectors">
        <label>OBJETO A<select value={compareA} onChange={(event) => setCompareA(event.target.value)}>{catalogObjects.map((item) => <option key={`a-${item.name}`} value={item.name}>{item.name} · {item.kind}</option>)}</select></label>
        <label>OBJETO B<select value={compareB} onChange={(event) => setCompareB(event.target.value)}>{catalogObjects.map((item) => <option key={`b-${item.name}`} value={item.name}>{item.name} · {item.kind}</option>)}</select></label>
      </div>
      <div className="comparison-table" role="table" aria-label="Dados comparativos">
        <div className="comparison-head" role="row"><span role="columnheader">DADO</span><strong role="columnheader">{comparedA.name}</strong><strong role="columnheader">{comparedB.name}</strong></div>
        <div role="row"><span role="cell">Diâmetro</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.diameter ?? '—' : planetFacts[comparedA.name]?.diameter ?? '—'}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.diameter ?? '—' : planetFacts[comparedB.name]?.diameter ?? '—'}</strong></div>
        <div role="row"><span role="cell">Distância orbital</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.orbit ?? '—' : `${comparedA.planet.distance} do Sol`}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.orbit ?? '—' : `${comparedB.planet.distance} do Sol`}</strong></div>
        <div role="row"><span role="cell">Período orbital</span><strong role="cell">{comparedA.moon ? moonKnowledge[comparedA.name]?.period ?? '—' : comparedA.planet.period}</strong><strong role="cell">{comparedB.moon ? moonKnowledge[comparedB.name]?.period ?? '—' : comparedB.planet.period}</strong></div>
        <div role="row"><span role="cell">Tipo</span><strong role="cell">{comparedA.kind}</strong><strong role="cell">{comparedB.kind}</strong></div>
      </div>
      <p className="compare-note">Distâncias de luas são medidas a partir do planeta hospedeiro; de planetas, a partir do Sol.</p>
    </section>
  )
}
