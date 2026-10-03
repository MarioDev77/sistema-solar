'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Search, Orbit, Hand, Play, Pause, Maximize2, ChevronRight, X, Layers3, Camera, MousePointer2, ZoomIn, ArrowLeft, Compass, GitCompareArrows, BookOpen, Presentation, Check, Telescope, MoreHorizontal, Sparkles as SparklesIcon, PanelRightOpen, PanelRightClose, Sigma } from 'lucide-react'
import { SIM_T0, SimClock } from './solar/clock'
import { CatalogObject, catalogObjects, CosmosObject, cosmosObjects, lessons, moonKnowledge, MoonSelection, PlanetData, planets } from './solar/data'
import { preloadMoonTexturesIdle, preloadNebulaTextures } from './solar/preload'
import { LoadingScreen } from './solar/loading-screen'
import { Scene } from './solar/scene'
import { nebulaTextures } from './solar/textures'
import { CosmosPanel } from './solar/panels/cosmos-panel'
import { InfoPanel } from './solar/panels/info-panel'
import { ComparePanel } from './solar/panels/compare-panel'
import { CloseUpBar } from './solar/panels/closeup-bar'
import { SimulationPanel } from './solar/panels/simulation-panel'
import { LayersPanel } from './solar/panels/layers-panel'
import { HandPanel } from './solar/panels/hand-panel'
import { useHandTracking } from './solar/hand/use-hand-tracking'
import { HandOverlay } from './solar/hand/hand-overlay'
import { HandHud } from './solar/hand/hand-hud'
import { PlanetInteraction } from './solar/hand/planet-interaction'
import { PlanetOverrides } from './solar/hand/planet-overrides'
import { HoloPlanetCard } from './solar/panels/holo-planet-card'
import { GuidePanel } from './solar/panels/guide-panel'
import { NebulaCard } from './solar/panels/nebula-card'
import { FormulasPanel } from './solar/panels/formulas-panel'

/** "Júpiter" -> "jupiter" (usado no link compartilhável ?planeta=jupiter). */
const planetSlug = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function SolarSystemExplorer() {
  const [selected, setSelected] = useState<PlanetData>(planets[5])
  const [selectedMoon, setSelectedMoon] = useState<MoonSelection | null>(null)
  const [infoOpen, setInfoOpen] = useState(true)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [belt, setBelt] = useState(true)
  const [kuiperBelt, setKuiperBelt] = useState(false)
  const [comets, setComets] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1000)
  const [query, setQuery] = useState('')
  const [hand, setHand] = useState(false)
  const handTracking = useHandTracking()
  // planetas agarrados pela mão: ficam fora do React (a cena lê por ref); o React só sabe quantos foram movidos
  const planetInteraction = useMemo(() => new PlanetInteraction(), [])
  const planetOverrides = useMemo(() => new PlanetOverrides(), [])
  const [handFocus, setHandFocus] = useState<{ name: string; held: boolean } | null>(null)
  const [movedPlanets, setMovedPlanets] = useState(0)
  useEffect(() => planetOverrides.subscribe((names) => setMovedPlanets(names.length)), [planetOverrides])
  const [layers, setLayers] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [simulationOpen, setSimulationOpen] = useState(false)
  const [guidedOpen, setGuidedOpen] = useState(false)
  const [guideTab, setGuideTab] = useState<'lesson' | 'experiment'>('lesson')
  const [compareOpen, setCompareOpen] = useState(false)
  const [moreToolsOpen, setMoreToolsOpen] = useState(false)
  const [compareA, setCompareA] = useState('Terra')
  const [compareB, setCompareB] = useState('Saturno')
  const [lessonIndex, setLessonIndex] = useState(0)
  const [lessonStep, setLessonStep] = useState(0)
  const [lessonChoice, setLessonChoice] = useState<number | null>(null)
  const [lessonRevealed, setLessonRevealed] = useState(false)
  const [experimentDistance, setExperimentDistance] = useState(1)
  const [experimentMass, setExperimentMass] = useState(1)
  const [experimentPlaying, setExperimentPlaying] = useState(true)
  const [teacherMode, setTeacherMode] = useState(false)
  const [formulasOpen, setFormulasOpen] = useState(false)
  const [cosmosOpen, setCosmosOpen] = useState(false)
  const [cosmosTab, setCosmosTab] = useState<'nebula' | 'solar'>('nebula')
  const [cosmosSelection, setCosmosSelection] = useState('Nebulosa de Órion')
  const [deepSpaceMode, setDeepSpaceMode] = useState(false)
  const [nebulaFocus, setNebulaFocus] = useState<string | null>(null)
  const [nebulaCardOpen, setNebulaCardOpen] = useState(true)
  const [followName, setFollowName] = useState<string | null>(null)
  const [closeUp, setCloseUp] = useState<string | null>(null)
  const clock = useRef<SimClock>({ t: SIM_T0, speed: 1000, playing: true })
  const keyActions = useRef({ previous: () => {}, next: () => {}, planetsEnabled: true })
  const urlSynced = useRef(false)
  const [ready, setReady] = useState(false)
  // velocidade e play/pausa vão para o relógio por ref: mudar isso NÃO re-renderiza a cena por frame
  useEffect(() => { clock.current.speed = speed; clock.current.playing = playing }, [speed, playing])
  // palma aberta estável (~1 s) pausa/retoma a simulação; só vale com o modo holográfico engajado
  const playingRef = useRef(playing)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => {
    const controller = handTracking.controller
    if (!controller) return
    return controller.subscribeGestures((g) => {
      if (!g.engaged) return
      for (const e of g.events) {
        if (e.type !== 'palm-toggle') continue
        const next = !playingRef.current
        playingRef.current = next
        setPlaying(next)
        controller.notify(next ? 'SIMULAÇÃO RETOMADA' : 'SIMULAÇÃO PAUSADA')
      }
    })
  }, [handTracking.controller])
  // puxar = aproximar o objeto para análise · empurrar = voltar à visão geral (só com o modo holográfico engajado)
  const pullPush = useRef({ closeUp: null as string | null, followName: null as string | null, focus: null as string | null, selected: 'Saturno', blocked: false })
  useEffect(() => {
    const controller = handTracking.controller
    if (!controller) return
    return controller.subscribeGestures((g) => {
      if (!g.engaged) return
      const st = pullPush.current
      for (const e of g.events) {
        if (e.type !== 'pull' && e.type !== 'push') continue
        if (st.blocked || planetInteraction.view.held) continue
        if (e.type === 'pull') {
          const name = st.focus ?? st.selected
          const planet = planets.find((x) => x.name === name)
          if (!planet || st.closeUp === name) continue
          setSelected(planet); setSelectedMoon(null); setInfoOpen(true); setFollowName(null); setCloseUp(name)
          controller.notify('APROXIMAR OBJETO PARA ANÁLISE')
        } else {
          if (st.closeUp || st.followName) { setCloseUp(null); setFollowName(null); setSelectedMoon(null) }
          controller.notify('RETORNAR VISUALIZAÇÃO') // sem vista próxima: a ponte da câmera recua o zoom
        }
      }
    })
  }, [handTracking.controller, planetInteraction])
  // depois que a cena abriu, as texturas das luas chegam em segundo plano (sem competir com a abertura)
  useEffect(() => { if (ready) preloadMoonTexturesIdle() }, [ready])
  // Esc sai da vista próxima / do seguimento
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (formulasOpen) setFormulasOpen(false); else if (teacherMode) setTeacherMode(false); else if (moreToolsOpen) setMoreToolsOpen(false); else if (cosmosOpen) setCosmosOpen(false); else if (searchOpen) setSearchOpen(false); else if (compareOpen) { setCompareOpen(false); setInfoOpen(true) } else if (closeUp) { setCloseUp(null); setSelectedMoon(null) } else if (followName) setFollowName(null); else if (deepSpaceMode && nebulaFocus) setNebulaFocus(null); else if (deepSpaceMode) { setDeepSpaceMode(false); setInfoOpen(true) } } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [closeUp, compareOpen, cosmosOpen, deepSpaceMode, followName, formulasOpen, moreToolsOpen, nebulaFocus, searchOpen, teacherMode])
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true)
        window.requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.search-box input')?.focus())
      }
    }
    window.addEventListener('keydown', handleSearchShortcut)
    return () => window.removeEventListener('keydown', handleSearchShortcut)
  }, [])
  // link compartilhável: ?planeta=marte seleciona o planeta ao abrir; trocar de planeta atualiza a URL
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('planeta')
    const found = wanted ? planets.find((planet) => planetSlug(planet.name) === wanted.toLowerCase()) : null
    if (found) setSelected(found)
  }, [])
  useEffect(() => {
    // na abertura não escreve nada: a URL só muda quando o usuário troca de planeta
    if (!urlSynced.current) { urlSynced.current = true; return }
    const url = new URL(window.location.href)
    if (url.searchParams.get('planeta') === planetSlug(selected.name)) return
    url.searchParams.set('planeta', planetSlug(selected.name))
    window.history.replaceState(window.history.state, '', url)
  }, [selected])
  // quem prefere menos movimento começa com a simulação pausada
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false)
  }, [])
  // nebulosas só são baixadas ao entrar no espaço profundo / abrir o catálogo
  useEffect(() => { if (deepSpaceMode || cosmosOpen) preloadNebulaTextures() }, [deepSpaceMode, cosmosOpen])
  // atalhos: espaço pausa/retoma · ← → trocam de planeta
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      if (event.code === 'Space') {
        if (target?.tagName === 'BUTTON') return
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key === 'ArrowRight' && keyActions.current.planetsEnabled) {
        keyActions.current.next()
      } else if (event.key === 'ArrowLeft' && keyActions.current.planetsEnabled) {
        keyActions.current.previous()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
  const searchResults = catalogObjects.filter((item) => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
    return normalize(item.name).includes(normalize(query.trim()))
  })
  const selectObject = (item: CatalogObject) => {
    setSelected(item.planet)
    setSelectedMoon(item.moon ? { moon: item.moon, planet: item.planet } : null)
    setInfoOpen(true)
    setCompareOpen(false)
    setFollowName(null)
    setCloseUp(item.moon ? item.planet.name : null)
  }
  const lesson = lessons[lessonIndex]
  const lessonPlanet = planets.find((planet) => planet.name === lesson.target) ?? planets[0]
  const chooseLesson = (index: number) => {
    setLessonIndex(index)
    setLessonStep(0)
    setLessonChoice(null)
    setLessonRevealed(false)
  }
  const toggleTeacherMode = () => {
    const entering = !teacherMode
    setTeacherMode(entering)
    setFormulasOpen(false)
    if (entering) {
      setPlaying(false)
      clock.current.playing = false
      setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null)
      setInfoOpen(false); setSelectedMoon(null); setCloseUp(null); setFollowName(null)
    }
  }
  const toggleCosmos = () => {
    const opening = !cosmosOpen
    setCosmosOpen(opening)
    if (opening) {
      setDeepSpaceMode(true)
      setCosmosTab('nebula')
      if (!nebulaTextures[cosmosSelection as keyof typeof nebulaTextures]) setCosmosSelection('Nebulosa de Órion')
      setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false)
      setSelectedMoon(null); setCloseUp(null); setFollowName(null); setInfoOpen(false)
    }
  }
  const selectNebula = (object: CosmosObject) => {
    setCosmosOpen(false); setCosmosTab('nebula'); setCosmosSelection(object.name); setNebulaFocus(object.name); setNebulaCardOpen(true); setDeepSpaceMode(true)
    setInfoOpen(false); setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false)
  }
  const changeSelectedPlanet = (offset: number) => {
    const currentIndex = planets.findIndex((planet) => planet.name === selected.name)
    const nextIndex = (currentIndex + offset + planets.length) % planets.length
    setSelected(planets[nextIndex])
    setSelectedMoon(null)
    setInfoOpen(true)
    setFollowName(null)
    setCloseUp(null)
  }
  pullPush.current = { closeUp, followName, focus: handFocus?.name ?? null, selected: selected.name, blocked: deepSpaceMode || teacherMode }
  keyActions.current = { previous: () => changeSelectedPlanet(-1), next: () => changeSelectedPlanet(1), planetsEnabled: !deepSpaceMode && !teacherMode }
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Permanece em modo normal se o navegador bloquear a tela cheia.
    }
  }
  const closeUpPlanet = planets.find(p => p.name === closeUp)
  const selectedMoonFacts = selectedMoon ? moonKnowledge[selectedMoon.moon.name] : null
  const comparedA = catalogObjects.find((item) => item.name === compareA) ?? catalogObjects[0]
  const comparedB = catalogObjects.find((item) => item.name === compareB) ?? catalogObjects[1]
  const visibleCosmosObjects = cosmosObjects.filter((item) => cosmosTab === 'nebula' ? item.group === 'Nebulosa' : item.group !== 'Nebulosa')
  const selectedCosmosObject = visibleCosmosObjects.find((item) => item.name === cosmosSelection) ?? visibleCosmosObjects[0]
  const focusedNebula = nebulaFocus ? cosmosObjects.find((item) => item.name === nebulaFocus && item.group === 'Nebulosa') : null
  const showPlanetToggle = !infoOpen && !deepSpaceMode && !teacherMode && !compareOpen
  const showNebulaToggle = !!focusedNebula && !nebulaCardOpen && deepSpaceMode && !cosmosOpen && !teacherMode
  return (
    <main className={`explorer ${closeUp ? 'is-closeup' : ''} ${teacherMode ? 'teacher-mode' : ''} ${teacherMode && formulasOpen ? 'formulas-open' : ''} ${deepSpaceMode ? 'deep-space-mode' : ''} ${handTracking.status.enabled ? 'hand-on' : ''} ${hand ? 'hand-open' : ''}`}>
      {!ready && <LoadingScreen onDone={() => setReady(true)} />}
      <div className="scene">
        <Scene selected={selected.name} showLabels={showLabels} followName={followName} closeUp={closeUp}
          onSelect={(p) => { setSelected(p); setSelectedMoon(null); setInfoOpen(true); setFollowName(null); setCloseUp(p.name) }}
          onMoonSelect={(moon, planet) => { setSelected(planet); setSelectedMoon({ moon, planet }); setInfoOpen(true); setFollowName(null); setCloseUp(planet.name) }}
          showOrbits={showOrbits} belt={belt} kuiperBelt={kuiperBelt} comets={comets} deepSpaceMode={deepSpaceMode} nebulaFocus={nebulaFocus} onNebulaSelect={selectNebula} clock={clock} onFollowEnd={() => setFollowName(null)} handController={handTracking.controller}
          handInteraction={planetInteraction} planetOverrides={planetOverrides} onHandFocus={setHandFocus}
          onHandSelect={(name) => { const p = planets.find((x) => x.name === name); if (p) { setSelected(p); setSelectedMoon(null); setInfoOpen(true) } }} />
      </div>

      <HandOverlay controller={handTracking.controller} show={handTracking.settings.showLandmarks} interaction={planetInteraction} />
      {handTracking.status.enabled && handTracking.status.holoActive && handFocus && <HoloPlanetCard name={handFocus.name} held={handFocus.held} />}
      {movedPlanets > 0 && <button className="holo-restore" onClick={() => planetOverrides.restoreAll()}><Orbit size={14} /> RESTAURAR ÓRBITA · {movedPlanets}</button>}
      <HandHud status={handTracking.status} selectedName={selectedMoon?.moon.name ?? selected.name} playing={playing} />

      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Orbit size={17} />
          </div>

          <div>
            <strong>ASTRA<span>/</span>LAB</strong>
            <small>OBSERVATÓRIO VIRTUAL</small>
          </div>
        </div>

        <div className="top-status">
          <span className="status-dot" />
          {deepSpaceMode ? <>ESPAÇO PROFUNDO <span className="divider" /> IMAGENS NASA · HUBBLE / WEBB</> : <>SISTEMA ONLINE <span className="divider" /> SIMULAÇÃO VISUAL <span className="divider" /> ESCALA REPRESENTATIVA</>}
        </div>

        <button className={`teacher-toggle ${teacherMode ? 'active' : ''}`} aria-pressed={teacherMode} onClick={toggleTeacherMode}>
          <Presentation size={15} /> {teacherMode ? 'SAIR DO MODO PROFESSOR' : 'MODO PROFESSOR'}
        </button>

        <button className="mobile-cosmos-trigger" aria-label="Alternar espaço profundo" aria-pressed={deepSpaceMode} onClick={toggleCosmos}><Telescope size={17} /></button>

        <button
          className="icon-button fullscreen-button"
          aria-label="Alternar tela cheia"
          onClick={toggleFullscreen}
        >
          <Maximize2 size={16} />
        </button>
      </header>

      {teacherMode && <section className="teacher-toolbar" aria-label="Controles do modo professor">
        <div className="tt-brand">
          <strong><Presentation size={15} /> MODO PROFESSOR</strong>
          <small className={playing ? 'is-live' : ''}><span className="tt-dot" />{playing ? 'SIMULAÇÃO ATIVA' : 'SIMULAÇÃO PAUSADA'}</small>
        </div>
        <div className="tt-group" role="group" aria-label="Simulação">
          <span className="tt-label">SIMULAÇÃO</span>
          <div className="tt-row">
            <button className={playing ? '' : 'selected'} onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pausar simulação' : 'Iniciar simulação'}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'PAUSAR' : 'INICIAR'}</button>
          </div>
        </div>
        <div className="tt-group" role="group" aria-label="Mostrar na cena">
          <span className="tt-label">MOSTRAR NA CENA</span>
          <div className="tt-row">
            <button className={showOrbits ? 'selected' : ''} aria-pressed={showOrbits} onClick={() => setShowOrbits(!showOrbits)}><Orbit size={14} /> ÓRBITAS</button>
            <button className={showLabels ? 'selected' : ''} aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)}>{showLabels ? <Check size={14} /> : <X size={14} />} NOMES</button>
            <button className={belt ? 'selected' : ''} aria-pressed={belt} onClick={() => setBelt(!belt)}><span className="mini-dot" /> CINTURÃO</button>
            <button className={kuiperBelt ? 'selected' : ''} aria-pressed={kuiperBelt} onClick={() => setKuiperBelt(!kuiperBelt)}><span className="mini-dot" /> KUIPER</button>
            <button className={comets ? 'selected' : ''} aria-pressed={comets} onClick={() => setComets(!comets)}><Orbit size={14} /> COMETAS</button>
          </div>
        </div>
        <div className="tt-group" role="group" aria-label="Painéis">
          <span className="tt-label">PAINÉIS</span>
          <div className="tt-row">
            <button className={infoOpen ? 'selected' : ''} aria-pressed={infoOpen} onClick={() => setInfoOpen(!infoOpen)}><BookOpen size={14} /> DADOS</button>
            <button className={`tt-primary ${formulasOpen ? 'selected' : ''}`} aria-pressed={formulasOpen} onClick={() => setFormulasOpen(!formulasOpen)}><Sigma size={14} /> FÓRMULAS</button>
          </div>
        </div>
        <button className="teacher-exit" onClick={toggleTeacherMode}>ENCERRAR <X size={14} /></button>
      </section>}
      {teacherMode && formulasOpen && <FormulasPanel planet={selected} onClose={() => setFormulasOpen(false)} />}

      <aside className="left-rail">
        <button className={`rail-button ${searchOpen ? 'active' : ''}`} aria-pressed={searchOpen} aria-label="Abrir busca" onClick={() => { setMoreToolsOpen(false); setSearchOpen(!searchOpen); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true) }}><Search size={17} /><span>BUSCA</span></button>
        <button className={`rail-button ${layers ? 'active' : ''}`} aria-pressed={layers} onClick={() => { setMoreToolsOpen(false); setLayers(!layers); setSearchOpen(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true) }}><Layers3 size={17} /><span>CAMADAS</span></button>
        <button className={`rail-button ${simulationOpen ? 'active' : ''}`} aria-pressed={simulationOpen} onClick={() => { setMoreToolsOpen(false); setSimulationOpen(!simulationOpen); setSearchOpen(false); setLayers(false); setHand(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true) }}><Orbit size={17} /><span>TEMPO</span></button>
        <button className={`rail-button ${guidedOpen ? 'active' : ''}`} aria-pressed={guidedOpen} onClick={() => { setMoreToolsOpen(false); setGuidedOpen(!guidedOpen); setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true) }}><Compass size={17} /><span>GUIA</span></button>
        <div className="rail-more">
          <button className={`rail-button ${moreToolsOpen || cosmosOpen || compareOpen || hand ? 'active' : ''}`} aria-expanded={moreToolsOpen} aria-haspopup="menu" aria-label="Mais ferramentas" onClick={() => setMoreToolsOpen(!moreToolsOpen)}><MoreHorizontal size={18} /><span>MAIS</span></button>
          {moreToolsOpen && <div className="rail-more-menu" role="menu" aria-label="Mais ferramentas">
            <button role="menuitem" className={cosmosOpen ? 'active' : ''} onClick={() => { setMoreToolsOpen(false); toggleCosmos() }}><Telescope size={16} /> Cosmos</button>
            <button role="menuitem" className={compareOpen ? 'active' : ''} onClick={() => { const opening = !compareOpen; setMoreToolsOpen(false); setCompareOpen(opening); setInfoOpen(!opening); setSearchOpen(false); setLayers(false); setHand(false); setSimulationOpen(false); setGuidedOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null) }}><GitCompareArrows size={16} /> Comparar</button>
            <button role="menuitem" className={hand ? 'active' : ''} onClick={() => { setMoreToolsOpen(false); setHand(!hand); setSearchOpen(false); setLayers(false); setSimulationOpen(false); setGuidedOpen(false); setCompareOpen(false); setCosmosOpen(false); setDeepSpaceMode(false); setNebulaFocus(null); setInfoOpen(true) }}><Hand size={16} /> Gestos</button>
            <button role="menuitem" onClick={() => { setMoreToolsOpen(false); handTracking.toggle() }}><Camera size={16} /> {handTracking.status.enabled ? 'Desligar câmera' : 'Ligar câmera'}</button>
          </div>}
        </div>
        {searchOpen && <section className="search-panel" aria-label="Buscar planetas e luas">
          <div className="search-panel-heading">
            <span className="eyebrow">BUSCAR OBJETO</span>
            <button className="close-small" aria-label="Fechar busca" onClick={() => setSearchOpen(false)}><X size={15} /></button>
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Planeta ou lua..."
              aria-label="Buscar planeta ou lua"
            />
            <kbd>⌘ K</kbd>
          </div>
          {query && (
            <div className="search-results">
              {searchResults.map((item) => (
                <button
                  key={`${item.kind}-${item.name}`}
                  onClick={() => {
                    selectObject(item)
                    setSearchOpen(false)
                    setQuery('')
                  }}
                >
                  <span>{item.name}<small className="search-kind">{item.kind}</small></span>
                  <ChevronRight size={14} />
                </button>
              ))}
              {searchResults.length === 0 && <p className="search-empty">Nenhum planeta ou lua encontrado.</p>}
            </div>
          )}
        </section>}
      </aside>

      {cosmosOpen && selectedCosmosObject && <CosmosPanel selected={selected} cosmosTab={cosmosTab} cosmosSelection={cosmosSelection} nebulaFocus={nebulaFocus} visibleCosmosObjects={visibleCosmosObjects} selectedCosmosObject={selectedCosmosObject} setCosmosOpen={setCosmosOpen} setCosmosTab={setCosmosTab} setCosmosSelection={setCosmosSelection} setDeepSpaceMode={setDeepSpaceMode} setNebulaFocus={setNebulaFocus} />}

      {deepSpaceMode && <section className="deep-space-bar"><div><Telescope size={16} /><strong>{nebulaFocus ? `APROXIMAÇÃO · ${nebulaFocus.toUpperCase()}` : 'UNIVERSO PROFUNDO'}</strong><small>POSIÇÕES ESQUEMÁTICAS · DISTÂNCIAS EM ANOS-LUZ</small></div><button onClick={() => setNebulaFocus(null)} disabled={!nebulaFocus}><ZoomIn size={14} /> VISÃO GERAL</button>{focusedNebula && <button aria-pressed={nebulaCardOpen} onClick={() => setNebulaCardOpen(!nebulaCardOpen)}>{nebulaCardOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />} {nebulaCardOpen ? 'OCULTAR CARD' : 'MOSTRAR CARD'}</button>}<button onClick={() => setCosmosOpen(true)}><SparklesIcon size={14} /> CATÁLOGO</button><button className="deep-space-exit" onClick={() => { setDeepSpaceMode(false); setNebulaFocus(null); setCosmosOpen(false); setInfoOpen(true) }}><ArrowLeft size={14} /> SISTEMA SOLAR</button></section>}

      {deepSpaceMode && focusedNebula && nebulaCardOpen && !cosmosOpen && !teacherMode && <NebulaCard object={focusedNebula} onHide={() => setNebulaCardOpen(false)} />}

      {(showPlanetToggle || showNebulaToggle) && <button className="card-toggle" onClick={() => showPlanetToggle ? setInfoOpen(true) : setNebulaCardOpen(true)}><PanelRightOpen size={15} /> {showPlanetToggle ? 'MOSTRAR DADOS' : 'MOSTRAR CARD'}</button>}

      {infoOpen && <InfoPanel selected={selected} selectedMoon={selectedMoon} selectedMoonFacts={selectedMoonFacts} changeSelectedPlanet={changeSelectedPlanet} setSelectedMoon={setSelectedMoon} setInfoOpen={setInfoOpen} setFollowName={setFollowName} setCloseUp={setCloseUp} />}

      {compareOpen && <ComparePanel compareA={compareA} compareB={compareB} comparedA={comparedA} comparedB={comparedB} setInfoOpen={setInfoOpen} setCompareOpen={setCompareOpen} setCompareA={setCompareA} setCompareB={setCompareB} />}

      {/* Barra da vista próxima: voltar, atmosfera e luas visíveis */}
      {closeUp && closeUpPlanet && <CloseUpBar selectedMoon={selectedMoon} closeUpPlanet={closeUpPlanet} setSelected={setSelected} setSelectedMoon={setSelectedMoon} setInfoOpen={setInfoOpen} setCloseUp={setCloseUp} />}

      {simulationOpen && <SimulationPanel playing={playing} speed={speed} clock={clock} setPlaying={setPlaying} setSpeed={setSpeed} />}

      {layers && <LayersPanel showOrbits={showOrbits} belt={belt} kuiperBelt={kuiperBelt} comets={comets} setShowOrbits={setShowOrbits} setBelt={setBelt} setKuiperBelt={setKuiperBelt} setComets={setComets} />}

      {hand && <HandPanel status={handTracking.status} settings={handTracking.settings} onToggle={handTracking.toggle} onRecalibrate={handTracking.recalibrate} onDisengage={handTracking.disengage} movedPlanets={movedPlanets} onRestoreOrbits={() => planetOverrides.restoreAll()} onSelectDevice={handTracking.selectDevice} onSettings={handTracking.updateSettings} onClose={() => setHand(false)} />}

      {guidedOpen && <GuidePanel selected={selected} playing={playing} guideTab={guideTab} lessonIndex={lessonIndex} lessonStep={lessonStep} lessonChoice={lessonChoice} lessonRevealed={lessonRevealed} experimentDistance={experimentDistance} experimentMass={experimentMass} experimentPlaying={experimentPlaying} lesson={lesson} lessonPlanet={lessonPlanet} chooseLesson={chooseLesson} setSelected={setSelected} setSelectedMoon={setSelectedMoon} setInfoOpen={setInfoOpen} setPlaying={setPlaying} setGuidedOpen={setGuidedOpen} setGuideTab={setGuideTab} setLessonStep={setLessonStep} setLessonChoice={setLessonChoice} setLessonRevealed={setLessonRevealed} setExperimentDistance={setExperimentDistance} setExperimentMass={setExperimentMass} setExperimentPlaying={setExperimentPlaying} setFollowName={setFollowName} setCloseUp={setCloseUp} />}

      <div className="hint"><MousePointer2 size={13} /> Arraste para orbitar · scroll/pinça para aproximar · clique seleciona e aproxima · Esc volta · Espaço pausa · ←/→ planetas</div>
    </main>
  )
}
