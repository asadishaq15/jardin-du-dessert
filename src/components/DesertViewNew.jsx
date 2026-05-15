import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import DesertSceneNew from './DesertSceneNew'
import DesertLoading from './DesertLoading'
import DesertRevealModal from './DesertRevealModal'
import { DesertRotateHint } from './DesertRotateHint'
import DesertScrollIndicator from './DesertScrollIndicator'
import { useDesertPathProgressStore } from '../store/useDesertPathProgressStore'
import { resolveDesertQualityTier } from '../utils/desertQualityTier'
import { useDesertAdaptiveQuality } from '../hooks/useDesertAdaptiveQuality'

/** Animated sound wave bars — same as DesertView */
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
 * Fullscreen test view — loading overlay, scene, landscape hint on mobile portrait (same as main desert).
 */
export default function DesertViewNew() {
  const navigate = useNavigate()
  const setScreen = useAppStore((s) => s.setScreen)
  const playing = useSoundStore((s) => s.playing)
  const toggle = useSoundStore((s) => s.toggle)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const setSceneAssetsReady = useAssetReadyStore((s) => s.setSceneAssetsReady)
  const sceneAssetsReady = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [qualityTier, setQualityTier] = useState(() => resolveDesertQualityTier())
  const [showLoading, setShowLoading] = useState(true)
  const [sceneRevealed, setSceneRevealed] = useState(false)
  const [forceLandscape, setForceLandscape] = useState(false)
  const [dismissedHint, setDismissedHint] = useState(false)
  const [touchParallax, setTouchParallax] = useState(false)
  const wasLandscapeRef = useRef(false)
  const loaderFinishedRef = useRef(false)

  useEffect(() => {
    setSceneAssetsReady(false)
    setShowLoading(true)
    setSceneRevealed(false)
    loaderFinishedRef.current = false
    setDismissedHint(false)
    setTouchParallax(false)
    setForceLandscape(false)
    wasLandscapeRef.current = false
    setQualityTier(resolveDesertQualityTier())
    useDesertPathProgressStore.getState().resetDesertPathProgress()
  }, [setSceneAssetsReady])

  useDesertAdaptiveQuality({
    assetsReady: sceneAssetsReady,
    setTier: setQualityTier,
  })

  // Same as FrameTop → DESERT: start ambient as soon as this view is shown.
  useEffect(() => {
    setPlaying(true)
  }, [setPlaying])

  useEffect(() => {
    if (showLoading) return undefined

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

      if (isLandscapeNow) {
        wasLandscapeRef.current = true
      } else if (wasLandscapeRef.current) {
        setDismissedHint(false)
        wasLandscapeRef.current = false
      }

      setTouchParallax(isMobile)
      setForceLandscape(shouldForceLandscape)
    }

    let orientationLocked = false

    const lockLandscape = async () => {
      if (!isMobileViewport()) {
        setTouchParallax(false)
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
        setTouchParallax(true)
        setForceLandscape(false)
      } catch {
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
  }, [showLoading])

  const handleLoadingFadeStart = useCallback(() => {
    setSceneRevealed(true)
  }, [])

  const handleLoadingFadeComplete = useCallback(() => {
    if (loaderFinishedRef.current) return
    loaderFinishedRef.current = true
    setShowLoading(false)
  }, [])

  const touchParallaxActive = touchParallax && !showLoading

  const goHome = useCallback(() => {
    setPlaying(false)
    setScreen('entry')
    navigate('/', { replace: true })
  }, [navigate, setPlaying, setScreen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') goHome()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [goHome])

  const showRotateHint = !showLoading && forceLandscape && !dismissedHint

  return (
    <div className="desert-view">
      <div className="desert-view__viewport">
        {showLoading && (
          <DesertLoading
            onFadeStart={handleLoadingFadeStart}
            onFadeComplete={handleLoadingFadeComplete}
          />
        )}
        <DesertSceneNew
          qualityTier={qualityTier}
          touchParallax={touchParallaxActive}
          sceneRevealed={sceneRevealed}
        />
        <DesertScrollIndicator showLoading={showLoading} />
        <div className="desert-controls">
          <button
            type="button"
            className="desert-return desert-return--icon-only"
            onClick={goHome}
            aria-label="Return home"
            title="Return home"
          >
            <span aria-hidden="true">←</span>
          </button>

          <button
            type="button"
            className={`sound-btn sound-btn--icon-only${playing ? ' is-playing' : ''}`}
            onClick={toggle}
            aria-label={playing ? 'Pause ambient sound' : 'Play ambient sound'}
            title={playing ? 'Pause' : 'Play ambient'}
          >
            <SoundWave playing={playing} />
          </button>
        </div>
      </div>
      {showRotateHint && <DesertRotateHint onDismiss={() => setDismissedHint(true)} />}
      <DesertRevealModal />
    </div>
  )
}
