'use client'

import { quickFacts } from '../hand/planet-facts'

/** Cartão de dados do planeta apontado/segurado pela mão (canto inferior esquerdo, não cobre a cena). */
export function HoloPlanetCard({ name, held }: { name: string; held: boolean }) {
  const f = quickFacts(name)
  if (!f) return null
  const rows: [string, string][] = [
    ['DISTÂNCIA', f.distance], ['TEMPERATURA MÉDIA', f.temperature], ['GRAVIDADE', f.gravity], ['MASSA', f.mass], ['RAIO', f.radius],
  ]
  return (
    <aside className="holo-card" aria-live="polite">
      <header>
        <small>{held ? 'OBJETO SELECIONADO' : 'OBJETO EM MIRA'}</small>
        <strong>{f.name.toUpperCase()}</strong>
        <em>{f.type}</em>
      </header>
      <dl>
        {rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}
      </dl>
      <footer>{held ? 'Mova para arrastar · gire a mão em círculo para rotacionar · abra para soltar' : 'Faça pinça para selecionar'}</footer>
    </aside>
  )
}
