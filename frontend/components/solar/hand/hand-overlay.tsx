'use client'

import { useEffect, useRef } from 'react'
import type { HandTrackingController } from './hand-tracking-controller'
import { FINGERTIPS, HAND_CONNECTIONS, type HandFrame } from './types'

const COLORS = ['131, 212, 202', '150, 185, 255'] // uma cor discreta por mão

/**
 * Camada 2D transparente com os landmarks. Desenha direto no canvas a cada frame do rastreamento
 * (sem passar pelo estado do React) e nunca captura cliques.
 */
export function HandOverlay({ controller, show }: { controller: HandTrackingController | null; show: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !controller) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (frame: HandFrame) => {
      ctx.clearRect(0, 0, w, h)
      if (!show) return
      for (const hand of frame.hands) {
        const rgb = COLORS[hand.slot]
        const pts = hand.landmarks
        ctx.lineWidth = 1.2
        ctx.strokeStyle = `rgba(${rgb}, 0.5)`
        ctx.beginPath()
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.moveTo(pts[a].x * w, pts[a].y * h)
          ctx.lineTo(pts[b].x * w, pts[b].y * h)
        }
        ctx.stroke()
        ctx.fillStyle = `rgba(${rgb}, 0.9)`
        pts.forEach((p, i) => {
          ctx.beginPath()
          ctx.arc(p.x * w, p.y * h, FINGERTIPS.has(i) ? 3.2 : 2, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    }
    const off = controller.subscribeFrames(draw)
    return () => { off(); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h) }
  }, [controller, show])

  return <canvas ref={canvasRef} className="hand-overlay" aria-hidden="true" />
}
