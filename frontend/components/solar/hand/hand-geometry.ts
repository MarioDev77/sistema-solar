import { LM, type Landmark } from './types'

const PALM_IDS = [LM.WRIST, LM.INDEX_MCP, LM.MIDDLE_MCP, LM.RING_MCP, LM.PINKY_MCP]

/** Centro da palma (média do pulso e das bases dos quatro dedos). */
export function palmCenter(lm: Landmark[]) {
  let x = 0, y = 0
  for (const i of PALM_IDS) { x += lm[i].x; y += lm[i].y }
  return { x: x / PALM_IDS.length, y: y / PALM_IDS.length }
}

/** Distância 2D em "alturas de quadro" (corrige a proporção do vídeo). */
export function dist2D(a: { x: number; y: number }, b: { x: number; y: number }, aspect: number) {
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y)
}

/** Tamanho da mão: pulso → base do dedo médio. Serve de régua para qualquer distância da câmera. */
export function handSize(lm: Landmark[], aspect: number) {
  return dist2D(lm[LM.WRIST], lm[LM.MIDDLE_MCP], aspect)
}

/** Ângulo do vetor pulso → base do dedo médio (radianos). */
export function handAngle(lm: Landmark[], aspect: number) {
  return Math.atan2(lm[LM.MIDDLE_MCP].y - lm[LM.WRIST].y, (lm[LM.MIDDLE_MCP].x - lm[LM.WRIST].x) * aspect)
}
