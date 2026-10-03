import { dist2D, handAngle, handSize, palmCenter } from './hand-geometry'
import type { HandCalibrationResult, HandFrame } from './types'

const DURATION_MS = 2000
const MIN_SAMPLES = 12
const BASE_MOTION_LIMIT = 0.9 // "tamanhos de mão" por segundo, multiplicado pela tolerância

type HandSample = { slot: number; x: number; y: number; size: number; angle: number }
type Sample = { t: number; hands: HandSample[] }

export type CalibrationUpdate = {
  progress: number
  hint: string
  result: HandCalibrationResult | null
}

/**
 * Calibração inicial: mede ~2 s com as mãos paradas. Se as mãos se mexem demais ou o número de
 * mãos muda, a janela reinicia. O resultado alimenta os próximos estágios (zona morta contra
 * tremor involuntário, escala de gestos pelo tamanho da mão, posição neutra).
 */
export class HandCalibration {
  private samples: Sample[] = []
  private startedAt = 0
  private signature = ''
  private motion = 0
  private prev: Sample | null = null

  reset() {
    this.samples = []; this.startedAt = 0; this.signature = ''; this.motion = 0; this.prev = null
  }

  private restart(now: number, signature: string) {
    this.samples = []; this.startedAt = now; this.signature = signature; this.motion = 0; this.prev = null
  }

  update(frame: HandFrame, tolerance: number): CalibrationUpdate {
    const now = frame.time
    const aspect = frame.aspect
    const hands: HandSample[] = frame.hands.map((h) => ({
      slot: h.slot, ...palmCenter(h.landmarks), size: handSize(h.landmarks, aspect), angle: handAngle(h.landmarks, aspect),
    }))
    const signature = hands.map((h) => h.slot).join(',')
    if (this.samples.length === 0 || signature !== this.signature) this.restart(now, signature)

    let hint = ''
    if (this.prev && this.prev.hands.length === hands.length) {
      const dt = Math.max((now - this.prev.t) / 1000, 1 / 60)
      let worst = 0
      hands.forEach((h, i) => {
        const p = this.prev!.hands[i]
        const speed = Math.hypot((h.x - p.x) * aspect, h.y - p.y) / Math.max(h.size, 0.01) / dt
        worst = Math.max(worst, speed)
      })
      this.motion = this.motion * 0.7 + worst * 0.3
    }
    const limit = BASE_MOTION_LIMIT * tolerance
    if (this.motion > limit) {
      this.restart(now, signature)
      hint = 'Mãos em movimento: segure-as paradas por um instante.'
    } else if (this.motion > limit * 0.6) {
      hint = 'Mantenha as mãos mais paradas.'
    }

    const sample: Sample = { t: now, hands }
    this.samples.push(sample)
    this.prev = sample

    const progress = Math.min(1, (now - this.startedAt) / DURATION_MS)
    if (progress >= 1 && this.samples.length >= MIN_SAMPLES) {
      return { progress: 1, hint: '', result: this.compute(aspect) }
    }
    return { progress, hint, result: null }
  }

  private compute(aspect: number): HandCalibrationResult {
    const samples = this.samples
    const count = samples[0].hands.length
    let sizeSum = 0, sizeN = 0
    const means = Array.from({ length: count }, () => ({ x: 0, y: 0 }))
    let sinSum = 0, cosSum = 0
    for (const s of samples) {
      s.hands.forEach((h, i) => {
        sizeSum += h.size; sizeN++
        means[i].x += h.x; means[i].y += h.y
        sinSum += Math.sin(h.angle); cosSum += Math.cos(h.angle)
      })
    }
    means.forEach((m) => { m.x /= samples.length; m.y /= samples.length })
    const handSizeMean = sizeSum / sizeN

    let sq = 0, sqN = 0, distSum = 0
    for (const s of samples) {
      s.hands.forEach((h, i) => {
        const dx = (h.x - means[i].x) * aspect, dy = h.y - means[i].y
        sq += dx * dx + dy * dy; sqN++
      })
      if (count === 2) distSum += dist2D(s.hands[0], s.hands[1], aspect)
    }
    const jitter = Math.sqrt(sq / Math.max(1, sqN)) // RMS do deslocamento, em alturas de quadro
    const neutral = {
      x: means.reduce((a, m) => a + m.x, 0) / count,
      y: means.reduce((a, m) => a + m.y, 0) / count,
    }
    return {
      hands: count,
      handSize: handSizeMean,
      handDistance: count === 2 ? distSum / samples.length : null,
      neutral,
      orientation: Math.atan2(sinSum / sizeN, cosSum / sizeN),
      stability: Math.min(1, Math.max(0, 1 - jitter / Math.max(handSizeMean, 0.01) / 0.12)),
      deadzone: Math.max(0.006, jitter * 3),
      calibratedAt: Date.now(),
    }
  }
}
