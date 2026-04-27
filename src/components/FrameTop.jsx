import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'

export default function FrameTop() {
  const setScreen = useAppStore((s) => s.setScreen)
  const setActiveRealm = useAppStore((s) => s.setActiveRealm)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)

  const setPlaying = useSoundStore((s) => s.setPlaying)

  const handleDesert = () => {
    setScreen('desert')
    // Auto-play the track when entering the desert.
    setPlaying(true)
  }

  return (
    <header className="frame-top">
      <div
        className="brand"
        role="button"
        tabIndex={0}
        onClick={() => setScreen('entry')}
        onKeyDown={(e) => { if (e.key === 'Enter') setScreen('entry') }}
        aria-label="Jardin du Désert · home"
      >
        <img src="/Logo1-new.png" alt="Jardin du Désert" className="logo-icon" />
        <img src="/Logo2.png" alt="" className="logo-wordmark" />
      </div>
      <nav>
        <button className="nav-btn" onClick={() => { setActiveRealm('ALL'); setScreen('realms') }}>STATES</button>
        <button className="nav-btn" onClick={() => setAboutOpen(true)}>ABOUT</button>
        <button className="nav-btn" onClick={handleDesert}>DESERT</button>
      </nav>
    </header>
  )
}
