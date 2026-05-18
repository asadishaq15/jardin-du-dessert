export const CACTUS_VIDEO_WEBM = '/newUpdatedCactusCropped.webm'
export const CACTUS_VIDEO_SAFARI_MP4 = '/updatedmp4.mp4'

const SCENE_DEFER_TIMEOUT_WEBM_MS = 400
const SCENE_DEFER_TIMEOUT_MP4_MS = 1200
const HAVE_CURRENT_DATA = 2

let preloadPromise = null
let fetchWarmPromise = null
let preloadedSrc = null
let preloadVideoEl = null
let sceneCanMount = false

function usesSafariMp4(src = pickCactusVideoSrc()) {
  return src === CACTUS_VIDEO_SAFARI_MP4
}

/** iOS WebKit and desktop Safari lack WebM alpha; use white-matte MP4 there. */
export function pickCactusVideoSrc() {
  if (typeof navigator === 'undefined') return CACTUS_VIDEO_WEBM
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isSafariDesktop =
    /Macintosh|Mac OS X/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/i.test(ua)
  return isIOS || isSafariDesktop ? CACTUS_VIDEO_SAFARI_MP4 : CACTUS_VIDEO_WEBM
}

export function getPreloadedCactusVideoSrc() {
  return preloadedSrc
}

/** True once the clip has buffered enough to defer heavy 3D loads. */
export function isCactusVideoPreloaded() {
  return sceneCanMount
}

/** True once the clip can show at least one frame in the loading UI. */
export function isCactusVideoDisplayReady() {
  return preloadVideoEl != null && preloadVideoEl.readyState >= HAVE_CURRENT_DATA
}

/**
 * High-priority fetch warms the HTTP cache (helps Safari MP4 before decode).
 */
function warmCactusVideoCache(src) {
  if (typeof fetch === 'undefined') return Promise.resolve()
  if (fetchWarmPromise) return fetchWarmPromise

  fetchWarmPromise = fetch(src, { priority: 'high', cache: 'force-cache' }).catch(
    () => {},
  )
  return fetchWarmPromise
}

/**
 * Warm the loading-screen cactus clip (one format per browser).
 * Deduped; safe to call from App mount and again on the desert loading screen.
 */
export function preloadCactusLoadingVideo() {
  if (typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  if (preloadPromise) return preloadPromise

  preloadedSrc = pickCactusVideoSrc()
  const isMp4 = usesSafariMp4(preloadedSrc)
  warmCactusVideoCache(preloadedSrc)

  preloadPromise = new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('fetchpriority', 'high')
    video.src = preloadedSrc
    preloadVideoEl = video

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      sceneCanMount = true
      clearTimeout(timeoutId)
      resolve(video)
    }

    const timeoutMs = isMp4 ? SCENE_DEFER_TIMEOUT_MP4_MS : SCENE_DEFER_TIMEOUT_WEBM_MS
    const timeoutId = setTimeout(finish, timeoutMs)

    // loadeddata = first frame (earlier than canplay on Safari MP4)
    video.addEventListener('loadeddata', finish, { once: true })
    video.addEventListener('canplaythrough', finish, { once: true })
    video.addEventListener('error', finish, { once: true })
    video.load()
  })

  return preloadPromise
}

/**
 * Move the preloaded <video> into the loading UI (avoids a second fetch/decode on Safari).
 */
export function takePreloadedCactusVideoElement() {
  const el = preloadVideoEl
  preloadVideoEl = null
  return el
}

// Start fetch + decode as soon as this module is imported (before React paints desert).
if (typeof document !== 'undefined') {
  preloadCactusLoadingVideo()
}
