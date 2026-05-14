import { useEffect, useRef, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'

const FADE_DURATION_MS = 1200
const FALLBACK_MIN_PLAYBACK_MS = 3000

/**
 * Loading screen for the desert view.
 * Plays the cactus animation from /public while scene assets are loading,
 * then fades out once sceneAssetsReady becomes true and the animation has played once.
 */
export default function DesertLoading({ onFadeComplete }) {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [videoDurationMs, setVideoDurationMs] = useState(FALLBACK_MIN_PLAYBACK_MS)
  const videoDurationMsRef = useRef(FALLBACK_MIN_PLAYBACK_MS)
  const playbackTimerRef = useRef(null)
  const isFading = ready && hasPlayedOnce

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    videoDurationMsRef.current = videoDurationMs
  }, [videoDurationMs])

  useEffect(() => {
    if (isFading) {
      const timer = setTimeout(() => {
        setShouldRender(false)
        onFadeComplete?.()
      }, FADE_DURATION_MS)
      return () => clearTimeout(timer)
    }
  }, [isFading, onFadeComplete])

  const startPlaybackTimer = (durationMs = videoDurationMsRef.current) => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
    }

    playbackTimerRef.current = setTimeout(() => {
      setHasPlayedOnce(true)
    }, durationMs)
  }

  const handleLoadedMetadata = (event) => {
    const durationSeconds = event.currentTarget.duration
    const durationMs =
      Number.isFinite(durationSeconds) && durationSeconds > 0
        ? durationSeconds * 1000
        : FALLBACK_MIN_PLAYBACK_MS

    setVideoDurationMs(durationMs)
    videoDurationMsRef.current = durationMs
  }

  if (!shouldRender) return null

  return (
    <div
      className={`desert-loading ${isFading ? 'is-fading' : ''}`}
      role="status"
      aria-label="Loading desert scene"
    >
      <div className="desert-loading__content">
        <video
          className="desert-loading__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedMetadata={handleLoadedMetadata}
          onPlaying={() => startPlaybackTimer()}
          onError={() => startPlaybackTimer(FALLBACK_MIN_PLAYBACK_MS)}
        >
          <source src="/cactusAnimation.webm" type="video/webm" />
        </video>
      </div>
    </div>
  )
}
