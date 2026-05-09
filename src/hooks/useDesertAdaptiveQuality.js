import { useEffect, useRef } from 'react'
import {
  DESERT_QUALITY_TIER,
  downgradeDesertQualityTier,
} from '../utils/desertQualityTier'

const SAMPLE_FRAMES = 90
const SKIP_INITIAL_FRAMES = 15
/** If sustained frame time implies FPS below this, step down one tier once. */
const FPS_THRESHOLD = 42

/**
 * After assets are ready, samples rAF deltas briefly; if GPU seems overloaded,
 * downgrades tier once (high → balanced → performance).
 */
export function useDesertAdaptiveQuality({ assetsReady, setTier, enabled = true }) {
  const measurementDoneRef = useRef(false)

  useEffect(() => {
    if (!enabled || !assetsReady || measurementDoneRef.current) return

    let cancelled = false
    let frame = 0
    let last = performance.now()
    const dts = []
    let rafId = 0

    const finish = () => {
      if (cancelled) return
      measurementDoneRef.current = true
      if (!dts.length) return
      const avgDt = dts.reduce((a, b) => a + b, 0) / dts.length
      const fps = 1000 / avgDt
      if (fps < FPS_THRESHOLD) {
        setTier((current) => {
          if (current === DESERT_QUALITY_TIER.PERFORMANCE) return current
          return downgradeDesertQualityTier(current)
        })
      }
    }

    const loop = (t) => {
      if (cancelled) return
      const dt = t - last
      last = t
      if (frame >= SKIP_INITIAL_FRAMES) {
        dts.push(dt)
      }
      frame++
      if (dts.length < SAMPLE_FRAMES) {
        rafId = requestAnimationFrame(loop)
      } else {
        finish()
      }
    }

    rafId = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [assetsReady, enabled, setTier])
}
