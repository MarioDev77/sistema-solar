'use client'

import { useEffect, useRef } from 'react'
import { Hand, X, Camera, RefreshCw, Power } from 'lucide-react'
import type { HandSettings, TrackingStatus } from '../hand/types'

type Props = {
  status: TrackingStatus
  settings: HandSettings
  onToggle: () => void
  onRecalibrate: () => void
  onDisengage: () => void
  movedPlanets?: number
  onRestoreOrbits?: () => void
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

export function HandPanel({ status, settings, onToggle, onRecalibrate, onDisengage, movedPlanets = 0, onRestoreOrbits, onSelectDevice, onSettings, onClose }: Props) {
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

      {status.holoActive && (
        <button className="travel-button secondary" onClick={onDisengage}>
          <Power size={15} />
          ENCERRAR CONTROLE HOLOGRÁFICO
        </button>
      )}

      {movedPlanets > 0 && onRestoreOrbits && (
        <button className="travel-button secondary" onClick={onRestoreOrbits}>
          <RefreshCw size={15} />
          RESTAURAR ÓRBITA ({movedPlanets})
        </button>
      )}

      <details className="hand-help">
        <summary>COMO USAR OS GESTOS</summary>
        <ol>
          <li><b>Ativar:</b> forme o losango com as duas mãos (pontas dos polegares juntas e dos indicadores juntas) por meio segundo.</li>
          <li><b>Girar e inclinar:</b> mantenha o losango e mova as mãos juntas.</li>
          <li><b>Zoom:</b> duas mãos abertas; afastar aproxima, aproximar afasta.</li>
          <li><b>Girar a cena:</b> círculo com as duas mãos; quanto mais rápido, mais rápida a rotação.</li>
          <li><b>Pausar/retomar:</b> uma palma aberta e parada por 1 segundo.</li>
          <li><b>Ver dados:</b> aponte com o indicador para um planeta (com o modo holográfico ativo).</li>
          <li><b>Selecionar e mover:</b> mirando o planeta, junte polegar e indicador (pinça) e mova a mão; abra a pinça para soltar.</li>
          <li><b>Girar o planeta:</b> segure a pinça e faça círculos com a mão; o sentido e a velocidade do círculo viram o giro (acelere ou desacelere o gesto).</li>
          <li><b>Puxar:</b> mão aberta estendida, depois recolha para o corpo: aproxima o planeta mirado (ou o selecionado) para análise.</li>
          <li><b>Empurrar:</b> mão aberta avança rápido para a câmera: sai da vista próxima ou afasta a câmera.</li>
          <li><b>Voltar à órbita:</b> botão RESTAURAR ÓRBITA.</li>
        </ol>
      </details>

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
