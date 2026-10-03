'use client'

import { useEffect, useRef } from 'react'
import type { GestureFrame } from './gesture-types'
import type { HandTrackingController } from './hand-tracking-controller'
import type { PlanetInteraction } from './planet-interaction'
import { FINGERTIPS, HAND_CONNECTIONS, LM, type HandFrame } from './types'

const COLORS = ['131, 212, 202', '150, 185, 255'] // uma cor discreta por mão
const ACCENT = '131, 212, 202'

/**
 * Camada 2D transparente com os landmarks e os elementos holográficos dos gestos
 * (portal, cursor, zoom, giro). Desenha direto no canvas a cada frame do rastreamento
 * (sem passar pelo estado do React) e nunca captura cliques.
 * Ordem por frame: o controller emite primeiro o HandFrame (limpa + landmarks) e depois o GestureFrame (por cima).
 */
export function HandOverlay({ controller, show, interaction = null }: { controller: HandTrackingController | null; show: boolean; interaction?: PlanetInteraction | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !controller) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0
    let lastHands: HandFrame['hands'] = []
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const drawLandmarks = (frame: HandFrame) => {
      lastHands = frame.hands
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

    const px = (p: { x: number; y: number }) => [p.x * w, p.y * h] as const
    const line = (a: { x: number; y: number }, b: { x: number; y: number }) => { const [ax, ay] = px(a), [bx, by] = px(b); ctx.moveTo(ax, ay); ctx.lineTo(bx, by) }
    const mono = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace'

    const drawPortal = (g: GestureFrame) => {
      const p = g.portal
      if (p.state === 'idle' || !p.points || !p.mid) return
      const active = p.state === 'active'
      const a = active ? 1 : 0.25 + 0.5 * p.progress
      const [mx, my] = px(p.mid)
      const pts = [...p.points.thumbs, ...p.points.indices]
      const r = Math.max(...pts.map((q) => Math.hypot(q.x * w - mx, q.y * h - my))) * 1.5 + 14
      const t = g.time / 1000

      // estrutura entre as mãos: polegar–polegar, indicador–indicador e o losango de cada mão
      ctx.lineWidth = 1.2
      ctx.strokeStyle = `rgba(${ACCENT}, ${0.55 * a})`
      ctx.beginPath()
      line(p.points.thumbs[0], p.points.thumbs[1]); line(p.points.indices[0], p.points.indices[1])
      for (const hand of lastHands) {
        line(hand.landmarks[LM.THUMB_TIP], hand.landmarks[LM.INDEX_TIP])
        line(hand.landmarks[LM.THUMB_TIP], hand.landmarks[LM.WRIST]); line(hand.landmarks[LM.INDEX_TIP], hand.landmarks[LM.WRIST])
      }
      ctx.stroke()

      // anel externo (fecha conforme confirma) + anel interno tracejado girando
      ctx.lineWidth = 1.4
      ctx.strokeStyle = `rgba(${ACCENT}, ${0.85 * a})`
      ctx.beginPath(); ctx.arc(mx, my, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (active ? 1 : p.progress)); ctx.stroke()
      if (active) {
        ctx.lineWidth = 1
        ctx.setLineDash([3, 7]); ctx.lineDashOffset = -t * 18
        ctx.strokeStyle = `rgba(${ACCENT}, 0.55)`
        ctx.beginPath(); ctx.arc(mx, my, r * 0.82, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([]); ctx.lineDashOffset = 0
        ctx.strokeStyle = `rgba(${ACCENT}, 0.35)`
        ctx.beginPath()
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + t * 0.25, len = i % 6 === 0 ? 9 : 4
          ctx.moveTo(mx + Math.cos(ang) * (r + 3), my + Math.sin(ang) * (r + 3)); ctx.lineTo(mx + Math.cos(ang) * (r + 3 + len), my + Math.sin(ang) * (r + 3 + len))
        }
        ctx.stroke()
        ctx.fillStyle = `rgba(${ACCENT}, 0.8)`; ctx.font = mono; ctx.textAlign = 'center'
        ctx.fillText(`X ${p.mid.x.toFixed(2)}  Y ${p.mid.y.toFixed(2)}`, mx, my + r + 28)
      }
      ctx.fillStyle = `rgba(${ACCENT}, ${0.9 * a})`
      for (const q of pts) { const [x, y] = px(q); ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill() }
    }

    const drawCursor = (g: GestureFrame) => {
      if (!g.engaged) return // fora do modo holográfico, apontar/pinçar não faz nada: não mostra cursor
      for (const hnd of g.hands) {
        const pinching = hnd.pinch.state !== 'idle'
        if (!pinching && hnd.point.state !== 'active') continue
        const [x, y] = px(pinching ? hnd.pinch.point : hnd.pointer)
        const grab = hnd.pinch.state === 'active'
        ctx.strokeStyle = `rgba(${ACCENT}, ${grab ? 0.95 : 0.8})`
        ctx.fillStyle = `rgba(${ACCENT}, ${grab ? 0.3 : 0.1})`
        ctx.lineWidth = 1.3
        const r = grab ? 9 : 14
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.beginPath()
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) { ctx.moveTo(x + dx * (r + 3), y + dy * (r + 3)); ctx.lineTo(x + dx * (r + 10), y + dy * (r + 10)) }
        ctx.stroke()
        if (pinching && hnd.pinch.start && !grab) { // alvo em mira enquanto a pinça fecha
          const [sx, sy] = px(hnd.pinch.start)
          ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
        }
      }
    }

    const drawTwoHands = (g: GestureFrame) => {
      const a = g.hands.find((x) => x.slot === 0), b = g.hands.find((x) => x.slot === 1)
      if (!a || !b) return
      const [ax, ay] = px(a.center), [bx, by] = px(b.center)
      if (g.zoom.state === 'active') {
        ctx.strokeStyle = `rgba(${ACCENT}, 0.55)`; ctx.lineWidth = 1.1; ctx.setLineDash([4, 5])
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = `rgba(${ACCENT}, 0.9)`; ctx.font = mono; ctx.textAlign = 'center'
        ctx.fillText(`ZOOM ×${g.zoom.ratio.toFixed(2)}`, (ax + bx) / 2, (ay + by) / 2 - 10)
      }
      if (g.spin.state === 'active') {
        const cx = (ax + bx) / 2, cy = (ay + by) / 2, r = Math.hypot(bx - ax, by - ay) / 2 + 10
        const cw = g.spin.velocity >= 0
        const base = Math.atan2(by - ay, bx - ax)
        ctx.strokeStyle = `rgba(${ACCENT}, 0.7)`; ctx.lineWidth = 1.4
        for (const off of [0, Math.PI]) {
          const s = base + off + (cw ? 0.3 : -0.3), e = base + off + (cw ? 1.2 : -1.2)
          ctx.beginPath(); ctx.arc(cx, cy, r, s, e, !cw); ctx.stroke()
          const ex = cx + Math.cos(e) * r, ey = cy + Math.sin(e) * r, tg = e + (cw ? Math.PI / 2 : -Math.PI / 2)
          ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(tg - 0.5) * 8, ey - Math.sin(tg - 0.5) * 8); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(tg + 0.5) * 8, ey - Math.sin(tg + 0.5) * 8); ctx.stroke()
        }
      }
    }

    // planeta em foco: anel com marcas, nome e a trajetória do arrasto (desvanece com o tempo)
    const drawFocus = (g: GestureFrame) => {
      if (!interaction || !g.engaged) return
      const { focus, trail, held } = interaction.view
      if (trail.length > 1) {
        ctx.lineCap = 'round'
        for (let i = 1; i < trail.length; i++) {
          const age = (g.time - trail[i].t) / 1100
          const a = Math.max(0, 1 - age) * (0.15 + 0.7 * (i / trail.length))
          if (a <= 0.01) continue
          ctx.strokeStyle = `rgba(${ACCENT}, ${a})`; ctx.lineWidth = 1 + 1.6 * (i / trail.length)
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke()
        }
        ctx.lineCap = 'butt'
      }
      if (!focus) return
      const grab = focus.mode === 'held'
      const r = focus.r + (grab ? 12 : 9)
      const t = g.time / 1000
      ctx.strokeStyle = `rgba(${ACCENT}, ${grab ? 0.95 : 0.7})`; ctx.lineWidth = grab ? 1.6 : 1.2
      ctx.beginPath(); ctx.arc(focus.x, focus.y, r, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([3, 6]); ctx.lineDashOffset = -t * (grab ? 26 : 14)
      ctx.strokeStyle = `rgba(${ACCENT}, 0.45)`
      ctx.beginPath(); ctx.arc(focus.x, focus.y, r + 7, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.lineDashOffset = 0
      ctx.strokeStyle = `rgba(${ACCENT}, ${grab ? 0.9 : 0.6})`; ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = 0; i < 4; i++) { // mira nos quatro lados
        const ang = (i * Math.PI) / 2 + (grab ? 0 : Math.PI / 4)
        ctx.moveTo(focus.x + Math.cos(ang) * (r - 4), focus.y + Math.sin(ang) * (r - 4)); ctx.lineTo(focus.x + Math.cos(ang) * (r + 5), focus.y + Math.sin(ang) * (r + 5))
      }
      ctx.stroke()
      ctx.textAlign = 'center'
      ctx.font = '700 11px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillStyle = `rgba(${ACCENT}, 0.95)`
      ctx.fillText(focus.name.toUpperCase(), focus.x, focus.y - r - 16)
      ctx.font = mono; ctx.fillStyle = `rgba(${ACCENT}, 0.7)`
      ctx.fillText(held ? (held.moved ? 'ARRASTANDO' : 'SELECIONADO') : 'ALVO', focus.x, focus.y - r - 4)
    }

    const drawGesture = (g: GestureFrame) => { drawPortal(g); drawTwoHands(g); drawFocus(g); drawCursor(g) }

    const offFrames = controller.subscribeFrames(drawLandmarks)
    const offGestures = controller.subscribeGestures(drawGesture)
    return () => { offFrames(); offGestures(); window.removeEventListener('resize', resize); ctx.clearRect(0, 0, w, h) }
  }, [controller, show, interaction])

  return <canvas ref={canvasRef} className="hand-overlay" aria-hidden="true" />
}
