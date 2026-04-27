import { create } from 'zustand'

/**
 * Global app navigation + state selection store.
 * Mirrors the vanilla-JS `go()`, `filterRealm()`, `chosenState` from the HTML prototype.
 */
export const useAppStore = create((set) => ({
  /** Current visible screen: 'entry' | 'realms' | 'states' | 'form' | 'submitted' | 'desert' */
  screen: 'entry',
  setScreen: (screen) => set({ screen }),

  /** Active realm filter for the states catalog: 'ALL' | 'BODY' | 'MIND' | ... */
  activeRealm: 'ALL',
  setActiveRealm: (activeRealm) => set({ activeRealm }),

  /** State modal: { realmKey, idx } or null */
  stateModal: null,
  openStateModal: (realmKey, idx) => set({ stateModal: { realmKey, idx } }),
  closeStateModal: () => set({ stateModal: null }),

  /** About modal */
  aboutOpen: false,
  setAboutOpen: (aboutOpen) => set({ aboutOpen }),

  /** Chosen state after CLAIM: { realmKey, idx, name } or null */
  chosenState: null,
  setChosenState: (chosenState) => set({ chosenState }),

  /** Current state being viewed in modal (for form flow) */
  currentState: null,
  setCurrentState: (currentState) => set({ currentState }),
}))
