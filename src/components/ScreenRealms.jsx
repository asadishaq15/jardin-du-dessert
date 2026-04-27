import { useAppStore } from '../store/useAppStore'

const REALM_NAMES = ['BODY', 'MIND', 'HEART', 'SOUL', 'SPIRIT']

export default function ScreenRealms() {
  const setScreen = useAppStore((s) => s.setScreen)
  const setActiveRealm = useAppStore((s) => s.setActiveRealm)

  const handleRealm = (realm) => {
    setActiveRealm(realm)
    setScreen('states')
  }

  return (
    <section className="screen screen-realms active">
      <div className="micro">SELECT REALM · 01 / 04</div>
      <div className="realm-list">
        {REALM_NAMES.map((name) => (
          <button key={name} className="realm-item" onClick={() => handleRealm(name)}>
            {name} REALM
          </button>
        ))}
      </div>
      <button className="btn--ghost" onClick={() => handleRealm('ALL')}>VIEW ALL STATES →</button>
    </section>
  )
}
