// App.jsx
import { Suspense, useState } from 'react'
import './App.css'
import DesertScene from './components/DesertScene'
import Loader from './components/sidecode/Loader'

function App() {
  const [started, setStarted] = useState(false)

  return (
    <>
     
        <DesertScene />
    

      {!started && <Loader onStart={() => setStarted(true)} />}
    </>
  )
}

export default App