import { useEffect, useRef, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import {
  CACTUS_VIDEO_SAFARI_MP4,
  getPreloadedCactusVideoSrc,
  isCactusVideoDisplayReady,
  pickCactusVideoSrc,
  preloadCactusLoadingVideo,
  takePreloadedCactusVideoElement,
} from '../utils/cactusLoadingVideo'

const FADE_DURATION_MS = 1200
const FALLBACK_MIN_PLAYBACK_MS = 3000
const HAVE_CURRENT_DATA = 2

/**
 * Loading screen for the desert view.
 * Plays the cactus animation from /public while scene assets are loading,
 * then fades out once sceneAssetsReady becomes true and the animation has played once.
 */
export default function DesertLoading({
  mobileLayout = false,
  onFadeStart,
  onFadeComplete,
}) {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [videoReady, setVideoReady] = useState(isCactusVideoDisplayReady)
  const [videoDurationMs, setVideoDurationMs] = useState(FALLBACK_MIN_PLAYBACK_MS)
  const videoDurationMsRef = useRef(FALLBACK_MIN_PLAYBACK_MS)
  const playbackTimerRef = useRef(null)
  const videoWrapRef = useRef(null)
  const videoRef = useRef(null)
  const [videoSrc] = useState(
    () => getPreloadedCactusVideoSrc() ?? pickCactusVideoSrc(),
  )
  const isSafariVideo = videoSrc === CACTUS_VIDEO_SAFARI_MP4
  const isFading = ready && hasPlayedOnce

  const startPlaybackTimer = (durationMs = videoDurationMsRef.current) => {
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current)
    }

    playbackTimerRef.current = setTimeout(() => {
      setHasPlayedOnce(true)
    }, durationMs)
  }

  useEffect(() => {
    const wrap = videoWrapRef.current
    if (!wrap) return undefined

    let cancelled = false

    const markVideoReady = () => {
      if (!cancelled) setVideoReady(true)
    }

    const wireVideo = (video) => {
      if (!video || cancelled) return null

      videoRef.current = video
      video.className = `desert-loading__video${isSafariVideo ? ' desert-loading__video--safari' : ''}`
      video.muted = true
      video.loop = true
      video.playsInline = true
      video.autoplay = true
      video.preload = 'auto'
      video.setAttribute('fetchpriority', 'high')
      video.setAttribute('aria-hidden', 'true')

      const onLoadedMetadata = () => {
        const durationSeconds = video.duration
        const durationMs =
          Number.isFinite(durationSeconds) && durationSeconds > 0
            ? durationSeconds * 1000
            : FALLBACK_MIN_PLAYBACK_MS
        setVideoDurationMs(durationMs)
        videoDurationMsRef.current = durationMs
      }

      const onPlaying = () => {
        markVideoReady()
        startPlaybackTimer()
      }

      video.addEventListener('loadedmetadata', onLoadedMetadata)
      video.addEventListener('loadeddata', markVideoReady)
      video.addEventListener('canplay', markVideoReady)
      video.addEventListener('playing', onPlaying)
      video.addEventListener('error', () => startPlaybackTimer(FALLBACK_MIN_PLAYBACK_MS))

      wrap.replaceChildren(video)

      if (video.readyState >= HAVE_CURRENT_DATA) {
        markVideoReady()
        onLoadedMetadata()
      }

      void video.play().catch(() => {})

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
        video.removeEventListener('loadeddata', markVideoReady)
        video.removeEventListener('canplay', markVideoReady)
        video.removeEventListener('playing', onPlaying)
      }
    }

    let cleanupListeners = wireVideo(takePreloadedCactusVideoElement())

    if (!cleanupListeners) {
      preloadCactusLoadingVideo().then(() => {
        if (cancelled) return
        cleanupListeners = wireVideo(takePreloadedCactusVideoElement())
        if (!cleanupListeners && !cancelled) {
          const fallback = document.createElement('video')
          fallback.src = videoSrc
          cleanupListeners = wireVideo(fallback)
        }
      })
    }

    return () => {
      cancelled = true
      cleanupListeners?.()
    }
  }, [isSafariVideo, videoSrc])

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

  if (!shouldRender) return null

  return (
    <div
      className={`desert-loading${mobileLayout ? ' desert-loading--mobile' : ''}${isFading ? ' is-fading' : ''}`}
      role="status"
      aria-label="Loading desert scene"
    >
      <div className="desert-loading__content">
        <div
          ref={videoWrapRef}
          className={`desert-loading__video-wrap${isSafariVideo ? ' desert-loading__video-wrap--safari' : ''}`}
        />
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
