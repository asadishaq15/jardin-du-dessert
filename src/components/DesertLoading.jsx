import { useEffect, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'

/**
 * Premium loading screen for the desert view.
 * Fades out smoothly once sceneAssetsReady becomes true.
 */
export default function DesertLoading() {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (ready) {
      setIsFading(true)
      const timer = setTimeout(() => setShouldRender(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [ready])

  if (!shouldRender) return null

  return (
    <div className={`desert-loading ${isFading ? 'is-fading' : ''}`}>
      <div className="desert-loading__content">
        <div className="desert-loading__logo">
          <img src="/Logo1-new.png" alt="" className="loading-symbol" />
        </div>
        <div className="desert-loading__text">Entering the Desert</div>
        <div className="desert-loading__bar-container">
          <div className={`desert-loading__bar ${ready ? 'is-full' : ''}`} />
        </div>
      </div>
    </div>
  )
}
