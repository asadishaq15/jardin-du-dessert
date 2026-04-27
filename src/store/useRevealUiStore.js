import { create } from 'zustand'

/** UI gated on reveal progress (e.g. horizon chip) — updated from Canvas `HorizonReadyBridge`. */
export const useRevealUiStore = create((set) => ({
  horizonHotspotVisible: false,
  setHorizonHotspotVisible: (visible) => set({ horizonHotspotVisible: visible }),
}))
