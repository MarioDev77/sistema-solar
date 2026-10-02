'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Search, X } from 'lucide-react'
import type { PlanetData } from '../data'
import { categories, constants, defaultInputs, formatResult, formulas, levelLabels, runCalc, usesPlanet, type Formula, type Level } from '../physics-formulas'

const norm = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const SCALES = [1, 1.25, 1.5]
const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? ''

function matches(f: Formula, q: string) {
  if (!q) return true
  const hay = norm([f.name, f.expr, f.use, f.ex ?? '', ...f.vars.map((v) => `${v[0]} ${v[1]}`)].join(' '))
  return q.split(/\s+/).every((word) => hay.includes(word))
}

export function FormulasPanel({ planet, onClose }: { planet: PlanetData; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [level, setLevel] = useState<'all' | Level>('all')
  const [openId, setOpenId] = useState<string | null>('newton-grav')
  const [scale, setScale] = useState(0)
  const [inputs, setInputs] = useState<Record<string, string[]>>({})

  const q = norm(query.trim())
  const list = useMemo(
    () => formulas.filter((f) => (cat === 'all' || f.cat === cat) && (level === 'all' || f.level === level) && matches(f, q)),
    [cat, level, q]
  )
  const open = cat === 'constantes' ? null : formulas.find((f) => f.id === openId) ?? null
  const values = open?.calc ? inputs[open.id] ?? defaultInputs(open.calc) : []
  const result = open?.calc ? runCalc(open.calc, values) : null
  const setValue = (idx: number, text: string) => {
    if (!open?.calc) return
    const next = [...values]
    next[idx] = text
    setInputs((prev) => ({ ...prev, [open.id]: next }))
  }

  return (
    <section className={`fx-panel ${open ? 'has-detail' : ''}`} style={{ ['--fx-scale' as string]: SCALES[scale] }} aria-label="Fórmulas de Física">
      <header className="fx-head">
        <div>
          <span className="eyebrow">MODO PROFESSOR</span>
          <h2>Fórmulas de Física</h2>
        </div>
        <div className="fx-head-actions">
          <div className="fx-size" role="group" aria-label="Tamanho do texto">
            {['A', 'A+', 'A++'].map((label, idx) => (
              <button key={label} className={scale === idx ? 'selected' : ''} aria-pressed={scale === idx} onClick={() => setScale(idx)}>{label}</button>
            ))}
          </div>
          <button className="close-small" aria-label="Fechar fórmulas" onClick={onClose}><X size={16} /></button>
        </div>
      </header>

      <div className="fx-filters">
        <label className="fx-search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar: energia, Kepler, ohm, v = λf…" aria-label="Buscar fórmula" />
          {query && <button aria-label="Limpar busca" onClick={() => setQuery('')}><X size={13} /></button>}
        </label>
        <div className="fx-chips" role="group" aria-label="Assunto">
          <button className={cat === 'all' ? 'selected' : ''} onClick={() => setCat('all')}>TODAS</button>
          {categories.map((c) => (
            <button key={c.id} className={cat === c.id ? 'selected' : ''} onClick={() => setCat(c.id)}>{c.label.toUpperCase()}</button>
          ))}
          <button className={cat === 'constantes' ? 'selected' : ''} onClick={() => setCat('constantes')}>CONSTANTES</button>
        </div>
        {cat !== 'constantes' && (
          <div className="fx-chips fx-levels" role="group" aria-label="Nível">
            <button className={level === 'all' ? 'selected' : ''} onClick={() => setLevel('all')}>TODOS OS NÍVEIS</button>
            {(Object.keys(levelLabels) as Level[]).map((l) => (
              <button key={l} className={level === l ? 'selected' : ''} onClick={() => setLevel(l)}>{levelLabels[l].toUpperCase()}</button>
            ))}
          </div>
        )}
      </div>

      {cat === 'constantes' ? (
        <div className="fx-constants">
          <table>
            <thead><tr><th>CONSTANTE</th><th>SÍMBOLO</th><th>VALOR</th><th>UNIDADE</th></tr></thead>
            <tbody>
              {constants
                .filter((c) => !q || norm(`${c.name} ${c.sym}`).includes(q))
                .map((c) => (
                  <tr key={c.name}><td>{c.name}</td><td className="fx-sym">{c.sym}</td><td className="fx-num">{c.value}</td><td>{c.unit}</td></tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fx-body">
          <ul className="fx-list" aria-label={`${list.length} fórmulas`}>
            {list.length === 0 && <li className="fx-empty">Nenhuma fórmula encontrada.</li>}
            {list.map((f) => (
              <li key={f.id}>
                <button className={openId === f.id ? 'selected' : ''} onClick={() => setOpenId(f.id)}>
                  <strong>{f.name}</strong>
                  <span>{f.expr}</span>
                </button>
              </li>
            ))}
          </ul>

          {open ? (
            <article className="fx-detail">
              <button className="fx-back" onClick={() => setOpenId(null)}><ArrowLeft size={14} /> VOLTAR À LISTA</button>
              <small className="fx-meta">{catLabel(open.cat).toUpperCase()} · {levelLabels[open.level].toUpperCase()}</small>
              <h3>{open.name}</h3>
              <div className="fx-expr">{open.expr}</div>
              <dl className="fx-vars">
                {open.vars.map(([sym, meaning, unit]) => (
                  <div key={sym + meaning}><dt>{sym}</dt><dd>{meaning}{unit && unit !== '—' ? <em> · {unit}</em> : null}</dd></div>
                ))}
              </dl>
              <p>{open.use}</p>
              {open.ex && <p className="fx-example"><b>Exemplo:</b> {open.ex}</p>}

              {open.calc && (
                <div className="fx-calc">
                  <div className="fx-calc-head">
                    <strong>CALCULADORA</strong>
                    {usesPlanet(open.calc) && (
                      <button onClick={() => setInputs((prev) => ({ ...prev, [open.id]: defaultInputs(open.calc!, planet.name) }))}>
                        USAR DADOS DE {planet.name.toUpperCase()}
                      </button>
                    )}
                  </div>
                  <div className="fx-fields">
                    {open.calc.inputs.map((inp, idx) => (
                      <label key={inp.s + idx}>
                        <span>{inp.s} <small>{inp.l}</small></span>
                        <div><input inputMode="decimal" value={values[idx] ?? ''} onChange={(e) => setValue(idx, e.target.value)} aria-label={`${inp.l} (${inp.u || 'sem unidade'})`} /><i>{inp.u}</i></div>
                      </label>
                    ))}
                  </div>
                  <div className="fx-result" role="status" aria-live="polite">
                    <span>{open.calc.out} =</span>
                    <strong>{result === null ? '—' : formatResult(result)}</strong>
                    <i>{open.calc.ou}</i>
                  </div>
                  <small className="fx-note">Use ponto ou vírgula como separador decimal. Notação: 1e6 = 1 000 000.</small>
                </div>
              )}
            </article>
          ) : (
            <div className="fx-detail fx-placeholder">Escolha uma fórmula na lista para ver o significado das variáveis{'\u00a0'}e usar a calculadora.</div>
          )}
        </div>
      )}
    </section>
  )
}
