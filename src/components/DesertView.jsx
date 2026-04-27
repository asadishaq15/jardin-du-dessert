import { useAppStore } from '../store/useAppStore'
import { useSoundStore } from '../store/useSoundStore'
import DesertScene from './DesertScene'
import DesertRevealModal from './DesertRevealModal'
import DesertLoading from './DesertLoading'

/** Animated sound wave bars — shared with FrameTop */
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

/**
 * Fullscreen desert 3D view — shown when user clicks "DESERT" in navbar.
 * The sound button here mirrors the navbar sound button via shared store.
 */
export default function DesertView() {
  const setScreen = useAppStore((s) => s.setScreen)
  const playing = useSoundStore((s) => s.playing)
  const toggle = useSoundStore((s) => s.toggle)
  const setPlaying = useSoundStore((s) => s.setPlaying)

  const handleReturn = () => {
    setPlaying(false)
    setScreen('entry')
  }

  return (
    <div className="desert-view">
      <DesertLoading />
      <DesertScene started={true} scenePointerEvents={true} />
      <div className="desert-controls">
        <button className="desert-return" onClick={handleReturn}>
          <span aria-hidden="true">←</span>
          <span>CLICK TO RETURN</span>
        </button>

        <button
          className={`sound-btn${playing ? ' is-playing' : ''}`}
          onClick={toggle}
          aria-label={playing ? 'Toggle sound' : 'Toggle sound'}
          title={playing ? 'Pause' : 'Play ambient'}
        >
          <SoundWave playing={playing} />
          <span className="sound-btn__label">{playing ? 'SOUND' : 'SOUND'}</span>
        </button>
      </div>
      <DesertRevealModal />
    </div>
  )
}
