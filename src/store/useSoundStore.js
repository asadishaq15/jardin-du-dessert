import { create } from 'zustand'

/**
 * Global sound state.
 * `playing` reflects the intent — the actual Audio element is managed in useDesertAudio.
 */
export const useSoundStore = create((set) => ({
  /** Whether the user has visited the desert at least once (to show the sound button) */
  hasVisitedDesert: false,
  setHasVisitedDesert: (hasVisitedDesert) => set({ hasVisitedDesert }),
  setPlaying: (playing) => set({ playing }),
  toggle: () => set((s) => ({ playing: !s.playing })),
}))
