import { useEffect } from 'react'
import { preloadCactusLoadingVideo } from './utils/cactusLoadingVideo'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import './index.css'
import FrameTop from './components/FrameTop'
import FrameBottom from './components/FrameBottom'
import ScreenEntry from './components/ScreenEntry'
import ScreenRealms from './components/ScreenRealms'
import ScreenStates from './components/ScreenStates'
import ScreenForm from './components/ScreenForm'
import ScreenSubmitted from './components/ScreenSubmitted'
// import ScreenLogoDrawTest from './components/ScreenLogoDrawTest'
import StateModal from './components/StateModal'
import AboutModalNew from './components/AboutModalNew'
import DesertViewNew from './components/DesertViewNew'
import { useAppStore } from './store/useAppStore'
import { useSoundStore } from './store/useSoundStore'
import { useDesertAudio } from './hooks/useDesertAudio'

/** Main shell: zustand screens + modals (fullscreen desert uses same route as `/desert-test`). */
function MainApp() {
  const screen = useAppStore((s) => s.screen)
  const closeStateModal = useAppStore((s) => s.closeStateModal)
  const setAboutOpen = useAppStore((s) => s.setAboutOpen)
  const aboutOpen = useAppStore((s) => s.aboutOpen)
  const setPlaying = useSoundStore((s) => s.setPlaying)

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

  if (screen === 'desert') {
    return <DesertViewNew />
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
        {/* {screen === 'logo-test' && <ScreenLogoDrawTest />} */}
      </main>
      <FrameBottom />

      <StateModal />
      <AboutModalNew />
    </div>
  )
}

function App() {
  // Mount the audio element for the lifetime of the app
  useDesertAudio()

  useEffect(() => {
    preloadCactusLoadingVideo()
  }, [])

  return (
    <Routes>
      <Route path="/desert-test" element={<DesertViewNew />} />
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}

export default App
