'use client'

import { useProgress } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import { Search, Orbit, Hand, Play, Pause, RotateCcw, Maximize2, Crosshair, ChevronLeft, ChevronRight, X, Layers3, Camera, MousePointer2, ZoomIn, ArrowLeft, Compass, ExternalLink, GitCompareArrows, Ruler, BookOpen, Atom, Presentation, Check, Telescope, MoreHorizontal, Sparkles as SparklesIcon } from 'lucide-react'
import { SIM_T0, SimClock } from './solar/clock'
import { CatalogObject, catalogObjects, CosmosObject, cosmosObjects, lessons, moonKnowledge, MoonSelection, PlanetData, planetFacts, planets } from './solar/data'
import { KeplerExperiment } from './solar/kepler-experiment'
import { Scene } from './solar/scene'
import { nebulaTextures, textures } from './solar/textures'

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
  const [cameraActive, setCameraActive] = useState(false)
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
  const [cosmosOpen, setCosmosOpen] = useState(false)
  const [cosmosTab, setCosmosTab] = useState<'nebula' | 'solar'>('nebula')
  const [cosmosSelection, setCosmosSelection] = useState('Nebulosa de Órion')
  const [deepSpaceMode, setDeepSpaceMode] = useState(false)
  const [nebulaFocus, setNebulaFocus] = useState<string | null>(null)
  const [followName, setFollowName] = useState<string | null>(null)
  const [closeUp, setCloseUp] = useState<string | null>(null)
  const clock = useRef<SimClock>({ t: SIM_T0, speed: 1000, playing: true })
  const streamRef = useRef<MediaStream | null>(null)
  const { progress, active } = useProgress(); const [ready, setReady] = useState(false)
  // velocidade e play/pausa vão para o relógio por ref: mudar isso NÃO re-renderiza a cena por frame
  useEffect(() => { clock.current.speed = speed; clock.current.playing = playing }, [speed, playing])
  // tela de carregamento: some quando as texturas terminam (com fallback para nunca travar)
  useEffect(() => { if (progress >= 100 && !active) { const id = window.setTimeout(() => setReady(true), 350); return () => window.clearTimeout(id) } }, [progress, active])
  useEffect(() => { const id = window.setTimeout(() => setReady(true), 8000); return () => window.clearTimeout(id) }, [])
  // Esc sai da vista próxima / do seguimento
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (teacherMode) setTeacherMode(false); else if (moreToolsOpen) setMoreToolsOpen(false); else if (cosmosOpen) setCosmosOpen(false); else if (searchOpen) setSearchOpen(false); else if (compareOpen) { setCompareOpen(false); setInfoOpen(true) } else if (closeUp) { setCloseUp(null); setSelectedMoon(null) } else if (followName) setFollowName(null); else if (deepSpaceMode && nebulaFocus) setNebulaFocus(null); else if (deepSpaceMode) { setDeepSpaceMode(false); setInfoOpen(true) } } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [closeUp, compareOpen, cosmosOpen, deepSpaceMode, followName, moreToolsOpen, nebulaFocus, searchOpen, teacherMode])
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
  // libera a câmera ao sair da página
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()) }, [])
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
    setCosmosOpen(false); setCosmosTab('nebula'); setCosmosSelection(object.name); setNebulaFocus(object.name); setDeepSpaceMode(true)
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
  const toggleCamera = async () => {
    if (cameraActive) { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraActive(false); return }
    try { streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true }); setCameraActive(true) } catch { setCameraActive(false) }
  }
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
  return (
    <main className={`explorer ${closeUp ? 'is-closeup' : ''} ${teacherMode ? 'teacher-mode' : ''} ${deepSpaceMode ? 'deep-space-mode' : ''}`}>
      {!ready && <div className="loader-overlay" role="status" aria-live="polite"><div className="loader-box"><Orbit className="loader-spin" size={28} /><span>CARREGANDO TEXTURAS · {Math.round(progress)}%</span><div className="loader-track"><div className="loader-fill" style={{ width: `${progress}%` }} /></div></div></div>}
      <div className="scene">
        <Scene selected={selected.name} showLabels={showLabels} followName={followName} closeUp={closeUp}
          onSelect={(p) => { setSelected(p); setSelectedMoon(null); setInfoOpen(true); setFollowName(null); setCloseUp(p.name) }}
          onMoonSelect={(moon, planet) => { setSelected(planet); setSelectedMoon({ moon, planet }); setInfoOpen(true); setFollowName(null); setCloseUp(planet.name) }}
          showOrbits={showOrbits} belt={belt} kuiperBelt={kuiperBelt} comets={comets} deepSpaceMode={deepSpaceMode} nebulaFocus={nebulaFocus} onNebulaSelect={selectNebula} clock={clock} onFollowEnd={() => setFollowName(null)} />
      </div>

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
        <div className="teacher-toolbar-title"><Presentation size={15} /><span>MODO PROFESSOR</span><small>{playing ? 'SIMULAÇÃO ATIVA' : 'SIMULAÇÃO PAUSADA'}</small></div>
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pausar simulação' : 'Iniciar simulação'}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'PAUSAR' : 'INICIAR'}</button>
        <button className={showOrbits ? 'selected' : ''} aria-pressed={showOrbits} onClick={() => setShowOrbits(!showOrbits)}><Orbit size={14} /> ÓRBITAS</button>
        <button className={showLabels ? 'selected' : ''} aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)}>{showLabels ? <Check size={14} /> : <X size={14} />} NOMES</button>
        <button className={belt ? 'selected' : ''} aria-pressed={belt} onClick={() => setBelt(!belt)}><span className="mini-dot" /> CINTURÃO</button>
        <button className={kuiperBelt ? 'selected' : ''} aria-pressed={kuiperBelt} onClick={() => setKuiperBelt(!kuiperBelt)}><span className="mini-dot" /> KUIPER</button>
        <button className={comets ? 'selected' : ''} aria-pressed={comets} onClick={() => setComets(!comets)}><Orbit size={14} /> COMETAS</button>
        <button className={infoOpen ? 'selected' : ''} aria-pressed={infoOpen} onClick={() => setInfoOpen(!infoOpen)}><BookOpen size={14} /> DADOS</button>
        <button className="teacher-exit" onClick={toggleTeacherMode}>ENCERRAR <X size={14} /></button>
      </section>}

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
            <button role="menuitem" onClick={() => { setMoreToolsOpen(false); toggleCamera() }}><Camera size={16} /> Câmera</button>
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

      {cosmosOpen && selectedCosmosObject && <section className="cosmos-panel" aria-label="Catálogo de nebulosas e objetos do espaço">
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
      </section>}

      {deepSpaceMode && <section className="deep-space-bar"><div><Telescope size={16} /><strong>{nebulaFocus ? `APROXIMAÇÃO · ${nebulaFocus.toUpperCase()}` : 'UNIVERSO PROFUNDO'}</strong><small>POSIÇÕES ESQUEMÁTICAS · DISTÂNCIAS EM ANOS-LUZ</small></div><button onClick={() => setNebulaFocus(null)} disabled={!nebulaFocus}><ZoomIn size={14} /> VISÃO GERAL</button><button onClick={() => setCosmosOpen(true)}><SparklesIcon size={14} /> DETALHES</button><button className="deep-space-exit" onClick={() => { setDeepSpaceMode(false); setNebulaFocus(null); setCosmosOpen(false); setInfoOpen(true) }}><ArrowLeft size={14} /> SISTEMA SOLAR</button></section>}

      {infoOpen && <section className="info-panel">
        <div className="panel-header">
          <div><span className="eyebrow">{selectedMoon ? `LUA DE ${selectedMoon.planet.name.toUpperCase()}` : 'OBJETO SELECIONADO'}</span><h2>{selectedMoon?.moon.name ?? selected.name}</h2></div>
          <div className="planet-panel-actions">
            <span className="planet-index">{selectedMoon ? 'LUA' : `0${planets.indexOf(selected) + 1} / 0${planets.length}`}</span>
            {!selectedMoon && <><button className="planet-nav" aria-label="Planeta anterior" onClick={() => changeSelectedPlanet(-1)}><ChevronLeft size={16} /></button><button className="planet-nav" aria-label="Próximo planeta" onClick={() => changeSelectedPlanet(1)}><ChevronRight size={16} /></button></>}
            <button className="close-small" aria-label="Fechar painel de dados" onClick={() => { setInfoOpen(false); setSelectedMoon(null); setCloseUp(null); setFollowName(null) }}><X size={16} /></button>
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
      </section>}

      {compareOpen && <section className="compare-panel" aria-label="Comparar dois objetos">
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
      </section>}

      {/* Barra da vista próxima: voltar, atmosfera e luas visíveis */}
      {closeUp && closeUpPlanet && (
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
      )}

      {simulationOpen && <section className="bottom-controls">
        <div className="control-group">
          <span className="eyebrow">SIMULAÇÃO TEMPORAL</span>

          <div className="time-row">
            <button
              className="play-button"
              aria-label={playing ? 'Pausar simulação' : 'Reproduzir simulação'}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <div>
              <strong>TEMPO SIMULADO</strong>
              <small>
                {playing
                  ? 'CONTAGEM EM ANDAMENTO'
                  : 'CONTAGEM PAUSADA'}
              </small>
            </div>

            <button
              className="reset-button"
              aria-label="Reiniciar posição simulada"
              onClick={() => {
                clock.current.t = SIM_T0
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="speed-control">
          <span>VELOCIDADE DA SIMULAÇÃO</span>
          <strong>×{speed.toLocaleString('pt-BR')}</strong>

          <input
            aria-label="Velocidade da simulação"
            type="range"
            min="1"
            max="1000000"
            step="1"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
          <div className="speed-presets" aria-label="Presets de velocidade">
            {[{ label: 'NORMAL', value: 1000 }, { label: 'RÁPIDA', value: 10000 }, { label: 'MÁXIMA', value: 1000000 }].map((preset) => (
              <button key={preset.label} className={speed === preset.value ? 'selected' : ''} aria-pressed={speed === preset.value} onClick={() => setSpeed(preset.value)}>{preset.label}</button>
            ))}
          </div>
        </div>

      </section>}

      {layers && (
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
      )}

      {hand && (
        <section className="hand-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">RECURSO EXPERIMENTAL</span>
              <h2>Controle por gestos</h2>
            </div>

            <button
              className="close-small"
              aria-label="Fechar painel"
              onClick={() => setHand(false)}
            >
              <X size={15} />
            </button>
          </div>

          <div className="hand-preview">
            <Hand size={34} />

            <div>
              <strong>
                {cameraActive
                  ? 'CÂMERA PERMITIDA'
                  : 'CÂMERA DESLIGADA'}
              </strong>
              <small>
                {cameraActive
                  ? 'Acesso local concedido. Nenhum gesto é interpretado nesta versão.'
                  : 'O rastreamento de gestos não está disponível nesta versão.'}
              </small>
            </div>
          </div>

          <button className="travel-button" onClick={toggleCamera}>
            <Camera size={15} />
            {cameraActive
              ? 'ENCERRAR ACESSO À CÂMERA'
              : 'SOLICITAR ACESSO À CÂMERA'}
          </button>
        </section>
      )}

      {guidedOpen && (
        <section className="guide-panel">
          <div className="panel-header">
            <div><span className="eyebrow">FERRAMENTAS DE AULA</span><h2>{guideTab === 'lesson' ? 'Roteiro guiado' : 'Experimento orbital'}</h2></div>
            <button className="close-small" aria-label="Fechar guia" onClick={() => setGuidedOpen(false)}><X size={15} /></button>
          </div>
          <div className="classroom-tabs" role="tablist" aria-label="Ferramentas de aula">
            <button role="tab" aria-selected={guideTab === 'lesson'} className={guideTab === 'lesson' ? 'selected' : ''} onClick={() => setGuideTab('lesson')}><BookOpen size={14} /> AULA</button>
            <button role="tab" aria-selected={guideTab === 'experiment'} className={guideTab === 'experiment' ? 'selected' : ''} onClick={() => setGuideTab('experiment')}><Atom size={14} /> EXPERIMENTO</button>
          </div>

          {guideTab === 'lesson' ? <div className="lesson-content">
            <label className="lesson-picker">ROTEIRO<select value={lessonIndex} onChange={(event) => chooseLesson(Number(event.target.value))}>{lessons.map((item, index) => <option key={item.title} value={index}>{index + 1}. {item.title}</option>)}</select></label>
            <div className="lesson-objective"><span className="guide-kicker">OBJETIVO</span><p>{lesson.objective}</p></div>
            <div className="lesson-step-count">ETAPA {lessonStep + 1} DE {lesson.steps.length}</div>
            <p className="lesson-step-text">{lesson.steps[lessonStep]}</p>
            <div className="lesson-step-actions">
              <button disabled={lessonStep === 0} onClick={() => setLessonStep((step) => Math.max(0, step - 1))}><ChevronLeft size={13} /> ANTERIOR</button>
              <button disabled={lessonStep === lesson.steps.length - 1} onClick={() => setLessonStep((step) => Math.min(lesson.steps.length - 1, step + 1))}>PRÓXIMA <ChevronRight size={13} /></button>
            </div>
            <div className="prediction-block">
              <span className="guide-kicker">FAÇA SUA PREVISÃO</span>
              <strong>{lesson.question}</strong>
              <div className="prediction-choices">{lesson.choices.map((choice, index) => <button key={choice} className={`${lessonChoice === index ? 'chosen' : ''} ${lessonRevealed && index === lesson.correct ? 'correct' : ''} ${lessonRevealed && lessonChoice === index && index !== lesson.correct ? 'incorrect' : ''}`} aria-pressed={lessonChoice === index} disabled={lessonRevealed} onClick={() => setLessonChoice(index)}>{choice}</button>)}</div>
              {!lessonRevealed ? <button className="reveal-answer" disabled={lessonChoice === null} onClick={() => { setLessonRevealed(true); setPlaying(false) }}>CONFERIR PREVISÃO <Check size={14} /></button> : <div className={`answer-feedback ${lessonChoice === lesson.correct ? 'correct' : 'incorrect'}`}><strong>{lessonChoice === lesson.correct ? 'PREVISÃO CORRETA' : 'COMPARE COM O RESULTADO'}</strong><p>{lesson.explanation}</p></div>}
            </div>
            <button className="travel-button lesson-travel" onClick={() => { setSelected(lessonPlanet); setSelectedMoon(null); setInfoOpen(true); setCloseUp(null); setFollowName(lessonPlanet.name) }}><Crosshair size={14} /> ENQUADRAR {lesson.target.toUpperCase()} <ChevronRight size={14} /></button>
            <a className="fact-source" href="https://science.nasa.gov/solar-system/orbits-and-keplers-laws/" target="_blank" rel="noreferrer">Base conceitual: leis de Kepler · NASA</a>
          </div> : <div className="experiment-content">
            <p className="experiment-intro">Altere os parâmetros e observe o período, a velocidade circular e a evolução de uma componente do movimento.</p>
            <label className="experiment-slider"><span>MASSA CENTRAL <strong>{experimentMass.toFixed(1)} M☉</strong></span><input aria-label="Massa da estrela em massas solares" type="range" min="0.2" max="3" step="0.1" value={experimentMass} onChange={(event) => setExperimentMass(Number(event.target.value))} /></label>
            <label className="experiment-slider"><span>SEMIEIXO MAIOR <strong>{experimentDistance.toFixed(1)} AU</strong></span><input aria-label="Semieixo maior em unidades astronômicas" type="range" min="0.3" max="5" step="0.1" value={experimentDistance} onChange={(event) => setExperimentDistance(Number(event.target.value))} /></label>
            <div className="experiment-equation"><span>3ª LEI DE KEPLER · UNIDADES SOLARES</span><strong>T² = a³ / M</strong><small>T em anos · a em AU · M em massas solares</small></div>
            <KeplerExperiment semimajorAxis={experimentDistance} centralMass={experimentMass} playing={experimentPlaying} />
            <button className="experiment-play" onClick={() => setExperimentPlaying(!experimentPlaying)}>{experimentPlaying ? <Pause size={14} /> : <Play size={14} />}{experimentPlaying ? 'PAUSAR EXPERIMENTO' : 'RODAR EXPERIMENTO'}</button>
            <p className="experiment-source-note">Este laboratório é um modelo matemático simplificado e independente da animação 3D do Sistema Solar.</p>
          </div>}
        </section>
      )}

      <div className="hint"><MousePointer2 size={13} /> Arraste para orbitar · scroll/pinça para aproximar · clique seleciona e aproxima · Esc volta</div>
    </main>
  )
}
