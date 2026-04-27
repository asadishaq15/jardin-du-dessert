import { useEffect, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'

/**
 * Premium loading screen for the desert view.
 * Features an SVG line-drawing animation of the brand logo (cactus icon)
 * that draws itself in copper tones while 3D assets load.
 */
export default function DesertLoading() {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (ready) {
      setIsFading(true)
      const timer = setTimeout(() => setShouldRender(false), 1400)
      return () => clearTimeout(timer)
    }
  }, [ready])

  if (!shouldRender) return null

  return (
    <div className={`desert-loading ${isFading ? 'is-fading' : ''}`}>
      <div className="desert-loading__content">
        <div className="desert-loading__logo">
          <svg
            viewBox="0 0 200 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="loading-logo-svg"
          >
            {/* Main stem — dark copper, draws from bottom to top */}
            <path
              className="logo-path logo-path--stem"
              d="M108 310 
                 C108 310 108 220 108 180
                 C108 140 112 100 112 70
                 C112 40 108 20 98 12
                 C88 4 78 16 78 32
                 C78 48 88 56 98 52"
              stroke="#B8723A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right leaf loop — dark copper, sweeps up and right */}
            <path
              className="logo-path logo-path--right"
              d="M108 200
                 C118 180 138 140 148 110
                 C158 80 158 40 138 22
                 C118 4 106 22 106 44
                 C106 66 118 76 130 68"
              stroke="#B8723A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Left leaf loop — light copper, sweeps left and up */}
            <path
              className="logo-path logo-path--left"
              d="M100 230
                 C80 210 40 170 24 140
                 C8 110 8 70 28 50
                 C48 30 68 44 72 64
                 C76 84 64 100 52 96"
              stroke="#DDA97A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner petal — light copper, small inner detail */}
            <path
              className="logo-path logo-path--petal"
              d="M102 180
                 C96 160 86 130 82 110
                 C78 90 82 66 92 58
                 C102 50 108 60 106 74"
              stroke="#DDA97A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="desert-loading__text">Entering the Desert</div>
        <div className="desert-loading__bar-container">
          <div className={`desert-loading__bar ${ready ? 'is-full' : ''}`} />
        </div>
      </div>
    </div>
  )
}
