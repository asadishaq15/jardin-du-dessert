import { useEffect } from 'react'
import './App.css'
import './index.css'
import FrameTop from './components/FrameTop'
import FrameBottom from './components/FrameBottom'
import ScreenEntry from './components/ScreenEntry'
import ScreenRealms from './components/ScreenRealms'
import ScreenStates from './components/ScreenStates'
import ScreenForm from './components/ScreenForm'
import ScreenSubmitted from './components/ScreenSubmitted'
import StateModal from './components/StateModal'
import AboutModalNew from './components/AboutModalNew'
import DesertView from './components/DesertView'
import { useAppStore } from './store/useAppStore'
import { useSoundStore } from './store/useSoundStore'
import { useDesertAudio } from './hooks/useDesertAudio'

function App() {
  const screen = useAppStore((s) => s.screen)
  const closeStateModal = useAppStore((s) => s.closeStateModal)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)
  const aboutOpen = useAppStore((s) => s.aboutOpen)
  const setPlaying = useSoundStore((s) => s.setPlaying)

  // Mount the audio element for the lifetime of the app
  useDesertAudio()

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen])

  // Ensure ambient audio stops whenever user leaves desert view.
  useEffect(() => {
    if (screen !== 'desert') {
      setPlaying(false)
    }
  }, [screen, setPlaying])

  // Escape key closes modals
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeStateModal()
        setAboutOpen(false)
        if (screen === 'desert') {
          useAppStore.getState().setScreen('entry')
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [screen, closeStateModal, setAboutOpen, setPlaying])

  // Desert view is a fullscreen overlay — render separately
  if (screen === 'desert') {
    return <DesertView />
  }

  return (
    <div className="app">
      <FrameTop />
      <main className="app-main">
        {screen === 'entry' && <ScreenEntry />}
        {screen === 'realms' && <ScreenRealms />}
        {screen === 'states' && <ScreenStates />}
        {screen === 'form' && <ScreenForm />}
        {screen === 'submitted' && <ScreenSubmitted />}
      </main>
      <FrameBottom />

      <StateModal />
      <AboutModalNew />
    </div>
  )
}

export default App
