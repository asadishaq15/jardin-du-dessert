import { useEffect, useRef, useState } from 'react'
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
 * Rotate-to-landscape prompt — full-screen overlay shown on mobile portrait.
 * Rendered OUTSIDE the rotated viewport so it always appears right-side-up.
 * Tap anywhere to dismiss early.
 */
function RotateHint({ onDismiss }) {
  return (
    <div
      className="desert-rotate-hint"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <div className="desert-rotate-hint__inner">
        <svg
          className="desert-rotate-hint__svg"
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Outer circle */}
          <circle
            className="drh-circle"
            cx="120" cy="120" r="88"
            stroke="white" strokeOpacity="0.28" strokeWidth="0.75"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1}
          />
          {/* Compass dots top / bottom */}
          <circle cx="120" cy="32" r="2" fill="white" fillOpacity="0.55" className="drh-accent" />
          <circle cx="120" cy="208" r="2" fill="white" fillOpacity="0.55" className="drh-accent" />
          {/* Compass dashes left / right */}
          <line x1="28" y1="120" x2="40" y2="120" stroke="white" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" className="drh-accent" />
          <line x1="200" y1="120" x2="212" y2="120" stroke="white" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" className="drh-accent" />

          {/* Portrait phone */}
          <g className="drh-portrait">
            <rect x="59" y="78" width="40" height="62" rx="6.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
            {/* speaker notch */}
            <rect x="70" y="84" width="16" height="2.5" rx="1.25" fill="white" fillOpacity="0.75" />
            {/* home indicator */}
            <rect x="74" y="132" width="8" height="2.5" rx="1.25" fill="white" fillOpacity="0.75" />
          </g>

          {/* Curved arrow: portrait top-right → landscape top */}
          <path
            className="drh-arrow"
            d="M 82 78 C 112 42 165 88 152 113"
            stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1}
          />
          {/* Arrowhead */}
          <path
            className="drh-arrowhead"
            d="M 146 107 L 153 113 L 159 107"
            stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9"
          />

          {/* Landscape phone */}
          <g className="drh-landscape">
            <rect x="128" y="110" width="60" height="38" rx="6.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" />
            {/* speaker notch — left short side in landscape */}
            <rect x="134" y="122" width="2.5" height="14" rx="1.25" fill="white" fillOpacity="0.75" />
            {/* home indicator — right short side */}
            <rect x="183" y="126" width="2.5" height="8" rx="1.25" fill="white" fillOpacity="0.75" />
          </g>
        </svg>
        <p className="desert-rotate-hint__label">Rotate to landscape for best experience</p>
        <p className="desert-rotate-hint__sub">Tap to continue in portrait</p>
      </div>
    </div>
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
  const [dismissedHint, setDismissedHint] = useState(false)
  const wasLandscapeRef = useRef(false)

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
      const shouldForceLandscape = isMobileViewport() && isPortrait()
      const isLandscapeNow = !isPortrait()

      // Once the user rotates to landscape, allow showing the hint again
      // if they later return to portrait.
      if (isLandscapeNow) {
        wasLandscapeRef.current = true
      } else if (wasLandscapeRef.current) {
        setDismissedHint(false)
        wasLandscapeRef.current = false
      }

      setForceLandscape(shouldForceLandscape)
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

  const showRotateHint = forceLandscape && !dismissedHint

  return (
    <div className="desert-view">
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
      {/* RotateHint lives outside the rotated viewport so it renders right-side-up in portrait */}
      {showRotateHint && <RotateHint onDismiss={() => setDismissedHint(true)} />}
      <DesertRevealModal />
    </div>
  )
}
