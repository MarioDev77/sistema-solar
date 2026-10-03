/**
 * Tipos compartilhados do hand tracking.
 * Convenção de coordenadas: x e y em 0..1 da TELA (já espelhados quando "espelhar câmera" está ligado).
 * Distâncias "em alturas de quadro": x é multiplicado pela proporção (largura/altura) do vídeo,
 * para que um círculo na vida real continue sendo um círculo nas contas.
 */
export type Landmark = { x: number; y: number; z: number }

export type TrackedHand = {
  /** 0 = mão mais à esquerda da tela, 1 = mais à direita. Estável entre frames. */
  slot: 0 | 1
  /** 21 landmarks do MediaPipe, espelhados (se ativado) e suavizados. */
  landmarks: Landmark[]
  score: number
}

export type HandFrame = {
  time: number
  /** largura / altura do vídeo da câmera */
  aspect: number
  hands: TrackedHand[]
}

export type CameraState = 'off' | 'requesting' | 'connected' | 'error'
export type ModelState = 'idle' | 'loading' | 'ready' | 'error'
export type TrackingPhase = 'off' | 'loading' | 'waiting' | 'calibrating' | 'ready'
export type CameraDevice = { id: string; label: string }

export type HandCalibrationResult = {
  hands: number
  /** tamanho médio da mão (pulso → base do dedo médio), em alturas de quadro */
  handSize: number
  /** distância média entre as duas mãos, em alturas de quadro (null com uma mão só) */
  handDistance: number | null
  /** posição neutra (média das mãos), 0..1 da tela */
  neutral: { x: number; y: number }
  /** orientação média pulso → dedo médio, em radianos */
  orientation: number
  /** 0..1: quão parado o rastreamento ficou durante a calibração */
  stability: number
  /** movimento (em alturas de quadro) abaixo do qual o sistema trata como tremor involuntário */
  deadzone: number
  calibratedAt: number
}

export type HandSettings = {
  mirror: boolean
  showLandmarks: boolean
  /** 0.5 (mãos perto / ambiente estável) … 2 (mãos longe / mais tremor). Escala limiares e suavização. */
  tolerance: number
  /** reduz as confianças mínimas do MediaPipe para ambientes escuros */
  lowLight: boolean
}

export type TrackingStatus = {
  enabled: boolean
  camera: CameraState
  cameraError: string | null
  model: ModelState
  modelError: string | null
  phase: TrackingPhase
  hands: number
  gesture: string
  fps: number
  devices: CameraDevice[]
  deviceId: string | null
  stream: MediaStream | null
  calibrationProgress: number
  calibrationHint: string
  calibratedAt: number | null
  stability: number | null
  /** modo de manipulação holográfica ligado (portal confirmado) */
  holoActive: boolean
  /** aviso transitório para o HUD (ex.: "CONTROLE HOLOGRÁFICO ATIVADO"); o id muda a cada aviso novo */
  notice: { id: number; text: string } | null
}

/** Índices dos landmarks do MediaPipe Hands. */
export const LM = {
  WRIST: 0, THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const

export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export const FINGERTIPS: ReadonlySet<number> = new Set([4, 8, 12, 16, 20])
