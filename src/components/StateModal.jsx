import { useRef } from 'react'
import { REALMS } from '../data/realms'
import { useAppStore } from '../store/useAppStore'

export default function StateModal() {
  const stateModal = useAppStore((s) => s.stateModal)
  const closeStateModal = useAppStore((s) => s.closeStateModal)
  const setChosenState = useAppStore((s) => s.setChosenState)
  const setCurrentState = useAppStore((s) => s.setCurrentState)
  const setScreen = useAppStore((s) => s.setScreen)
  const titleRef = useRef(null)

  if (!stateModal) return null

  const { realmKey, idx } = stateModal
  const realm = REALMS[realmKey]
  const state = realm.states[idx]
  const isLocked = state.status.startsWith('LOCKED')

  const handleClaim = () => {
    if (isLocked) return
    setChosenState({ realmKey, idx, name: state.name })
    setCurrentState({ realmKey, idx, ...state })

    // Flow title to copper, then advance to form
    const title = titleRef.current
    if (title) title.classList.add('is-activating')
    setTimeout(() => {
      if (title) title.classList.remove('is-activating')
      closeStateModal()
      setScreen('form')
    }, 900)
  }

  return (
    <div className="modal active" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="micro">{realm.title}</div>
        <h3 ref={titleRef}>{state.name}</h3>
        <div className="state-tag">{state.core}.</div>
        <div className="modal-meta">
          <div className="row">
            <div className="label">Allocation</div>
            <div className="value">1 Fragrance · 1 Property · 1 State</div>
          </div>
          <div className="row">
            <div className="label">Format</div>
            <div className="value">Scent · Ritual · State Integration</div>
          </div>
          <div className="row">
            <div className="label">Business Case</div>
            <div className="value">{state.biz}</div>
          </div>
          <div className="row">
            <div className="label">Status</div>
            <div className={`value${isLocked ? ' locked' : ''}`}>{state.status}</div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="btn"
            onClick={handleClaim}
            style={isLocked ? { opacity: 0.4, pointerEvents: 'none' } : {}}
          >
            {isLocked ? state.status : 'CLAIM THIS STATE'}
          </button>
          <button className="btn--ghost" onClick={closeStateModal}>← BACK</button>
        </div>
      </div>
    </div>
  )
}
