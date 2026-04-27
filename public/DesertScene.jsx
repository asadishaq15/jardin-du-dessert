import { Canvas } from '@react-three/fiber'
import React from 'react'
import { DesertWind } from './sidecode/DersertWind'
import { Environment, OrbitControls } from '@react-three/drei'
import { DesertGlb } from './DesertGlb'

const DesertScene = () => {
  return (
  <Canvas
        style={{ height: '100vh' }}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <OrbitControls/>
        <DesertWind/>
        <Environment preset='city' background={false}/>
   <DesertGlb/>
    </Canvas>
  )
}

export default DesertScene
