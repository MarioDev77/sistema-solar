'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Copy, Search, Star, X } from 'lucide-react'
import type { PlanetData } from '../data'
import { categories, constants, defaultInputs, formatResult, formulas, levelLabels, runCalc, usesPlanet, type Formula, type Level } from '../physics-formulas'

const norm = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const SCALES = [1, 1.15, 1.3]
const FAV_KEY = 'astralab:fx-favoritas'
const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? ''

/** Cada assunto ganha um símbolo e uma cor própria: o olho aprende "onde fica" cada coisa. */
const META: Record<string, { glyph: string; hue: number }> = {
  cinematica: { glyph: 'v', hue: 210 },
  circular: { glyph: 'ω', hue: 250 },
  dinamica: { glyph: 'F', hue: 20 },
  energia: { glyph: 'E', hue: 40 },
  impulso: { glyph: 'p', hue: 340 },
  gravitacao: { glyph: 'G', hue: 172 },
  fluidos: { glyph: 'ρ', hue: 190 },
  termo: { glyph: 'T', hue: 5 },
  ondas: { glyph: 'λ', hue: 280 },
  optica: { glyph: 'n', hue: 110 },
  eletro: { glyph: 'V', hue: 55 },
  magneto: { glyph: 'B', hue: 315 },
  moderna: { glyph: 'ħ', hue: 150 },
}
const metaOf = (cat: string) => META[cat] ?? { glyph: 'Σ', hue: 172 }
const LEVEL_SHORT: Record<Level, string> = { F: 'FUND.', M: 'MÉDIO', S: 'AVANÇ.' }

/** Atalhos da tela inicial: as fórmulas que mais conversam com o Sistema Solar. */
const FEATURED: { id: string; hint: string }[] = [
  { id: 'kepler3', hint: 'Quanto dura o ano de cada planeta' },
  { id: 'newton-grav', hint: 'A força que mantém tudo em órbita' },
  { id: 'v-orb', hint: 'A que velocidade um planeta orbita' },
  { id: 'v-esc', hint: 'O que é preciso para sair de um planeta' },
  { id: 'g-sup', hint: 'Quanto você pesaria em outro mundo' },
  { id: 'sinodico', hint: 'De quanto em quanto tempo dois planetas se alinham' },
  { id: 'teq', hint: 'Por que cada planeta tem a sua temperatura' },
  { id: 'fluxo', hint: 'Por que Netuno recebe tão pouca luz' },
]

function matches(f: Formula, q: string) {
  if (!q) return true
  const hay = norm([f.name, f.expr, f.use, f.ex ?? '', catLabel(f.cat), levelLabels[f.level], ...f.vars.map((v) => `${v[0]} ${v[1]}`)].join(' '))
  return q.split(/\s+/).every((word) => hay.includes(word))
}

const hueStyle = (hue: number) => ({ ['--hue' as string]: hue })

export function FormulasPanel({ planet, onClose }: { planet: PlanetData; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [level, setLevel] = useState<'all' | Level>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [scale, setScale] = useState(0)
  const [inputs, setInputs] = useState<Record<string, string[]>>({})
  const [favs, setFavs] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  // favoritas ficam salvas só neste navegador (sem servidor)
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')
      if (Array.isArray(parsed)) setFavs(parsed.filter((id): id is string => typeof id === 'string'))
    } catch { /* sem armazenamento: segue sem favoritas salvas */ }
  }, [])
  const toggleFav = (id: string) => setFavs((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)) } catch { /* ignora */ }
    return next
  })

  // "/" leva direto para a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { detailRef.current?.scrollTo({ top: 0 }) }, [openId])
  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const q = norm(query.trim())
  // base = busca + nível; as contagens do menu lateral saem daqui, então mostram sempre o que existe de verdade
  const base = useMemo(() => formulas.filter((f) => (level === 'all' || f.level === level) && matches(f, q)), [level, q])
  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const f of base) result[f.cat] = (result[f.cat] ?? 0) + 1
    return result
  }, [base])
  const favCount = useMemo(() => base.filter((f) => favs.includes(f.id)).length, [base, favs])
  const list = useMemo(
    () => (cat === 'all' ? base : cat === 'fav' ? base.filter((f) => favs.includes(f.id)) : base.filter((f) => f.cat === cat)),
    [base, cat, favs]
  )
  // no "Todas" a lista vem separada por assunto, com títulos
  const groups = useMemo(() => {
    if (cat !== 'all') return [{ id: cat, label: '', items: list }]
    return categories.map((c) => ({ id: c.id as string, label: c.label as string, items: list.filter((f) => f.cat === c.id) })).filter((g) => g.items.length > 0)
  }, [cat, list])

  const open = cat === 'constantes' ? null : formulas.find((f) => f.id === openId) ?? null
  const openIdx = open ? list.findIndex((f) => f.id === open.id) : -1
  const values = open?.calc ? inputs[open.id] ?? defaultInputs(open.calc) : []
  const result = open?.calc ? runCalc(open.calc, values) : null
  const setValue = (idx: number, text: string) => {
    if (!open?.calc) return
    const next = [...values]
    next[idx] = text
    setInputs((prev) => ({ ...prev, [open.id]: next }))
  }
  const step = (delta: number) => { const next = list[openIdx + delta]; if (next) setOpenId(next.id) }
  const pickFeatured = (id: string) => { setCat('all'); setQuery(''); setLevel('all'); setOpenId(id) }
  const copyExpr = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true) } catch { /* sem permissão de área de transferência */ }
  }
  const filtered = !!q || level !== 'all' || cat !== 'all'
  const clearAll = () => { setQuery(''); setLevel('all'); setCat('all') }
  const title = cat === 'all' ? 'Todas as fórmulas' : cat === 'fav' ? 'Favoritas' : catLabel(cat)
  const featured = FEATURED.map((item) => ({ ...item, formula: formulas.find((f) => f.id === item.id) })).filter((item): item is typeof item & { formula: Formula } => !!item.formula)

  return (
    <section className={`fx-panel ${open ? 'has-detail' : ''}`} style={{ ['--fx-scale' as string]: SCALES[scale] }} aria-label="Fórmulas de Física">
      <header className="fx-head">
        <div className="fx-title">
          <span className="eyebrow">MODO PROFESSOR</span>
          <h2>Fórmulas de Física <small>{formulas.length} fórmulas · {constants.length} constantes</small></h2>
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
          <Search size={16} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.stopPropagation(); setQuery('') } }}
            placeholder="Buscar fórmula, variável ou assunto: Kepler, energia, v = λf…"
            aria-label="Buscar fórmula"
          />
          {query ? <button type="button" aria-label="Limpar busca" onClick={() => { setQuery(''); searchRef.current?.focus() }}><X size={14} /></button> : <kbd>/</kbd>}
        </label>
        {cat !== 'constantes' && (
          <div className="fx-levels" role="group" aria-label="Nível">
            {([['all', 'TODOS'], ['F', 'FUNDAMENTAL'], ['M', 'MÉDIO'], ['S', 'AVANÇADO']] as const).map(([id, label]) => (
              <button key={id} data-level={id} className={level === id ? 'selected' : ''} aria-pressed={level === id} onClick={() => setLevel(id)}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="fx-body">
        <nav className="fx-nav" aria-label="Assuntos">
          <button className={cat === 'all' ? 'selected' : ''} aria-current={cat === 'all'} onClick={() => setCat('all')} style={hueStyle(172)}>
            <i className="fx-glyph">Σ</i><span>Todas</span><b>{base.length}</b>
          </button>
          <button className={cat === 'fav' ? 'selected' : ''} aria-current={cat === 'fav'} onClick={() => setCat('fav')} style={hueStyle(45)}>
            <i className="fx-glyph"><Star size={12} /></i><span>Favoritas</span><b>{favCount}</b>
          </button>
          <hr />
          {categories.map((c) => {
            const m = metaOf(c.id)
            const n = counts[c.id] ?? 0
            return (
              <button key={c.id} className={`${cat === c.id ? 'selected' : ''} ${n === 0 ? 'is-empty' : ''}`} aria-current={cat === c.id} onClick={() => setCat(c.id)} style={hueStyle(m.hue)}>
                <i className="fx-glyph">{m.glyph}</i><span>{c.label}</span><b>{n}</b>
              </button>
            )
          })}
          <hr />
          <button className={cat === 'constantes' ? 'selected' : ''} aria-current={cat === 'constantes'} onClick={() => setCat('constantes')} style={hueStyle(200)}>
            <i className="fx-glyph">c</i><span>Constantes</span><b>{constants.length}</b>
          </button>
        </nav>

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
          <div className="fx-split">
            <div className="fx-listcol">
              <div className="fx-status" role="status" aria-live="polite">
                <strong>{title}</strong>
                <span>{list.length} {list.length === 1 ? 'resultado' : 'resultados'}</span>
                {filtered && <button onClick={clearAll}>LIMPAR</button>}
              </div>
              <ul className="fx-list" aria-label={`${list.length} fórmulas`}>
                {list.length === 0 && (
                  <li className="fx-empty">
                    {cat === 'fav' ? <>Nenhuma favorita ainda.<br />Abra uma fórmula e toque em <Star size={12} /> para guardá-la aqui.</> : <>Nada encontrado neste filtro.</>}
                    {cat !== 'all' && base.length > 0 && <button onClick={() => setCat('all')}>BUSCAR EM TODAS ({base.length})</button>}
                  </li>
                )}
                {groups.map((g) => (
                  <li key={g.id} className="fx-group" style={hueStyle(metaOf(g.id).hue)}>
                    {g.label && <h4><i className="fx-glyph">{metaOf(g.id).glyph}</i>{g.label}<b>{g.items.length}</b></h4>}
                    <ul>
                      {g.items.map((f) => {
                        const fav = favs.includes(f.id)
                        return (
                          <li key={f.id} className={`fx-item ${openId === f.id ? 'selected' : ''}`} style={hueStyle(metaOf(f.cat).hue)}>
                            <button className="fx-item-main" aria-current={openId === f.id} onClick={() => setOpenId(f.id)}>
                              <strong>{f.name}</strong>
                              <span>{f.expr}</span>
                            </button>
                            <em className="fx-lv" data-level={f.level} title={levelLabels[f.level]}>{LEVEL_SHORT[f.level]}</em>
                            <button className={`fx-star ${fav ? 'on' : ''}`} aria-pressed={fav} aria-label={`${fav ? 'Remover dos favoritos' : 'Favoritar'}: ${f.name}`} onClick={() => toggleFav(f.id)}><Star size={14} /></button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fx-detailcol" ref={detailRef}>
              {open ? (
                <article className="fx-detail" style={hueStyle(metaOf(open.cat).hue)}>
                  <button className="fx-back" onClick={() => setOpenId(null)}><ArrowLeft size={14} /> VOLTAR À LISTA</button>
                  <div className="fx-topline">
                    <small className="fx-meta"><i className="fx-glyph">{metaOf(open.cat).glyph}</i>{catLabel(open.cat).toUpperCase()}<em className="fx-lv" data-level={open.level}>{levelLabels[open.level].toUpperCase()}</em></small>
                    <div className="fx-tools">
                      <button onClick={() => copyExpr(open.expr)} aria-label="Copiar a fórmula">{copied ? <Check size={14} /> : <Copy size={14} />}<span>{copied ? 'COPIADA' : 'COPIAR'}</span></button>
                      <button className={favs.includes(open.id) ? 'on' : ''} aria-pressed={favs.includes(open.id)} onClick={() => toggleFav(open.id)}><Star size={14} /><span>{favs.includes(open.id) ? 'FAVORITA' : 'FAVORITAR'}</span></button>
                    </div>
                  </div>
                  <h3>{open.name}</h3>
                  <div className="fx-expr">{open.expr}</div>
                  <section className="fx-block">
                    <h5>O QUE SIGNIFICA CADA LETRA</h5>
                    <dl className="fx-vars">
                      {open.vars.map(([sym, meaning, unit]) => (
                        <div key={sym + meaning}><dt>{sym}</dt><dd>{meaning}{unit && unit !== '—' ? <em>{unit}</em> : null}</dd></div>
                      ))}
                    </dl>
                  </section>
                  <p className="fx-use">{open.use}</p>
                  {open.ex && <p className="fx-example"><b>Exemplo</b>{open.ex}</p>}

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

                  {openIdx >= 0 && (
                    <nav className="fx-stepper" aria-label="Navegar entre fórmulas">
                      <button disabled={openIdx === 0} onClick={() => step(-1)}><ChevronLeft size={14} /> ANTERIOR</button>
                      <span>{openIdx + 1} / {list.length}</span>
                      <button disabled={openIdx === list.length - 1} onClick={() => step(1)}>PRÓXIMA <ChevronRight size={14} /></button>
                    </nav>
                  )}
                </article>
              ) : (
                <div className="fx-home">
                  <h3>Por onde começar?</h3>
                  <p>Escolha um assunto no menu, busque pelo nome (tecla <kbd>/</kbd>) ou abra uma destas, ligadas ao Sistema Solar:</p>
                  <div className="fx-featured">
                    {featured.map(({ id, hint, formula }) => (
                      <button key={id} onClick={() => pickFeatured(id)} style={hueStyle(metaOf(formula.cat).hue)}>
                        <small>{hint}</small>
                        <strong>{formula.name}</strong>
                        <span>{formula.expr}</span>
                      </button>
                    ))}
                  </div>
                  <p className="fx-tip"><Star size={12} /> Marque com estrela as fórmulas da aula: elas ficam em <b>Favoritas</b>, salvas neste navegador.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
