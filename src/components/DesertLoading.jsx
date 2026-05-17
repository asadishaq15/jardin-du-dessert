import { useEffect, useRef, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import {
  CACTUS_VIDEO_SAFARI_MP4,
  getPreloadedCactusVideoSrc,
  isCactusVideoPreloaded,
  pickCactusVideoSrc,
  preloadCactusLoadingVideo,
} from '../utils/cactusLoadingVideo'

const FADE_DURATION_MS = 1200
const FALLBACK_MIN_PLAYBACK_MS = 3000

/**
 * Loading screen for the desert view.
 * Plays the cactus animation from /public while scene assets are loading,
 * then fades out once sceneAssetsReady becomes true and the animation has played once.
 */
export default function DesertLoading({ onFadeStart, onFadeComplete }) {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [videoReady, setVideoReady] = useState(isCactusVideoPreloaded)
  const [videoDurationMs, setVideoDurationMs] = useState(FALLBACK_MIN_PLAYBACK_MS)
  const videoDurationMsRef = useRef(FALLBACK_MIN_PLAYBACK_MS)
  const playbackTimerRef = useRef(null)
  const [videoSrc] = useState(
    () => getPreloadedCactusVideoSrc() ?? pickCactusVideoSrc(),
  )
  const isSafariVideo = videoSrc === CACTUS_VIDEO_SAFARI_MP4
  const isFading = ready && hasPlayedOnce

  useEffect(() => {
    preloadCactusLoadingVideo().then(() => setVideoReady(true))
  }, [])

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
    if (!isFading) return undefined
    onFadeStart?.()
    const timer = setTimeout(() => {
      setShouldRender(false)
      onFadeComplete?.()
    }, FADE_DURATION_MS)
    return () => clearTimeout(timer)
  }, [isFading, onFadeStart, onFadeComplete])

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

  const markVideoReady = () => setVideoReady(true)

  if (!shouldRender) return null

  return (
    <div
      className={`desert-loading ${isFading ? 'is-fading' : ''}`}
      role="status"
      aria-label="Loading desert scene"
    >
      <div className="desert-loading__content">
        <div
          className={`desert-loading__video-wrap${isSafariVideo ? ' desert-loading__video-wrap--safari' : ''}`}
        >
          <video
            key={videoSrc}
            className={`desert-loading__video${isSafariVideo ? ' desert-loading__video--safari' : ''}`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            fetchPriority="high"
            aria-hidden="true"
            src={videoSrc}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={markVideoReady}
            onPlaying={() => {
              markVideoReady()
              startPlaybackTimer()
            }}
            onError={() => startPlaybackTimer(FALLBACK_MIN_PLAYBACK_MS)}
          />
        </div>
        <div
          className={`desert-loading__below${videoReady ? ' desert-loading__below--visible' : ''}`}
        >
          <div className="desert-loading__text">You are entering silence</div>
          <div className="desert-loading__bar-container">
            <div className={`desert-loading__bar ${ready ? 'is-full' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
