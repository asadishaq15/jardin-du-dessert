import { create } from 'zustand'

/**
 * True once GLB + HDR + sun/moon/fog inside Canvas Suspense have resolved.
 * Used to defer intro text/Start animations until the scene can render.
 */
export const useAssetReadyStore = create((set) => ({
  sceneAssetsReady: false,
  setSceneAssetsReady: (ready) => set({ sceneAssetsReady: !!ready }),
}))
