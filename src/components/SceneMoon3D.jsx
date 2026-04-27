import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { useCursor, useTexture } from '@react-three/drei'
import { HoverMesh } from './DesertGlb'
import { PROTOTYPE_HOVER_MOON } from '../constants/prototypeHoverCopy'
import { getRevealT } from '../store/revealProgressStore'
import { MOON_RAMP_DURATION, MOON_RAMP_START, easeInOutCubic } from '../constants/revealTimeline'
import {
  HOVER_CELESTIAL_STACKED_FONT_SCALE,
} from '../constants/hoverUi'

const MOON_AMB_INTENSITY = 0.009
const MOON_DIR_INTENSITY = 1.18

/** Moon chip only: no fill until chip hover (grey text + white outline); hover matches other chips. */
const MOON_HOVER_CHIP_PALETTE = {
  idleBackground: 'transparent',
  idleColor: '#5a5a5a',
  hoverBackground: '#ffffff',
  hoverColor: '#030303',
  idleBorder: '1px solid #ffffff',
  hoverBorder: '1px solid #ffffff',
  idleBoxShadow: 'none',
  hoverBoxShadow: '0 0 20px rgba(255, 255, 255, 0.93)',
}

const MOON_LAYER = 1
const DIFF = '/sun/gltf_embedded_0.png'
const NOR = '/textures/moon_01_nor_gl_2k.exr'
const ROUGH = '/textures/moon_01_rough_2k.exr'
/** Lune mask: sun-lit ∩ Earth-facing — slightly brighter night limb so the moon stays legible in B&W + haze. */
const MOON_LUNE = {
  termSoft: 0.07,
  darkSideFloor: 0.06,
  litGamma: 0.52,
  litBoost: 1.12,
  sunCutoff: 0.25,
  viewCutoff: -0.66,
  /** Small silhouette-only boost so `viewEdge` does not crush the limb (keep low to avoid milky dark side) */
  viewSilPow: 2.35,
  viewSilOpen: 0.4,
}

/** Draw after SandAirFog (100_000) so haze does not flatten / veil the moon disk. */
const MOON_RENDER_ORDER = 100_001

/**
 * Textured moon (diffuse + normal + roughness; no displacement — avoids warped silhouette vs unrelated height maps).
 * Top-right of the view.
 * Uses light layer 1 so the desert sun doesn’t flatten the phase read.
 * Phase uses sun/camera lune so the lit region is a thin limb arc (not a spherical cap “spot”).
 */
export function SceneMoon3D({ onHoverSelect }) {
  const groupRef = useRef(null)
  const meshRef = useRef(null)
  const moonMatRef = useRef(null)
  const ambRef = useRef(null)
  const dirRef = useRef(null)
  const { camera, gl, raycaster } = useThree()
  const [hoverUi, setHoverUi] = useState(false)
  useCursor(hoverUi, 'pointer')
  const tmpLightPos = useMemo(() => new THREE.Vector3(), [])
  const tmpLightTarget = useMemo(() => new THREE.Vector3(), [])
  const tmpMoonWorld = useMemo(() => new THREE.Vector3(), [])

  const diffuse = useTexture(DIFF)
  const normalMap = useLoader(EXRLoader, NOR)
  const roughnessMap = useLoader(EXRLoader, ROUGH)

  useLayoutEffect(() => {
    camera.layers.enable(MOON_LAYER)
    raycaster.layers.enable(MOON_LAYER)
    return () => {
      camera.layers.disable(MOON_LAYER)
      raycaster.layers.disable(MOON_LAYER)
    }
  }, [camera, raycaster])

  useLayoutEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 4
    diffuse.anisotropy = Math.min(8, maxAniso)
    diffuse.generateMipmaps = true
    diffuse.minFilter = THREE.LinearMipmapLinearFilter
    diffuse.colorSpace = THREE.SRGBColorSpace

    for (const t of [normalMap, roughnessMap]) {
      t.colorSpace = THREE.NoColorSpace
      t.flipY = false
      t.generateMipmaps = true
      t.minFilter = THREE.LinearMipmapLinearFilter
      t.anisotropy = Math.min(8, maxAniso)
    }
  }, [diffuse, normalMap, roughnessMap, gl])

  useLayoutEffect(() => {
    if (ambRef.current) ambRef.current.layers.set(MOON_LAYER)
    if (dirRef.current) dirRef.current.layers.set(MOON_LAYER)
    if (meshRef.current) meshRef.current.layers.set(MOON_LAYER)
  }, [])

  const handleMoonCompile = useCallback((shader) => {
    shader.uniforms.uMoonLightDir = { value: new THREE.Vector3(1, 0, 0) }
    shader.uniforms.uMoonViewDir = { value: new THREE.Vector3(0, 0, 1) }
    shader.uniforms.uTermSoft = { value: MOON_LUNE.termSoft }
    shader.uniforms.uDarkSideFloor = { value: MOON_LUNE.darkSideFloor }
    shader.uniforms.uLitGamma = { value: MOON_LUNE.litGamma }
    shader.uniforms.uLitBoost = { value: MOON_LUNE.litBoost }
    shader.uniforms.uSunCutoff = { value: MOON_LUNE.sunCutoff }
    shader.uniforms.uViewCutoff = { value: MOON_LUNE.viewCutoff }
    shader.uniforms.uViewSilPow = { value: MOON_LUNE.viewSilPow }
    shader.uniforms.uViewSilOpen = { value: MOON_LUNE.viewSilOpen }

    shader.vertexShader =
      `
varying vec3 vMoonWorldNormal;
` + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
vMoonWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
    )

    shader.fragmentShader =
      `
varying vec3 vMoonWorldNormal;
uniform vec3 uMoonLightDir;
uniform vec3 uMoonViewDir;
uniform float uTermSoft;
uniform float uDarkSideFloor;
uniform float uLitGamma;
uniform float uLitBoost;
uniform float uSunCutoff;
uniform float uViewCutoff;
uniform float uViewSilPow;
uniform float uViewSilOpen;
` + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
vec3 moonN = normalize(vMoonWorldNormal);
vec3 moonL = normalize(uMoonLightDir);
vec3 moonV = normalize(uMoonViewDir);
float nl = max(dot(moonN, moonL), 0.0);
float nv = max(dot(moonN, moonV), 0.0);
float sunEdge = smoothstep(uSunCutoff, uSunCutoff + uTermSoft, nl);
float viewGate = smoothstep(uViewCutoff, uTermSoft, nv);
float sil = pow(clamp(1.0 - nv, 0.0, 1.0), uViewSilPow);
float viewOpen = clamp(uViewSilOpen * sil, 0.0, 1.0);
float viewEdge = max(viewGate, viewOpen);
float lune = sunEdge * viewEdge;
float core = pow(max(nl, 1e-4), uLitGamma);
float lit = min(1.0, lune * core * uLitBoost);
float moonMask = clamp(uDarkSideFloor + (1.0 - uDarkSideFloor) * lit, 0.0, 1.0);
gl_FragColor.rgb *= moonMask;`,
    )

    if (moonMatRef.current) {
      moonMatRef.current.userData.moonShader = shader
    }
  }, [])

  /* Default light.target sits at world origin; this moon lives on a camera-follow group, so the
   * sun must aim at the sphere center or the lit crescent is shaded from the wrong side (reads black). */
  useLayoutEffect(() => {
    const g = groupRef.current
    const light = dirRef.current
    if (!g || !light) return
    g.add(light.target)
    light.target.position.set(0, 0, 0)
  }, [])

  /* Camera space: +X right, +Y up — nudged upper-right vs prior framing. */
  const offsetLocal = useMemo(() => new THREE.Vector3(45.1, 22.45, -1.38), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    q.copy(camera.quaternion)
    v.copy(offsetLocal).applyQuaternion(q)
    g.position.copy(camera.position).add(v)
    g.quaternion.identity()

    const tr = getRevealT()
    const revealU = Math.max(0, Math.min(1, (tr - MOON_RAMP_START) / MOON_RAMP_DURATION))
    const e = easeInOutCubic(revealU)
    if (ambRef.current) ambRef.current.intensity = MOON_AMB_INTENSITY * e
    if (dirRef.current) dirRef.current.intensity = MOON_DIR_INTENSITY * e

    const moonLight = dirRef.current
    const moonMat = moonMatRef.current
    const moonShader = moonMat?.userData?.moonShader
    const su = moonShader?.uniforms
    if (g && su?.uMoonViewDir) {
      g.getWorldPosition(tmpMoonWorld)
      su.uMoonViewDir.value.copy(camera.position).sub(tmpMoonWorld).normalize()
    }
    if (moonLight && su?.uMoonLightDir) {
      moonLight.getWorldPosition(tmpLightPos)
      moonLight.target.getWorldPosition(tmpLightTarget)
      su.uMoonLightDir.value.copy(tmpLightPos).sub(tmpLightTarget).normalize()
    }
  })

  return (
    <group ref={groupRef} renderOrder={MOON_RENDER_ORDER}>
      <ambientLight ref={ambRef} intensity={0} color="#e8e8f0" />
      <directionalLight
        ref={dirRef}
        /* Nudged +X vs −4.9 so the night side dominates more on the left; slightly tighter lune in MOON_LUNE. */
        position={[-1.15, 0.06, -2.12]}
        intensity={0}
        color="#fff8f2"
      />
      <HoverMesh
        label={PROTOTYPE_HOVER_MOON.realm}
        chipStyle="stacked"
        chipPalette={MOON_HOVER_CHIP_PALETTE}
        screenSizeMode="fixed"
        /* Negative Y: chip sits below the disk so it doesn’t cover the moon */
        htmlPosition={[-2.62, -0.12, 0]}
        stackedMaxWidth={282}
        stackedFontScale={HOVER_CELESTIAL_STACKED_FONT_SCALE}
        stackedPadding="7px 20px 8px"
        onHoverChange={setHoverUi}
        onSelect={() => onHoverSelect?.(PROTOTYPE_HOVER_MOON)}
      >
        <mesh ref={meshRef} castShadow={false} scale={3.82} renderOrder={MOON_RENDER_ORDER}>
          <sphereGeometry args={[1, 96, 96]} />
          <meshStandardMaterial
            key={`moon-mat-${MOON_LUNE.sunCutoff}-${MOON_LUNE.termSoft}-${MOON_LUNE.viewCutoff}-${MOON_LUNE.viewSilOpen}`}
            ref={moonMatRef}
            map={diffuse}
            normalMap={normalMap}
            normalScale={[0.65, 0.65]}
            roughnessMap={roughnessMap}
            roughness={1}
            metalness={0}
            envMapIntensity={0.11}
            emissive="#181a22"
            emissiveIntensity={0.03}
            toneMapped
            onBeforeCompile={handleMoonCompile}
          />
        </mesh>
      </HoverMesh>
    </group>
  )
}
