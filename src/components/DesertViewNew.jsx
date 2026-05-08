import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import DesertSceneNew from './DesertSceneNew'
import DesertLoading from './DesertLoading'
import DesertRevealModal from './DesertRevealModal'
import { DesertRotateHint } from './DesertRotateHint'

/**
 * Fullscreen test view — loading overlay, scene, landscape hint on mobile portrait (same as main desert).
 */
export default function DesertViewNew() {
  const navigate = useNavigate()
  const setScreen = useAppStore((s) => s.setScreen)
  const setSceneAssetsReady = useAssetReadyStore((s) => s.setSceneAssetsReady)
  const [showLoading, setShowLoading] = useState(true)
  const [forceLandscape, setForceLandscape] = useState(false)
  const [dismissedHint, setDismissedHint] = useState(false)
  const [mobileOptimized, setMobileOptimized] = useState(false)
  const wasLandscapeRef = useRef(false)
  const loaderFinishedRef = useRef(false)

  useEffect(() => {
    setSceneAssetsReady(false)
    setShowLoading(true)
    loaderFinishedRef.current = false
    setDismissedHint(false)
    wasLandscapeRef.current = false
  }, [setSceneAssetsReady])

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
  }, [])

  const goHome = useCallback(() => {
    setScreen('entry')
    navigate('/', { replace: true })
  }, [navigate, setScreen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') goHome()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [goHome])

  const showRotateHint = forceLandscape && !dismissedHint

  return (
    <div className="desert-view">
      <div className="desert-view__viewport">
        {showLoading && <DesertLoading onFadeComplete={handleLoadingFadeComplete} />}
        <DesertSceneNew mobileOptimized={mobileOptimized} />
        <div className="desert-controls">
          <button type="button" className="desert-return" onClick={goHome}>
            <span aria-hidden="true">←</span>
            <span>CLICK TO RETURN</span>
          </button>
        </div>
      </div>
      {showRotateHint && <DesertRotateHint onDismiss={() => setDismissedHint(true)} />}
      <DesertRevealModal />
    </div>
  )
}
