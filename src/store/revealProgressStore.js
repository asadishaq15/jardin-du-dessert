import { create } from 'zustand'

/**
 * Single eased progress [0,1] for post-Start transition (camera + deferred scene).
 * Updated only from RevealAndCamera useFrame — read via getRevealT() inside other useFrames
 * to avoid per-frame React re-renders.
 */
export const useRevealProgressStore = create(() => ({
  t: 0,
}))

export function getRevealT() {
  return useRevealProgressStore.getState().t
}

export function setRevealT(t) {
  useRevealProgressStore.setState({ t })
}
