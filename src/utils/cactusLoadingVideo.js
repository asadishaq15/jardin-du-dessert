export const CACTUS_VIDEO_WEBM = '/Updatedwebm.webm'
export const CACTUS_VIDEO_SAFARI_MP4 = '/updatedmp4.mp4'

const PRELOAD_TIMEOUT_MS = 400

let preloadPromise = null
let preloadedSrc = null
let preloadReady = false

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

export function isCactusVideoPreloaded() {
  return preloadReady
}

/**
 * Warm the HTTP cache for the loading-screen cactus clip (one format per browser).
 * Deduped; safe to call from App mount and again on the desert loading screen.
 */
export function preloadCactusLoadingVideo() {
  if (typeof document === 'undefined') {
    return Promise.resolve(null)
  }

  if (preloadPromise) return preloadPromise

  preloadedSrc = pickCactusVideoSrc()

  preloadPromise = new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = preloadedSrc

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      preloadReady = true
      clearTimeout(timeoutId)
      resolve(video)
    }

    const timeoutId = setTimeout(finish, PRELOAD_TIMEOUT_MS)

    video.addEventListener('canplaythrough', finish, { once: true })
    video.addEventListener('canplay', finish, { once: true })
    video.addEventListener('error', finish, { once: true })
    video.load()
  })

  return preloadPromise
}
