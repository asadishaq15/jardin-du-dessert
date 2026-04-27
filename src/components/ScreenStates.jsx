import { REALMS, REALM_KEYS } from '../data/realms'
import { useAppStore } from '../store/useAppStore'

/** Lock / unlock SVG icons */
function LockIcon({ locked }) {
  if (locked) {
    return (
      <svg className="lock-ico" viewBox="0 0 18 18" aria-hidden="true">
        <rect x="3" y="9" width="9" height="8" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <path d="M5 9 V6 a3.5 3.5 0 0 1 7 0 V9" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg className="lock-ico" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3" y="9" width="9" height="8" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5 9 V5.5 a3.5 3.5 0 0 1 6.5 -1.7" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export default function ScreenStates() {
  const activeRealm = useAppStore((s) => s.activeRealm)
  const setActiveRealm = useAppStore((s) => s.setActiveRealm)
  const setScreen = useAppStore((s) => s.setScreen)
  const openStateModal = useAppStore((s) => s.openStateModal)
  const chosenState = useAppStore((s) => s.chosenState)

  const realmsToShow = activeRealm === 'ALL' ? REALM_KEYS : [activeRealm]
  const chosenInView = chosenState && (activeRealm === 'ALL' || chosenState.realmKey === activeRealm)
  const filterButtons = ['ALL', ...REALM_KEYS]

  return (
    <section className="screen screen-states active">
      <div className="states-header">
        <div className="micro">CATALOG</div>
        <h2>State Catalog</h2>
        <div className="lede">1 State · 1 Property · 1 Scent · 1 Ritual</div>
        <div className="states-filter">
          {filterButtons.map((realm) => (
            <button
              key={realm}
              className={activeRealm === realm ? 'is-active' : ''}
              onClick={() => setActiveRealm(realm)}
            >
              {realm}
            </button>
          ))}
        </div>
      </div>

      <div>
        {realmsToShow.map((key) => {
          const realm = REALMS[key]
          return (
            <div className="realm-block" key={key}>
              <div className="realm-title">
                {realm.title}
                <small>{realm.sub}</small>
              </div>
              <div className={`states-grid${chosenInView ? ' has-chosen' : ''}`}>
                {realm.states.map((s, i) => {
                  const isLocked = s.status.startsWith('LOCKED')
                  const isChosen = chosenState && chosenState.realmKey === key && chosenState.idx === i
                  const cellClasses = ['state-cell']
                  if (isLocked) cellClasses.push('is-locked')
                  if (isChosen) cellClasses.push('is-chosen')

                  return (
                    <div
                      key={i}
                      className={cellClasses.join(' ')}
                      onClick={() => openStateModal(key, i)}
                    >
                      <div className="state-name">
                        <LockIcon locked={isLocked} />
                        <span className="label-text">{s.name}</span>
                      </div>
                      <div className="state-core">{s.core}.</div>
                      <div className="state-status">{isChosen ? 'CHOSEN' : s.status}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button className="btn--ghost" onClick={() => setScreen('realms')}>← BACK TO REALMS</button>
      </div>
    </section>
  )
}
