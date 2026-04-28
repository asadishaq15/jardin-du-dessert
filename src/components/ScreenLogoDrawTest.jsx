import { useState } from 'react'
import LogoDrawAnimation   from './LogoDrawAnimation'
import LogoFilledAnimation from './LogoFilledAnimation'

export default function ScreenLogoDrawTest() {
  const [strokeKey, setStrokeKey]  = useState(0)
  const [filledKey, setFilledKey]  = useState(0)

  return (
    <section className="screen active screen-logo-test">
      <div className="screen-logo-test__inner">
        <p className="screen-logo-test__eyebrow">Animation Test</p>

        <div className="screen-logo-test__compare">

          {/* Stroke-only draw */}
          <div className="screen-logo-test__col">
            <LogoDrawAnimation key={strokeKey} />
            <span className="screen-logo-test__label">Stroke draw</span>
            <button className="btn btn--sm" onClick={() => setStrokeKey((k) => k + 1)}>
              Replay
            </button>
          </div>

          {/* Filled draw (stroke trace → fill flood) */}
          <div className="screen-logo-test__col">
            <LogoFilledAnimation key={filledKey} />
            <span className="screen-logo-test__label">Filled draw</span>
            <button className="btn btn--sm" onClick={() => setFilledKey((k) => k + 1)}>
              Replay
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}
