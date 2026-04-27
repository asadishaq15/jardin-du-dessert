import { useAppStore } from '../store/useAppStore'

export default function AboutModal() {
  const aboutOpen = useAppStore((s) => s.aboutOpen)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)

  if (!aboutOpen) return null

  return (
    <div className="modal modal-about active" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="about-brand">
          <div className="name">Jardin du Désert</div>
          <div className="role">Private Intellectual Fragrance House</div>
        </div>
        <h3>The Desert<br />Is A System</h3>
        <div className="about-copy">
          <p>A state-based system for hospitality environments.</p>
          <p>We translate <strong>22 states of being</strong> into spatial experience.</p>
          <p className="dim">
            Each state is assigned to one property only.
            <br />
            1 Fragrance · 1 Property · 1 State.
          </p>
          <p>Properties don't design spaces. They operate states.</p>
        </div>
        <button className="btn--ghost" onClick={() => setAboutOpen(false)}>← CLOSE</button>
      </div>
    </div>
  )
}
