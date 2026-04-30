import { useEffect, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'
import DesertScene from './DesertScene'
import DesertRevealModal from './DesertRevealModal'
import DesertLoading from './DesertLoading'

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
  const [forceLandscape, setForceLandscape] = useState(false)

  const handleReturn = () => {
    setPlaying(false)
    setScreen('entry')
  }

  useEffect(() => {
    const hasWindow = typeof window !== 'undefined'
    if (!hasWindow) return undefined

    const orientationApi = window.screen?.orientation
    const supportsLock = typeof orientationApi?.lock === 'function'
    const supportsUnlock = typeof orientationApi?.unlock === 'function'

    const isMobileViewport = () =>
      window.matchMedia('(max-width: 900px)').matches &&
      window.matchMedia('(pointer: coarse)').matches

    const isPortrait = () => {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return true
      }
      return window.innerHeight >= window.innerWidth
    }

    const syncFallback = () => {
      setForceLandscape(isMobileViewport() && isPortrait())
    }

    let orientationLocked = false

    const lockLandscape = async () => {
      if (!isMobileViewport()) {
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

  return (
    <div className={`desert-view${forceLandscape ? ' desert-view--force-landscape' : ''}`}>
      <div className="desert-view__viewport">
        <DesertLoading />
        <DesertScene started={true} scenePointerEvents={true} />
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
      <DesertRevealModal />
    </div>
  )
}
