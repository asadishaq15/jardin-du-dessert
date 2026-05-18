import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import {
  DESERT_QUALITY_TIER,
  getDesertQualityRendererSettings,
} from '../utils/desertQualityTier'
import {
  EffectComposer,
  HueSaturation,
  BrightnessContrast,
  Bloom,
  Vignette,
} from '@react-three/postprocessing'
import { DesertGlbNew } from './DesertGlbNew'
import { DesertDustGlb } from './DesertDustGlb'
import { RevealLabel3D } from './RevealLabel3D'
import { DESERT_NEW_PATH_PHASES } from '../constants/revealTimeline'

/**
 * Strong directional sun from upper-right → casts deep shadows into dune hollows.
 * This is the primary source of shape/depth — all fills stay intentionally low.
 */
function DirectionalSun({ shadowMapSize, normalBias }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const L = ref.current
    if (!L) return
    L.target.position.set(0, 0, 0)
    L.target.updateMatrixWorld()
    L.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    L.shadow.bias = -0.0002
    L.shadow.normalBias = normalBias
    const cam = L.shadow.camera
    cam.near = 1
    cam.far = 600
    cam.left = -120
    cam.right = 120
    cam.top = 120
    cam.bottom = -120
    cam.updateProjectionMatrix()
  }, [shadowMapSize, normalBias])

  return (
    <directionalLight
      ref={ref}
      /* Upper-right position matching the target reference */
      position={[80, 22, -40]}
      intensity={2.45}
      color="#f5f5ef"
      castShadow
      shadow-mapSize={[shadowMapSize, shadowMapSize]}
      shadow-bias={-0.0002}
      shadow-normalBias={normalBias}
      shadow-camera-near={1}
      shadow-camera-far={600}
      shadow-camera-left={-120}
      shadow-camera-right={120}
      shadow-camera-top={120}
      shadow-camera-bottom={-120}
    />
  )
}

const stripRealmSuffix = (label) => label.replace(/\s*realm\s*$/i, '')

export default function DesertSceneNew({
  qualityTier = DESERT_QUALITY_TIER.HIGH,
  touchParallax = false,
  sceneRevealed = false,
}) {
  const settings = useMemo(() => getDesertQualityRendererSettings(qualityTier), [qualityTier])
  const normalBias = settings.directionalNormalBiasTight ? 0.004 : 0.006

  return (
    <div
      className={`desert-scene-shell${sceneRevealed ? '' : ' desert-scene-shell--loading'}`}
    >
      <Canvas
        key={qualityTier}
        shadows
        dpr={settings.dpr}
        style={{
          height: '100dvh',
          minHeight: '100vh',
          width: '100dvw',
          minWidth: '100vw',
          display: 'block',
          background: '#a8b4c0',
          pointerEvents: sceneRevealed ? 'auto' : 'none',
        }}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: settings.antialias,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#a8b4c0', 1)
          gl.toneMappingExposure = 0.62
          gl.shadowMap.type = settings.softShadow
            ? THREE.PCFSoftShadowMap
            : THREE.PCFShadowMap
        }}
      >
        {/* Fallback colour while HDR loads */}
        <color attach="background" args={['#a8b4c0']} />

        {/* Controlled daytime fill — keep sun as dominant light source */}
        <ambientLight intensity={0.075} color="#d4d8e0" />
        <hemisphereLight color="#dde4f0" groundColor="#a89070" intensity={0.095} />
        <DirectionalSun shadowMapSize={settings.shadowMapSize} normalBias={normalBias} />

        <Suspense fallback={null}>
          {/*
            mud_road_puresky_2k.hdr is a real sky panorama — safe as background.
            The sand EXR must NOT be used as background (aerial photo = white blowout).
          */}
          <Environment
            files="/mud_road_puresky_2k.hdr"
            background
            backgroundBlurriness={0.04}
            backgroundIntensity={2.1}
            environmentIntensity={0.2}
          />
          <DesertGlbNew touchParallax={touchParallax} />
          <DesertDustGlb started={sceneRevealed} qualityTier={qualityTier} />

          {/* Path windows stay Mind→Body→Heart→Spirit→Soul; copy cross-wire keeps Spirit text last (Soul window). */}
          <RevealLabel3D
            phase={DESERT_NEW_PATH_PHASES.mind}
            text={stripRealmSuffix(DESERT_NEW_PATH_PHASES.body.label)}
            cameraOffset={[0, 0, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={DESERT_NEW_PATH_PHASES.body}
            text={stripRealmSuffix(DESERT_NEW_PATH_PHASES.mind.label)}
            cameraOffset={[0, 0, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={DESERT_NEW_PATH_PHASES.heart}
            text={stripRealmSuffix(DESERT_NEW_PATH_PHASES.heart.label)}
            cameraOffset={[0, 0, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={DESERT_NEW_PATH_PHASES.spirit}
            text={stripRealmSuffix(DESERT_NEW_PATH_PHASES.soul.label)}
            cameraOffset={[0, 0, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={DESERT_NEW_PATH_PHASES.soul}
            text={stripRealmSuffix(DESERT_NEW_PATH_PHASES.spirit.label)}
            cameraOffset={[0, 0, -12]}
            fontSize={0.62}
          />

        </Suspense>

        <EffectComposer multisampling={0}>
          {/* Full grayscale */}
          <HueSaturation saturation={-1} />
          {/*
            Slight brightness pull-down + higher contrast to push shadows deep
            and preserve bright dune ridges — matching the reference look.
          */}
          <BrightnessContrast brightness={-0.04} contrast={0.34} />
          {/*
            Low-threshold bloom gives a soft glow on the brightest dune highlights
            mimicking the sun glare in the reference image.
          */}
          <Bloom
            intensity={0.54}
            luminanceThreshold={0.56}
            luminanceSmoothing={0.32}
            mipmapBlur
          />
          {/* Subtle vignette keeps the eye centered on the dunes */}
          <Vignette eskil={false} offset={0.36} darkness={0.44} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
