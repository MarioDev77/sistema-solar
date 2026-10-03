'use client'

import { useEffect, useState } from 'react'
import type { TrackingStatus } from './types'

type Tone = 'ok' | 'warn' | 'err' | 'off'

function Row({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{tone && <i className={`hand-dot ${tone}`} />}{value}</strong>
    </div>
  )
}

/** HUD de status (câmera, rastreamento, mãos, gesto, objeto, simulação) + avisos de calibração. */
export function HandHud({ status, selectedName, playing }: { status: TrackingStatus; selectedName: string; playing: boolean }) {
  const [showDone, setShowDone] = useState(false)
  const [errorVisible, setErrorVisible] = useState(false)
  const error = status.cameraError ?? status.modelError

  useEffect(() => {
    if (!status.calibratedAt) { setShowDone(false); return }
    setShowDone(true)
    const id = window.setTimeout(() => setShowDone(false), 2600)
    return () => window.clearTimeout(id)
  }, [status.calibratedAt])

  useEffect(() => {
    if (!error) { setErrorVisible(false); return }
    setErrorVisible(true)
    const id = window.setTimeout(() => setErrorVisible(false), 9000)
    return () => window.clearTimeout(id)
  }, [error])

  const cameraTone: Tone = status.camera === 'connected' ? 'ok' : status.camera === 'requesting' ? 'warn' : status.camera === 'error' ? 'err' : 'off'
  const cameraLabel = { off: 'OFF', requesting: 'REQUESTING', connected: 'CONNECTED', error: 'ERROR' }[status.camera]
  const trackingLabel = !status.enabled ? 'OFF' : status.phase === 'loading' ? 'LOADING' : status.phase === 'ready' ? 'ACTIVE' : 'CALIBRATING'
  const trackingTone: Tone = !status.enabled ? 'off' : status.phase === 'ready' ? 'ok' : 'warn'
  const handsLabel = status.hands === 0 ? 'NONE' : `${status.hands} DETECTED`

  const calibrating = status.enabled && (status.phase === 'waiting' || status.phase === 'calibrating')

  return (
    <>
      {status.enabled && (
        <section className="hand-hud" aria-label="Status do rastreamento de mãos">
          <Row label="CAMERA" value={cameraLabel} tone={cameraTone} />
          <Row label="HAND TRACKING" value={trackingLabel} tone={trackingTone} />
          <Row label="HANDS" value={handsLabel} tone={status.hands > 0 ? 'ok' : 'off'} />
          <Row label="GESTURE" value={status.gesture} />
          <Row label="SELECTED OBJECT" value={selectedName.toUpperCase()} />
          <Row label="SIMULATION" value={playing ? 'RUNNING' : 'PAUSED'} tone={playing ? 'ok' : 'warn'} />
        </section>
      )}

      {status.enabled && status.phase === 'loading' && (
        <div className="hand-banner" role="status">
          <strong>INICIANDO RASTREAMENTO...</strong>
          <span>Conectando a câmera e carregando o modelo.</span>
        </div>
      )}

      {calibrating && (
        <div className="hand-banner" role="status">
          <strong>CALIBRANDO HAND TRACKING...</strong>
          <span>Mantenha as mãos visíveis e paradas por 2 segundos.</span>
          <em>{status.phase === 'waiting' ? 'Mostre as mãos para a câmera.' : status.calibrationHint || '\u00a0'}</em>
          <div className="hand-progress"><i style={{ width: `${Math.round(status.calibrationProgress * 100)}%` }} /></div>
        </div>
      )}

      {status.enabled && status.phase === 'ready' && showDone && (
        <div className="hand-banner done" role="status">
          <strong>CALIBRAÇÃO CONCLUÍDA</strong>
          {status.stability !== null && <span>Estabilidade do rastreamento: {Math.round(status.stability * 100)}%</span>}
        </div>
      )}

      {!status.enabled && error && errorVisible && (
        <div className="hand-banner error" role="alert">
          <strong>CONTROLE POR MÃOS INDISPONÍVEL</strong>
          <span>{error}</span>
        </div>
      )}
    </>
  )
}
