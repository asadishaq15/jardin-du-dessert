import { useEffect, useRef, useState } from 'react'
import { OVERLAY_FADE_MS, OVERLAY_SCENE_START_MS } from '../constants/revealTimeline'

const INTRO_HEADLINE = ['The Space', 'Is Yours.']
const INTRO_SUBLINE = 'CHOOSE THE STATE YOUR PROPERTY WILL LIVE FROM.'
const INTRO_CENTER_FOOTER = 'FOR HOSPITALITY \u00b7 SECURE STATE SOVEREIGNTY'
const INTRO_FOOTER_LEFT = 'EST. 2026 \u00b7 22 STATES'
const INTRO_FOOTER_RIGHT = 'SCENT \u00b7 RITUAL \u00b7 TERRITORY'

function IntroOverlay({
  onRevealScene,
  onFadeComplete,
  assetsReady = false,
  hidden = false,
  autoStart = false,
}) {
  const [fading, setFading] = useState(false)
  const sceneStartTimerRef = useRef(null)
  const rootRef = useRef(null)
  const revealedRef = useRef(false)

  useEffect(
    () => () => {
      if (sceneStartTimerRef.current != null) {
        clearTimeout(sceneStartTimerRef.current)
        sceneStartTimerRef.current = null
      }
    },
    [],
  )

  // Automatically trigger reveal when assets are ready if autoStart is true
  useEffect(() => {
    if (autoStart && assetsReady && !fading) {
      handleStart()
    }
  }, [autoStart, assetsReady])

  const handleStart = () => {
    if (fading) return
    setFading(true)
    sceneStartTimerRef.current = window.setTimeout(() => {
      sceneStartTimerRef.current = null
      if (!revealedRef.current) {
        revealedRef.current = true
        onRevealScene?.()
      }
    }, OVERLAY_SCENE_START_MS)
  }

  const handleTransitionEnd = (e) => {
    if (e.propertyName !== 'opacity' || !fading) return
    if (e.target !== rootRef.current) return
    const el = rootRef.current
    if (el) el.style.willChange = 'auto'
    onFadeComplete?.()
  }

  return (
    <div
      ref={rootRef}
      className={`intro-overlay${fading ? ' intro-overlay--fading' : ''}${
        hidden ? ' intro-overlay--hidden' : ''
      }`}
      style={{ ['--overlay-fade-ms']: `${OVERLAY_FADE_MS}ms` }}
      role="dialog"
      aria-label="Welcome"
      onTransitionEnd={handleTransitionEnd}
    >
      {!assetsReady && (
        <div className="intro-overlay__splash" aria-busy="true" aria-live="polite">
          <div className="intro-overlay__splash-veil" aria-hidden="true" />
          <div className="intro-overlay__splash-inner">
            <div className="intro-loader" role="status">
              <div className="intro-loader__mark" aria-hidden="true">
                <span className="intro-loader__ring intro-loader__ring--outer" />
                <span className="intro-loader__ring intro-loader__ring--inner" />
                <span className="intro-loader__glow" />
              </div>
              <p className="intro-loader__caption">
                <span className="visually-hidden">Loading scene</span>
                <span className="intro-loader__caption-visible" aria-hidden="true">
                  Loading
                  <span className="intro-loader__ellipsis" aria-hidden="true">
                    <span className="intro-loader__dot" />
                    <span className="intro-loader__dot" />
                    <span className="intro-loader__dot" />
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* 
        COMMENTED OUT: The manual start page content.
        The scene now auto-transitions from the loader above to the main scene.
      */}
      {/* 
      {assetsReady && (
        <>
          <div className="intro-overlay__inner">
            <h1 className="intro-overlay__title">
              <img
                src="/Logo1.png"
                alt="Jardin Du Desert monogram"
                className="intro-overlay__logo intro-overlay__logo--mark"
              />
              <img
                src="/Logo2.png"
                alt="Jardin Du Desert"
                className="intro-overlay__logo intro-overlay__logo--wordmark"
              />
            </h1>
            <div className="intro-overlay__center">
              <div className="intro-overlay__row">
                <p className="intro-overlay__headline" aria-label={INTRO_HEADLINE.join(' ')}>
                  <span>{INTRO_HEADLINE[0]}</span>
                  <span>{INTRO_HEADLINE[1]}</span>
                </p>
                <p className="intro-overlay__copy">{INTRO_SUBLINE}</p>
                <button
                  type="button"
                  className="intro-btn"
                  onClick={handleStart}
                  disabled={fading}
                >
                  ENTER <span aria-hidden="true">→</span>
                </button>
                <p className="intro-overlay__center-footer">{INTRO_CENTER_FOOTER}</p>
              </div>
            </div>
          </div>
          <div className="intro-overlay__meta" aria-hidden="true">
            <p className="intro-overlay__meta-left">{INTRO_FOOTER_LEFT}</p>
            <p className="intro-overlay__meta-right">{INTRO_FOOTER_RIGHT}</p>
          </div>
        </>
      )}
      */}
    </div>
  )
}

export default IntroOverlay
