import { useEffect, useRef, useState } from 'react'
import { OVERLAY_FADE_MS } from '../constants/revealTimeline'
import { useTopNavStore } from '../store/useTopNavStore'

const ABOUT_HEADLINE = ['The Desert', 'Is A System']

/**
 * Persistent fullscreen About overlay that fades in over the live desert canvas. Reads
 * `aboutOpen` from the top-nav store and stays mounted across the intro → scene transition.
 */
function AboutOverlay() {
  const aboutOpen = useTopNavStore((s) => s.aboutOpen)
  const closeAbout = useTopNavStore((s) => s.closeAbout)

  /** `mounted` keeps the DOM around through the closing fade so the transition is visible. */
  const [mounted, setMounted] = useState(aboutOpen)
  /** `visible` toggles the `--visible` class one frame after mount so opacity actually animates. */
  const [visible, setVisible] = useState(false)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    if (aboutOpen) {
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setMounted(true)
      const id = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(id)
    }
    setVisible(false)
    if (mounted) {
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false)
        closeTimerRef.current = null
      }, OVERLAY_FADE_MS)
    }
    return undefined
  }, [aboutOpen, mounted])

  useEffect(
    () => () => {
      if (closeTimerRef.current != null) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    },
    [],
  )

  if (!mounted) return null

  return (
    <div
      className={`about-overlay${visible ? ' about-overlay--visible' : ''}`}
      style={{ ['--overlay-fade-ms']: `${OVERLAY_FADE_MS}ms` }}
      role="dialog"
      aria-modal="true"
      aria-label="About Jardin Du Désert"
    >
      <h1 className="about-overlay__brand">
        <img
          src="/Logo1.png"
          alt="Jardin Du Desert monogram"
          className="about-overlay__logo about-overlay__logo--mark"
        />
        <img
          src="/Logo2.png"
          alt="Jardin Du Desert"
          className="about-overlay__logo about-overlay__logo--wordmark"
        />
      </h1>

      <div className="about-overlay__body">
        <h2
          className="about-overlay__headline"
          aria-label={ABOUT_HEADLINE.join(' ')}
        >
          <span>{ABOUT_HEADLINE[0]}</span>
          <span>{ABOUT_HEADLINE[1]}</span>
        </h2>

        <div className="about-overlay__copy">
          <p className="about-overlay__paragraph">
            A state-based system for hospitality environments.
          </p>
          <p className="about-overlay__paragraph">
            We translate <strong>22 states of being</strong> into spatial experience.
          </p>
          <div className="about-overlay__group about-overlay__group--muted">
            <p className="about-overlay__paragraph">
              Each state is assigned to one property only.
            </p>
            <p className="about-overlay__paragraph">
              1 Fragrance &middot; 1 Property &middot; 1 State.
            </p>
          </div>
          <p className="about-overlay__paragraph">
            Properties don&rsquo;t design spaces. They operate states.
          </p>
        </div>
      </div>

      <div className="about-overlay__footer">
        <button
          type="button"
          className="about-overlay__close"
          onClick={closeAbout}
        >
          <span aria-hidden="true">&larr;</span> CLOSE
        </button>
      </div>
    </div>
  )
}

export default AboutOverlay
