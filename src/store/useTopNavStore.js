import { create } from 'zustand'

/** Persistent top-nav UI state — open/close the About overlay from any component. */
export const useTopNavStore = create((set) => ({
  aboutOpen: false,
  openAbout: () => set({ aboutOpen: true }),
  closeAbout: () => set({ aboutOpen: false }),
}))
