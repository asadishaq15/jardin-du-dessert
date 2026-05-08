import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import { useRevealUiStore } from '../store/useRevealUiStore'
import { setRevealT } from '../store/revealProgressStore'
import DesertScene from './DesertScene'
import DesertRevealModal from './DesertRevealModal'
import DesertLoading from './DesertLoading'
import { DesertRotateHint } from './DesertRotateHint'

/** Animated sound wave bars — shared with FrameTop */
function SoundWave({ playing }) {
  return (
    <span className="sound-wave" aria-hidden="true">
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
    </span>
  )
}

/**
 * Fullscreen desert 3D view — shown when user clicks "DESERT" in navbar.
 * The sound button here mirrors the navbar sound button via shared store.
 */
export default function DesertView() {
  const setScreen = useAppStore((s) => s.setScreen)
  const playing = useSoundStore((s) => s.playing)
  const toggle = useSoundStore((s) => s.toggle)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const setSceneAssetsReady = useAssetReadyStore((s) => s.setSceneAssetsReady)
  const setHorizonHotspotVisible = useRevealUiStore((s) => s.setHorizonHotspotVisible)
  const [forceLandscape, setForceLandscape] = useState(false)
  const [dismissedHint, setDismissedHint] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [revealStarted, setRevealStarted] = useState(false)
  const [mobileOptimized, setMobileOptimized] = useState(false)
  const wasLandscapeRef = useRef(false)
  const loaderFinishedRef = useRef(false)

  const handleReturn = () => {
    setPlaying(false)
    setScreen('entry')
  }

  useEffect(() => {
    // Explicitly reset cross-component reveal/loading state on every desert entry.
    setSceneAssetsReady(false)
    setHorizonHotspotVisible(false)
    setRevealT(0)
    setShowLoading(true)
    setRevealStarted(false)
    setDismissedHint(false)
    wasLandscapeRef.current = false
    loaderFinishedRef.current = false
  }, [setHorizonHotspotVisible, setSceneAssetsReady])

  useEffect(() => {
    const hasWindow = typeof window !== 'undefined'
    if (!hasWindow) return undefined

    const orientationApi = window.screen?.orientation
    const supportsLock = typeof orientationApi?.lock === 'function'
    const supportsUnlock = typeof orientationApi?.unlock === 'function'

    const isMobileViewport = () => {
      const isNarrow = window.matchMedia('(max-width: 900px)').matches
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
      const noHover = window.matchMedia('(hover: none)').matches
      return isNarrow && (hasCoarsePointer || noHover)
    }

    const isPortrait = () => {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return true
      }
      return window.innerHeight >= window.innerWidth
    }

    const syncFallback = () => {
      const isMobile = isMobileViewport()
      const shouldForceLandscape = isMobile && isPortrait()
      const isLandscapeNow = !isPortrait()

      // Once the user rotates to landscape, allow showing the hint again
      // if they later return to portrait.
      if (isLandscapeNow) {
        wasLandscapeRef.current = true
      } else if (wasLandscapeRef.current) {
        setDismissedHint(false)
        wasLandscapeRef.current = false
      }

      setMobileOptimized(isMobile)
      setForceLandscape(shouldForceLandscape)
    }

    let orientationLocked = false

    const lockLandscape = async () => {
      if (!isMobileViewport()) {
        setMobileOptimized(false)
        setForceLandscape(false)
        return
      }

      if (!supportsLock) {
        syncFallback()
        return
      }

      try {
        await orientationApi.lock('landscape')
        orientationLocked = true
        setMobileOptimized(true)
        setForceLandscape(false)
      } catch {
        // Common on iOS Safari and non-fullscreen contexts.
        syncFallback()
      }
    }

    lockLandscape()

    const handleViewportChange = () => {
      if (orientationLocked) return
      syncFallback()
    }

    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)

      if (orientationLocked && supportsUnlock) {
        orientationApi.unlock()
      }
    }
  }, [])

  const handleLoadingFadeComplete = useCallback(() => {
    if (loaderFinishedRef.current) return
    loaderFinishedRef.current = true
    setShowLoading(false)
    setRevealStarted(true)
  }, [])

  const showRotateHint = forceLandscape && !dismissedHint

  return (
    <div className="desert-view">
      <div className="desert-view__viewport">
        {showLoading && <DesertLoading onFadeComplete={handleLoadingFadeComplete} />}
        <DesertScene
          started={revealStarted}
          scenePointerEvents={revealStarted}
          mobileOptimized={mobileOptimized}
        />
        <div className="desert-controls">
          <button className="desert-return" onClick={handleReturn}>
            <span aria-hidden="true">←</span>
            <span>CLICK TO RETURN</span>
          </button>

          <button
            className={`sound-btn${playing ? ' is-playing' : ''}`}
            onClick={toggle}
            aria-label={playing ? 'Toggle sound' : 'Toggle sound'}
            title={playing ? 'Pause' : 'Play ambient'}
          >
            <SoundWave playing={playing} />
            <span className="sound-btn__label">{playing ? 'SOUND' : 'SOUND'}</span>
          </button>
        </div>
      </div>
      {/* RotateHint lives outside the rotated viewport so it renders right-side-up in portrait */}
      {showRotateHint && <DesertRotateHint onDismiss={() => setDismissedHint(true)} />}
      <DesertRevealModal />
    </div>
  )
}
