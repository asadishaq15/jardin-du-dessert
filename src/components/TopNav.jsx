import { useCallback, useEffect, useRef, useState } from 'react'
import { useTopNavStore } from '../store/useTopNavStore'

const BRAND_NAME = 'JARDIN DU D\u00c9SERT'
const NAV_ITEMS = [
  { id: 'states', label: 'STATES' },
  { id: 'about', label: 'ABOUT' },
  { id: 'desert', label: 'DESERT' },
]
const NAV_SOUND_SRC = '/audio/desert-ambience.mp3'

function SineWave({ active }) {
  const flat = 'M0 10 L32 10'
  const wave1a = 'M0 10 Q4 0, 8 10 Q12 20, 16 10 Q20 0, 24 10 Q28 20, 32 10'
  const wave1b = 'M0 10 Q4 20, 8 10 Q12 0, 16 10 Q20 20, 24 10 Q28 0, 32 10'
  const wave2a = 'M0 10 Q4 3, 8 10 Q12 17, 16 10 Q20 3, 24 10 Q28 17, 32 10'
  const wave2b = 'M0 10 Q4 17, 8 10 Q12 3, 16 10 Q20 17, 24 10 Q28 3, 32 10'
  const wave3a = 'M0 10 Q4 6, 8 10 Q12 14, 16 10 Q20 6, 24 10 Q28 14, 32 10'
  const wave3b = 'M0 10 Q4 14, 8 10 Q12 6, 16 10 Q20 14, 24 10 Q28 6, 32 10'

  return (
    <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
      <path
        d={active ? wave1a : flat}
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: active ? 'waveWhite 900ms ease-in-out infinite alternate' : 'none',
          transition: 'd 0.4s ease',
        }}
      />
      <path
        d={active ? wave2a : flat}
        stroke="rgba(212,175,55,0.5)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: active ? 'waveGold 1150ms ease-in-out infinite alternate' : 'none',
          transition: 'd 0.4s ease',
        }}
      />
      <path
        d={active ? wave3a : flat}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="0.95"
        fill="none"
        strokeLinecap="round"
        style={{
          animation: active ? 'waveGhost 740ms ease-in-out infinite alternate' : 'none',
          transition: 'd 0.4s ease',
        }}
      />
      <style>{`
        @keyframes waveWhite {
          0% { d: path("${wave1a}"); }
          100% { d: path("${wave1b}"); }
        }
        @keyframes waveGold {
          0% { d: path("${wave2a}"); }
          100% { d: path("${wave2b}"); }
        }
        @keyframes waveGhost {
          0% { d: path("${wave3a}"); }
          100% { d: path("${wave3b}"); }
        }
      `}</style>
    </svg>
  )
}

function TopNav() {
  const openAbout = useTopNavStore((s) => s.openAbout)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [soundReady, setSoundReady] = useState(true)
  const audioRef = useRef(null)

  const handleNavClick = (id) => {
    if (id === 'about') openAbout()
  }

  const syncPlayingFromAudio = useCallback(() => {
    const a = audioRef.current
    if (!a) {
      setSoundPlaying(false)
      return
    }
    setSoundPlaying(!a.paused)
  }, [])

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const audio = new Audio(NAV_SOUND_SRC)
    audio.loop = true
    audio.volume = 0.5
    const onError = () => {
      setSoundReady(false)
      setSoundPlaying(false)
    }
    audio.addEventListener('play', syncPlayingFromAudio)
    audio.addEventListener('playing', syncPlayingFromAudio)
    audio.addEventListener('pause', syncPlayingFromAudio)
    audio.addEventListener('ended', syncPlayingFromAudio)
    audio.addEventListener('error', onError)
    audio.__jddNavListeners = { syncPlayingFromAudio, onError }
    audioRef.current = audio
    return audio
  }, [syncPlayingFromAudio])

  const toggleSound = useCallback(() => {
    const audio = ensureAudio()
    if (!audio.paused) {
      audio.pause()
      return
    }
    audio
      .play()
      .then(() => {
        setSoundReady(true)
      })
      .catch(() => {
        setSoundReady(false)
        setSoundPlaying(false)
      })
  }, [ensureAudio])

  useEffect(
    () => () => {
      if (audioRef.current) {
        const a = audioRef.current
        const l = a.__jddNavListeners
        if (l) {
          a.removeEventListener('play', l.syncPlayingFromAudio)
          a.removeEventListener('playing', l.syncPlayingFromAudio)
          a.removeEventListener('pause', l.syncPlayingFromAudio)
          a.removeEventListener('ended', l.syncPlayingFromAudio)
          a.removeEventListener('error', l.onError)
        }
        a.pause()
        audioRef.current = null
      }
    },
    [],
  )

  return (
    <div className="top-nav" role="navigation" aria-label="Primary">
      <div className="top-nav__brand" aria-label="Jardin Du Desert">
        <img
          src="/Logo1-new.png"
          alt=""
          aria-hidden="true"
          className="top-nav__brand-mark"
        />
        <span className="top-nav__brand-name">{BRAND_NAME}</span>
      </div>
      <nav className="top-nav__items">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="top-nav__btn"
            onClick={() => handleNavClick(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className={`top-nav__sound${soundPlaying ? ' top-nav__sound--on' : ''}`}
          onClick={toggleSound}
          aria-label={soundPlaying ? 'Pause background sound' : 'Play background sound'}
          title={soundReady ? 'Toggle sound' : 'Add /audio/desert-ambience.mp3 to enable sound'}
        >
          <span className="top-nav__sound-label">SOUND</span>
          <span className="top-nav__sound-wave">
            <SineWave active={soundPlaying} />
          </span>
        </button>
      </nav>
    </div>
  )
}

export default TopNav
