import { useAppStore } from '../store/useAppStore'

export default function ScreenEntry() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <section className="screen screen-entry active">
      <div className="entry-center">
        <h1>The Space<br />Is Yours.</h1>
        <div className="entry-sub">Choose the state your property will live from.</div>
      </div>

      <div className="entry-actions">
        <button className="btn" onClick={() => setScreen('realms')}>
          <span>Enter</span>
          <span aria-hidden="true">→</span>
        </button>
        <div className="sub-label">FOR HOSPITALITY · SECURE STATE SOVEREIGNTY</div>
      </div>
    </section>
  )
}
