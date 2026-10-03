'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, HandTrackingController, INITIAL_STATUS } from './hand-tracking-controller'
import type { HandSettings, TrackingStatus } from './types'

const SETTINGS_KEY = 'astra-hand-settings'
const DEVICE_KEY = 'astra-hand-device'

function loadSettings(): HandSettings {
  try {
    const raw = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}') as Partial<HandSettings>
    return {
      mirror: typeof raw.mirror === 'boolean' ? raw.mirror : DEFAULT_SETTINGS.mirror,
      showLandmarks: typeof raw.showLandmarks === 'boolean' ? raw.showLandmarks : DEFAULT_SETTINGS.showLandmarks,
      lowLight: typeof raw.lowLight === 'boolean' ? raw.lowLight : DEFAULT_SETTINGS.lowLight,
      tolerance: typeof raw.tolerance === 'number' ? Math.min(2, Math.max(0.5, raw.tolerance)) : DEFAULT_SETTINGS.tolerance,
    }
  } catch { return { ...DEFAULT_SETTINGS } }
}

/**
 * Liga o HandTrackingController ao React. O React só recebe status de baixa frequência;
 * os frames de landmarks vão direto do controller para quem assina (overlay, gestos), sem re-render.
 */
export function useHandTracking() {
  const [controller, setController] = useState<HandTrackingController | null>(null)
  const [status, setStatus] = useState<TrackingStatus>(INITIAL_STATUS)
  const [settings, setSettings] = useState<HandSettings>(DEFAULT_SETTINGS)
  const settingsRef = useRef(settings)

  useEffect(() => {
    const c = new HandTrackingController()
    const saved = loadSettings()
    c.setSettings(saved)
    try { c.setPreferredDevice(window.localStorage.getItem(DEVICE_KEY)) } catch { /* sem storage */ }
    settingsRef.current = saved
    setSettings(saved)
    setStatus(c.getStatus())
    const off = c.subscribeStatus(setStatus)
    setController(c)
    return () => { off(); c.destroy() }
  }, [])

  const updateSettings = useCallback((partial: Partial<HandSettings>) => {
    const next = { ...settingsRef.current, ...partial }
    settingsRef.current = next
    setSettings(next)
    controller?.setSettings(partial)
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch { /* sem storage */ }
  }, [controller])

  const enable = useCallback(() => { void controller?.enable() }, [controller])
  const disable = useCallback(() => { controller?.disable() }, [controller])
  const toggle = useCallback(() => { void controller?.toggle() }, [controller])
  const recalibrate = useCallback(() => { controller?.recalibrate() }, [controller])
  const disengage = useCallback(() => { controller?.disengage() }, [controller])
  const selectDevice = useCallback((id: string) => {
    try { window.localStorage.setItem(DEVICE_KEY, id) } catch { /* sem storage */ }
    void controller?.selectDevice(id)
  }, [controller])

  return { controller, status, settings, enable, disable, toggle, recalibrate, disengage, selectDevice, updateSettings }
}
