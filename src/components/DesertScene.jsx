import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Environment } from '@react-three/drei'
import { DesertGlb } from './DesertGlb'
import { SceneMoon3D } from './SceneMoon3D'
import { SceneSun3D, SUN_LAYER } from './SceneSun3D'
import { SandAirFog } from './SandAirFog'
import { DesertWindStreak } from './DesertWindStreak'
import * as THREE from 'three'
import {
  EffectComposer,
  HueSaturation,
  BrightnessContrast,
  SelectiveBloom,
} from '@react-three/postprocessing'
import { getRevealT, setRevealT } from '../store/revealProgressStore'
import { useAssetReadyStore } from '../store/useAssetReadyStore'
import { useRevealUiStore } from '../store/useRevealUiStore'
import { useTopNavStore } from '../store/useTopNavStore'
import CatalogOverlay from './CatalogOverlay'
import {
  HORIZON_REVEAL_T,
  MOON_RAMP_DURATION,
  MOON_RAMP_START,
  REVEAL_DURATION_SEC,
  REVEAL_MAX_DELTA_SEC,
  REVEAL_PHASES,
  REVEAL_T_SMOOTH_LAMBDA,
  SUN_RAMP_DURATION,
  SUN_RAMP_START,
  easeInOutCubic,
} from '../constants/revealTimeline'
import { PROTOTYPE_HOVER_HORIZON } from '../constants/prototypeHoverCopy'
import { RevealLabel3D } from './RevealLabel3D'

/** Single useFrame: advances `t` then camera — guarantees store is current before other useFrames read `t`. */
function RevealAndCamera({ started }) {
  const { camera } = useThree()
  const acc = useRef(0)
  const smoothT = useRef(0)

  /* Negative priority runs before default 0 so `t` is updated before DesertGlb useFrames read it. */
  useFrame(
    (_, delta) => {
      /* About page freezes reveal in place — preserve `t` so the user resumes from the same spot on CLOSE. */
      if (useTopNavStore.getState().aboutOpen) return
      if (!started) {
        acc.current = 0
        smoothT.current = 0
        setRevealT(0)
        camera.position.z = 7
        return
      }
      const dt = Math.min(delta, REVEAL_MAX_DELTA_SEC)
      acc.current = Math.min(acc.current + dt / REVEAL_DURATION_SEC, 1)
      const rawT = easeInOutCubic(acc.current)
      /* One smoothed `t` for camera + store — eases motion when palms/oasis spikes frame time. */
      let t = THREE.MathUtils.damp(smoothT.current, rawT, REVEAL_T_SMOOTH_LAMBDA, dt)
      if (rawT >= 0.999) t = rawT
      smoothT.current = t
      setRevealT(t)
      camera.position.z = 7 + t * 3
    },
    -1000,
  )

  return null
}

/** Width of the soft "lift-off" smoothstep that prevents the bloom + disk from popping at scale 0. */
const CELESTIAL_SCALE_ENVELOPE_PADDING = 0.038

/**
 * Per-body scale-in envelope used by sun (Spirit) and moon (Soul). Receives its own ramp
 * so the celestial pair is no longer fused — each disk reveals after its phase's label.
 */
function CelestialRevealEnvelope({ started, rampStart, rampDuration, children }) {
  const ref = useRef(null)
  const envelopeEnd = rampStart + CELESTIAL_SCALE_ENVELOPE_PADDING

  useFrame(() => {
    const g = ref.current
    if (!g) return
    if (!started) {
      g.visible = false
      g.scale.setScalar(1)
      return
    }
    const t = getRevealT()
    const u = Math.max(0, Math.min(1, (t - rampStart) / rampDuration))
    const e = easeInOutCubic(u)
    g.visible = t >= rampStart
    const envelope = THREE.MathUtils.smoothstep(rampStart, envelopeEnd, t)
    const core = 0.86 + 0.14 * e
    /* Floor avoids 0-scale at t===start; smoothstep softens bloom/size pop on first frames. */
    g.scale.setScalar(core * Math.max(0.12, envelope))
  })

  return <group ref={ref}>{children}</group>
}

/** Sets horizon UI visibility in Zustand when reveal `t` reaches HORIZON_REVEAL_T (end of sequence). */
function HorizonReadyBridge({ started }) {
  const setHorizonHotspotVisible = useRevealUiStore((s) => s.setHorizonHotspotVisible)
  const prev = useRef(false)

  useFrame(() => {
    if (!started) {
      if (prev.current) {
        setHorizonHotspotVisible(false)
        prev.current = false
      }
      return
    }
    const t = getRevealT()
    const next = t >= HORIZON_REVEAL_T
    if (next !== prev.current) {
      setHorizonHotspotVisible(next)
      prev.current = next
    }
  })

  return null
}

/** Last child inside Suspense: runs only after Environment, GLB, celestial bodies, fog have loaded. */
function SceneReadyBridge() {
  const setSceneAssetsReady = useAssetReadyStore((s) => s.setSceneAssetsReady)

  useEffect(() => {
    setSceneAssetsReady(true)
    return () => setSceneAssetsReady(false)
  }, [setSceneAssetsReady])

  return null
}

const SHADOW_MAP_FULL = 4096
const stripRealmSuffix = (label) => label.replace(/\s*realm\s*$/i, '')

/** Key light from upper-left (+X ray dir) so shadows fall to the right of cacti/bushes, matching the sun disk on the left. */
function DirectionalSun() {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const L = ref.current
    if (!L) return
    /* Farther source + lower sun = stronger shadow angle; target nudged so rays still cross the dunes. */
    L.target.position.set(28, -5.5, 9)
    L.target.updateMatrixWorld()
    /* Ensure shadow frustum + bias (kebab props on lights are easy to mis-apply). */
    L.shadow.mapSize.set(SHADOW_MAP_FULL, SHADOW_MAP_FULL)
    L.shadow.bias = -0.00028
    L.shadow.normalBias = 0.006
    const cam = L.shadow.camera
    cam.near = 0.5
    cam.far = 420
    cam.left = -120
    cam.right = 120
    cam.top = 120
    cam.bottom = -120
    cam.updateProjectionMatrix()
  })

  return (
    <directionalLight
      ref={ref}
      position={[-98, 11, 56]}
      intensity={5.35}
      color="#ffffff"
      castShadow
      shadow-mapSize={[SHADOW_MAP_FULL, SHADOW_MAP_FULL]}
      shadow-bias={-0.00028}
      shadow-normalBias={0.006}
      shadow-camera-near={0.5}
      shadow-camera-far={420}
      shadow-camera-left={-120}
      shadow-camera-right={120}
      shadow-camera-top={120}
      shadow-camera-bottom={-120}
    />
  )
}

/** Top horizon hit zone: opens shared realm modal on click. Hover chip UI disabled (was onMouseEnter / showChip / chipHover). */
function HorizonHotspot({ onHorizonClick, onSelect }) {
  return (
    <button
      type="button"
      className="viewport-horizon-hit viewport-horizon-hit--reveal"
      onClick={(e) => {
        e.stopPropagation()
        onSelect?.(PROTOTYPE_HOVER_HORIZON)
        onHorizonClick?.(e)
      }}
      aria-label="Horizon"
    >
      <span className="viewport-horizon-line" aria-hidden="true" />
    </button>
  )
}

const DesertScene = ({ onHorizonClick, started = false, scenePointerEvents = true }) => {
  const horizonHotspotVisible = useRevealUiStore((s) => s.horizonHotspotVisible)
  const aboutOpen = useTopNavStore((s) => s.aboutOpen)
  const [activeCatalogTarget, setActiveCatalogTarget] = useState(null)
  const openCatalogOverlay = (target) => setActiveCatalogTarget(target)
  const closeCatalogOverlay = () => setActiveCatalogTarget(null)
  const sunBloomAmbientRef = useRef(null)
  const sunBloomKeyRef = useRef(null)

  useLayoutEffect(() => {
    const a = sunBloomAmbientRef.current
    const d = sunBloomKeyRef.current
    if (a) a.layers.set(SUN_LAYER)
    if (d) d.layers.set(SUN_LAYER)
  }, [])

  return (
    <div className={`desert-scene-shell${aboutOpen ? ' desert-scene-shell--hidden' : ''}`}>
      {horizonHotspotVisible && !aboutOpen && (
        <HorizonHotspot onHorizonClick={onHorizonClick} onSelect={openCatalogOverlay} />
      )}
      <Canvas
        shadows
        style={{
          height: '100vh',
          width: '100%',
          display: 'block',
          background: '#050505',
          pointerEvents: scenePointerEvents ? 'auto' : 'none',
        }}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050505', 1)
          gl.toneMappingExposure = 1.05
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        {/* Solid bg until HDR Environment loads (Suspense) — prevents bright clear flash */}
        <color attach="background" args={['#050505']} />
        <RevealAndCamera started={started} />
        <HorizonReadyBridge started={started} />
        <ambientLight intensity={0.048} color="#e6e6e6" />
        <hemisphereLight
          color="#e4e4ec"
          groundColor="#3a3a44"
          intensity={0.09}
        />

        {/* Dedicated lights for selective sun bloom — isolated to SUN_LAYER so main lighting is unchanged */}
        <ambientLight ref={sunBloomAmbientRef} intensity={0.35} color="#fff4e6" />
        <directionalLight ref={sunBloomKeyRef} position={[-40, 18, 24]} intensity={2.2} color="#fff7ee" />

        <DirectionalSun />

        <Suspense fallback={null}>
          <Environment
            files="/mud_road_puresky_2k.hdr"
            background
            environmentIntensity={0.27}
          />
          <DesertGlb
            castShadow
            receiveShadow
            showFoliage={started}
            onHoverSelect={openCatalogOverlay}
          />
          {/* COMMENTED OUT: Sun and Moon objects removed from ModelBeta.glb
          <CelestialRevealEnvelope
            started={started}
            rampStart={SUN_RAMP_START}
            rampDuration={SUN_RAMP_DURATION}
          >
            <SceneSun3D onHoverSelect={openCatalogOverlay} />
          </CelestialRevealEnvelope>
          <CelestialRevealEnvelope
            started={started}
            rampStart={MOON_RAMP_START}
            rampDuration={MOON_RAMP_DURATION}
          >
            <SceneMoon3D onHoverSelect={openCatalogOverlay} />
          </CelestialRevealEnvelope>
          */}
          {/* All 5 realm labels — camera-attached, each at a unique viewport position */}
          <RevealLabel3D
            phase={REVEAL_PHASES.mind}
            text={stripRealmSuffix(REVEAL_PHASES.mind.label)}
            cameraOffset={[-2.8, 1.2, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={REVEAL_PHASES.body}
            text={stripRealmSuffix(REVEAL_PHASES.body.label)}
            cameraOffset={[2.6, -0.6, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={REVEAL_PHASES.heart}
            text={stripRealmSuffix(REVEAL_PHASES.heart.label)}
            cameraOffset={[0, 0.3, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={REVEAL_PHASES.spirit}
            text={stripRealmSuffix(REVEAL_PHASES.spirit.label)}
            cameraOffset={[3.0, 1.4, -12]}
            fontSize={0.62}
          />
          <RevealLabel3D
            phase={REVEAL_PHASES.soul}
            text={stripRealmSuffix(REVEAL_PHASES.soul.label)}
            cameraOffset={[-2.4, -0.4, -12]}
            fontSize={0.62}
          />
          {/* Airborne dust haze: camera-attached billboards filling the full frustum */}
          <SandAirFog
            started={started}
            cameraAttached
            prominent={0.62}
            debug={import.meta.env.DEV}
          />
          {/* Ground-level sand wind: instanced puffs drifting left→right near the terrain */}
          <DesertWindStreak started={started} />
          <SceneReadyBridge />
        </Suspense>

        <EffectComposer multisampling={0}>
          <HueSaturation saturation={-1} />
          <BrightnessContrast brightness={-0.03} contrast={0.17} />
          <SelectiveBloom
            lights={[sunBloomAmbientRef, sunBloomKeyRef]}
            selectionLayer={SUN_LAYER}
            luminanceThreshold={0.22}
            luminanceSmoothing={0.45}
            intensity={1.35}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
      {activeCatalogTarget && !aboutOpen && (
        <CatalogOverlay target={activeCatalogTarget} onClose={closeCatalogOverlay} />
      )}
    </div>
  )
}

export default DesertScene
