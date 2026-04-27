import { useEffect, useRef } from 'react'
import { useSoundStore } from '../store/useSoundStore'

const TRACK = '/sound/dragon-studio-desert-sand-rustling-482891.mp3'

/**
 * Manages a single HTMLAudioElement for the desert ambient track.
 * Syncs play/pause to the `playing` flag in useSoundStore.
 * Call this once at the app root or inside DesertView.
 */
export function useDesertAudio() {
  const playing = useSoundStore((s) => s.playing)
  const audioRef = useRef(null)

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio(TRACK)
    audio.loop = true
    audio.volume = 0.55
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  // Sync play/pause to store state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      // play() returns a Promise — swallow AbortError from rapid toggles
      audio.play().catch((err) => {
        if (err.name !== 'AbortError') console.warn('Audio play error:', err)
      })
    } else {
      audio.pause()
    }
  }, [playing])
}
