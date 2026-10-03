/**
 * Tipos do reconhecimento de gestos (etapa 2a).
 * Unidade de distância/deslocamento: "alturas de quadro" (x já multiplicado pela proporção do vídeo),
 * a mesma convenção de types.ts. Posições (Vec2) continuam em 0..1 da TELA, já espelhadas.
 */
export type Vec2 = { x: number; y: number }

export type GestureId = 'none' | 'portal' | 'spin' | 'zoom' | 'pinch' | 'push' | 'pull' | 'point' | 'palm'

/** idle → arming (gesto presente, ainda confirmando) → active (confirmado). */
export type GateState = 'idle' | 'arming' | 'active'

export type GestureEvent =
  | { type: 'engage' }
  | { type: 'disengage'; reason: 'timeout' | 'manual' }
  | { type: 'portal-start' }
  | { type: 'portal-end' }
  | { type: 'zoom-start' }
  | { type: 'zoom-end' }
  | { type: 'spin-start' }
  | { type: 'spin-end' }
  | { type: 'pinch-start'; slot: 0 | 1; point: Vec2 }
  | { type: 'pinch-end'; slot: 0 | 1 }
  | { type: 'point-start'; slot: 0 | 1 }
  | { type: 'point-end'; slot: 0 | 1 }
  | { type: 'push'; slot: 0 | 1 }
  | { type: 'pull'; slot: 0 | 1 }
  | { type: 'palm-toggle'; slot: 0 | 1 }

export type HandGestureInfo = {
  slot: 0 | 1
  /** tamanho da mão (pulso → base do dedo médio) */
  size: number
  center: Vec2
  /** polegar, indicador, médio, anelar, mínimo */
  extended: [boolean, boolean, boolean, boolean, boolean]
  /** ponta do indicador: é o cursor holográfico */
  pointer: Vec2
  point: { state: GateState }
  pinch: {
    state: GateState
    /** distância polegar–indicador em tamanhos de mão (≈0.1 fechada, ≈1 aberta) */
    distance: number
    /** ponto médio entre as pontas, onde a pinça "segura" */
    point: Vec2
    /** onde o indicador estava ~300 ms ANTES de fechar: é o alvo que o usuário tinha em mira */
    start: Vec2 | null
  }
}

export type PortalInfo = {
  state: GateState
  progress: number
  confidence: number
  /** centro dos 4 pontos (2 polegares + 2 indicadores), suavizado */
  mid: Vec2 | null
  /** raio do portal em alturas de quadro */
  radius: number
  /** deslocamento desde o frame anterior (com zona morta da calibração) */
  delta: Vec2
  /** deslocamento desde o instante da ativação (estilo joystick, com zona morta) */
  offset: Vec2
  points: { thumbs: [Vec2, Vec2]; indices: [Vec2, Vec2] } | null
}

export type ZoomInfo = {
  state: GateState
  /** distância atual entre as mãos ÷ distância na ativação (>1: mãos se afastaram) */
  ratio: number
  /** ln(d_atual / d_anterior) por frame; >0 = ZOOM IN, <0 = ZOOM OUT */
  delta: number
}

export type SpinInfo = {
  state: GateState
  /** rad/s, positivo = sentido horário na tela */
  velocity: number
}

export type GestureFrame = {
  time: number
  aspect: number
  /** modo de manipulação holográfica: liga com o portal confirmado, desliga por timeout/manual */
  engaged: boolean
  primary: GestureId
  /** texto do HUD ("PORTAL MODE", "PINCH…" enquanto confirma, "—" sem gesto) */
  label: string
  hands: HandGestureInfo[]
  portal: PortalInfo
  zoom: ZoomInfo
  spin: SpinInfo
  palm: { state: GateState; progress: number; slot: 0 | 1 | null }
  events: GestureEvent[]
}
