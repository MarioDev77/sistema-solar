'use client'

import { useEffect, useRef } from 'react'
import { Hand, X, Camera, RefreshCw, Power } from 'lucide-react'
import type { HandSettings, TrackingStatus } from '../hand/types'

type Props = {
  status: TrackingStatus
  settings: HandSettings
  onToggle: () => void
  onRecalibrate: () => void
  onSelectDevice: (id: string) => void
  onSettings: (partial: Partial<HandSettings>) => void
  onClose: () => void
}

const PHASE_TEXT: Record<TrackingStatus['phase'], string> = {
  off: 'CONTROLE POR MÃOS DESLIGADO',
  loading: 'INICIANDO...',
  waiting: 'AGUARDANDO MÃOS',
  calibrating: 'CALIBRANDO...',
  ready: 'RASTREAMENTO ATIVO',
}

export function HandPanel({ status, settings, onToggle, onRecalibrate, onSelectDevice, onSettings, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = status.stream
    if (status.stream) void video.play().catch(() => {})
  }, [status.stream])

  const error = status.cameraError ?? status.modelError
  const canRecalibrate = status.enabled && status.phase !== 'loading'

  return (
    <section className="hand-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">CONTROLE POR MÃOS</span>
          <h2>Hand tracking</h2>
        </div>
        <button className="close-small" aria-label="Fechar painel" onClick={onClose}>
          <X size={15} />
        </button>
      </div>

      <div className="hand-preview">
        {status.stream
          ? <video ref={videoRef} className="hand-video" muted playsInline style={settings.mirror ? { transform: 'scaleX(-1)' } : undefined} />
          : <Hand size={34} />}
        <div>
          <strong>{PHASE_TEXT[status.phase]}</strong>
          <small>
            {error
              ?? (status.enabled
                ? `${status.hands} ${status.hands === 1 ? 'mão detectada' : 'mãos detectadas'} · ${status.fps} fps`
                : 'Use a webcam para manipular o sistema solar com as mãos. Mouse e teclado continuam funcionando.')}
          </small>
        </div>
      </div>

      <button className="travel-button" aria-pressed={status.enabled} onClick={onToggle}>
        <Power size={15} />
        {status.enabled ? 'CONTROLE POR MÃOS: ON' : 'CONTROLE POR MÃOS: OFF'}
      </button>

      <button className="travel-button secondary" disabled={!canRecalibrate} onClick={onRecalibrate}>
        <RefreshCw size={15} />
        RECALIBRAR
      </button>

      {status.devices.length > 1 && (
        <label className="hand-field">
          <span><Camera size={12} /> CÂMERA</span>
          <select value={status.deviceId ?? ''} onChange={(e) => onSelectDevice(e.target.value)}>
            {status.devices.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
      )}

      <label className="hand-switch">
        <input type="checkbox" checked={settings.mirror} onChange={(e) => onSettings({ mirror: e.target.checked })} />
        <span>Espelhar câmera</span>
      </label>
      <label className="hand-switch">
        <input type="checkbox" checked={settings.showLandmarks} onChange={(e) => onSettings({ showLandmarks: e.target.checked })} />
        <span>Mostrar rastreamento</span>
      </label>
      <label className="hand-switch">
        <input type="checkbox" checked={settings.lowLight} onChange={(e) => onSettings({ lowLight: e.target.checked })} />
        <span>Ambiente com pouca luz</span>
      </label>

      <label className="hand-field">
        <span>TOLERÂNCIA · DISTÂNCIA DA CÂMERA</span>
        <input type="range" min={0.5} max={2} step={0.1} value={settings.tolerance} onChange={(e) => onSettings({ tolerance: Number(e.target.value) })} />
        <div className="hand-range-labels"><small>Perto / estável</small><small>Longe / trêmulo</small></div>
      </label>
    </section>
  )
}
