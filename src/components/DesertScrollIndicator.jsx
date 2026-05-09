import { useEffect, useState } from 'react'
import { useDesertPathProgressStore } from '../store/useDesertPathProgressStore'

const HIDE_AFTER_PROGRESS = 0.08

/**
 * Minimal cue that the camera path is driven by scroll / vertical swipe.
 * Non-interactive overlay; progress comes from DesertGlbNew via Zustand (throttled).
 */
export default function DesertScrollIndicator({ showLoading }) {
  const pathProgress = useDesertPathProgressStore((s) => s.pathProgress)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const showCue = !showLoading && pathProgress < HIDE_AFTER_PROGRESS

  return (
    <div
      className={`desert-scroll-hint${reduceMotion ? ' desert-scroll-hint--static' : ''}${showCue ? ' desert-scroll-hint--visible' : ''}`}
      aria-hidden={!showCue}
      role="status"
      aria-label="Scroll or swipe to explore"
    >
      <div className="desert-scroll-hint__inner">
        <div className="desert-scroll-hint__track" aria-hidden="true">
          <span className="desert-scroll-hint__line" />
          <span className="desert-scroll-hint__glyph">
            <svg
              className="desert-scroll-hint__chevron"
              width="20"
              height="12"
              viewBox="0 0 20 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 3L10 10L18 3"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <span className="desert-scroll-hint__label">Scroll</span>
      </div>
    </div>
  )
}
