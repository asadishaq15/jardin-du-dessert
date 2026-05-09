import { create } from 'zustand'

/** Only emit when integer percent changes — avoids React re-rendering every frame. */
let lastEmittedPct = -1

export const useDesertPathProgressStore = create((set) => ({
  pathProgress: 0,

  /** Called from Canvas useFrame with mapped path progress [0, 1]. */
  setPathProgressFromCanvas: (p) => {
    const clamped = Math.min(1, Math.max(0, p))
    const pct = Math.floor(clamped * 100)
    if (pct === lastEmittedPct) return
    lastEmittedPct = pct
    set({ pathProgress: clamped })
  },

  resetDesertPathProgress: () => {
    lastEmittedPct = -1
    set({ pathProgress: 0 })
  },
}))
