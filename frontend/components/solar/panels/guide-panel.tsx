'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Play, Pause, Crosshair, ChevronLeft, ChevronRight, X, BookOpen, Atom, Check } from 'lucide-react'
import { LessonPlan, lessons, MoonSelection, PlanetData } from '../data'
import { KeplerExperiment } from '../kepler-experiment'

export function GuidePanel({ selected, playing, guideTab, lessonIndex, lessonStep, lessonChoice, lessonRevealed, experimentDistance, experimentMass, experimentPlaying, lesson, lessonPlanet, chooseLesson, setSelected, setSelectedMoon, setInfoOpen, setPlaying, setGuidedOpen, setGuideTab, setLessonStep, setLessonChoice, setLessonRevealed, setExperimentDistance, setExperimentMass, setExperimentPlaying, setFollowName, setCloseUp }: { selected: PlanetData; playing: boolean; guideTab: 'lesson' | 'experiment'; lessonIndex: number; lessonStep: number; lessonChoice: number | null; lessonRevealed: boolean; experimentDistance: number; experimentMass: number; experimentPlaying: boolean; lesson: LessonPlan; lessonPlanet: PlanetData; chooseLesson: (index: number) => void; setSelected: Dispatch<SetStateAction<PlanetData>>; setSelectedMoon: Dispatch<SetStateAction<MoonSelection | null>>; setInfoOpen: Dispatch<SetStateAction<boolean>>; setPlaying: Dispatch<SetStateAction<boolean>>; setGuidedOpen: Dispatch<SetStateAction<boolean>>; setGuideTab: Dispatch<SetStateAction<'lesson' | 'experiment'>>; setLessonStep: Dispatch<SetStateAction<number>>; setLessonChoice: Dispatch<SetStateAction<number | null>>; setLessonRevealed: Dispatch<SetStateAction<boolean>>; setExperimentDistance: Dispatch<SetStateAction<number>>; setExperimentMass: Dispatch<SetStateAction<number>>; setExperimentPlaying: Dispatch<SetStateAction<boolean>>; setFollowName: Dispatch<SetStateAction<string | null>>; setCloseUp: Dispatch<SetStateAction<string | null>> }) {
  return (
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
  )
}
