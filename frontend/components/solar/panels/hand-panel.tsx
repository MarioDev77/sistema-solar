'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Hand, X, Camera } from 'lucide-react'

export function HandPanel({ cameraActive, toggleCamera, setHand }: { cameraActive: boolean; toggleCamera: () => Promise<void>; setHand: Dispatch<SetStateAction<boolean>> }) {
  return (
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
  )
}
