import { useAppStore } from '../store/useAppStore'

export default function ScreenSubmitted() {
  const setScreen = useAppStore((s) => s.setScreen)
  const currentState = useAppStore((s) => s.currentState)

  return (
    <section className="screen screen-submitted active">
      <div className="micro">RECEIVED · 04 / 04</div>
      <h2>Application Received</h2>
      <p className="submitted-copy">
        Your request for STATE <strong>{currentState ? currentState.name : '—'}</strong> is under review.
        <br /><br />
        We will follow up with you personally to present the full model,
        territory terms, and installation.
      </p>
      <button className="btn" onClick={() => setScreen('states')}>RETURN TO STATES</button>
    </section>
  )
}
