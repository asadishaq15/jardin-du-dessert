import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'

/** Animated sound wave bars — three bars that animate when playing */
function SoundWave({ playing }) {
  return (
    <span className="sound-wave" aria-hidden="true">
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
      <span className={`sound-wave__bar${playing ? ' is-playing' : ''}`} />
    </span>
  )
}

export default function FrameTop() {
  const setScreen = useAppStore((s) => s.setScreen)
  const setActiveRealm = useAppStore((s) => s.setActiveRealm)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)

  const playing = useSoundStore((s) => s.playing)
  const setPlaying = useSoundStore((s) => s.setPlaying)
  const toggle = useSoundStore((s) => s.toggle)
  const hasVisitedDesert = useSoundStore((s) => s.hasVisitedDesert)
  const setHasVisitedDesert = useSoundStore((s) => s.setHasVisitedDesert)

  const handleDesert = () => {
    setScreen('desert')
    // Auto-play the track when entering the desert
    setHasVisitedDesert(true)
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
        {hasVisitedDesert && (
          <button
            className={`sound-btn${playing ? ' is-playing' : ''}`}
            onClick={toggle}
            aria-label={playing ? 'Pause ambient sound' : 'Play ambient sound'}
            title={playing ? 'Pause' : 'Play ambient'}
          >
            <SoundWave playing={playing} />
            <span className="sound-btn__label">{playing ? 'SOUND' : 'SOUND'}</span>
          </button>
        )}
      </nav>
    </header>
  )
}
