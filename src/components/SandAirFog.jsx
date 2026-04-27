import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { getRevealT } from '../store/revealProgressStore'
import { FOG_RAMP_DURATION, FOG_RAMP_START, easeInOutCubic } from '../constants/revealTimeline'

/** Draw after terrain, celestials, and typical transparents so dust composites on top. */
const DUST_RENDER_ORDER = 100_000

/**
 * Airborne dust / haze: camera-facing billboards, depthTest off, very high renderOrder.
 * Default `cameraAttached` parents dust to the camera so it always fills the frustum and sits above the scene stack.
 */
const vert = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uDrift;
  uniform float uOpacity;
  uniform float uOpacityScale;
  uniform float uStretch;
  uniform float uSeed;
  uniform vec3 uCameraPos;
  uniform float uFogReveal;
  uniform float uFlowSign;
  uniform vec3 uDustColor;
  uniform float uSkyBandLow;
  uniform float uSkyBandHigh;
  uniform float uSkyBandFloor;
  /* > 0 raises minimum alpha so haze is unmistakable (debug / art tuning). */
  uniform float uProminent;

  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    float f = 1.0;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p * f);
      f *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 w = vWorldPos.xz * uStretch;

    float drift = uTime * uDrift + uSeed;
    float fx = -drift * uFlowSign;
    vec2 uva = w * vec2(1.0, 0.55) + vec2(fx, drift * 0.15);
    vec2 uvb = w * vec2(1.65, 0.9) + vec2(fx * 0.82, -drift * 0.11);
    vec2 uvc = w * vec2(0.45, 0.35) + vec2(fx * 0.4, drift * 0.22);

    float n1 = fbm(uva);
    float n2 = fbm(uvb + vec2(n1 * 0.4, 0.0));
    float n3 = fbm(uvc);
    float n = clamp(n1 * 0.5 + n2 * 0.35 + n3 * 0.22, 0.0, 1.0);

    float patch = smoothstep(0.1, 0.9, n);
    float wisp = smoothstep(0.04, 0.74, n2 * n3 + n * 0.38);
    float a = patch * wisp * uOpacity * uOpacityScale * uFogReveal;

    float edge = smoothstep(0.0, 0.36, n1) * smoothstep(1.0, 0.56, n2);
    a *= mix(0.68, 1.0, edge);

    float xz = distance(vWorldPos.xz, uCameraPos.xz);
    a *= mix(0.78, 1.0, smoothstep(1.5, 40.0, xz));

    float skyBand = smoothstep(uSkyBandLow, uSkyBandHigh, vWorldPos.y - uCameraPos.y);
    a *= mix(1.0, uSkyBandFloor, skyBand);

    if (uProminent > 0.001) {
      float visFloor = uProminent * 0.42 * uFogReveal * uOpacityScale;
      a = max(a, visFloor);
    }

    float discardEps = uProminent > 0.001 ? 0.0004 : 0.0018;
    if (a < discardEps) discard;

    gl_FragColor = vec4(uDustColor, a);
  }
`

/** World-space layers (used when cameraAttached=false, with DesertScene offset group). */
const LAYERS_WORLD = [
  { position: [-12, 2.2, -8], width: 82, height: 32, opacity: 0.88, drift: 0.028, stretch: 0.048, seed: 0.0 },
  { position: [16, 3.4, -2], width: 88, height: 36, opacity: 0.78, drift: 0.024, stretch: 0.044, seed: 3.1 },
  { position: [-6, 2.8, -18], width: 96, height: 38, opacity: 0.72, drift: 0.021, stretch: 0.039, seed: 6.4 },
  { position: [10, 4.0, 6], width: 76, height: 30, opacity: 0.64, drift: 0.026, stretch: 0.046, seed: 9.2 },
  { position: [4, 1.8, -12], width: 72, height: 28, opacity: 0.58, drift: 0.023, stretch: 0.052, seed: 1.7 },
  { position: [-2, 5.8, -14], width: 92, height: 26, opacity: 0.42, drift: 0.019, stretch: 0.036, seed: 12.4 },
]

/**
 * Camera-local space: -Z is view direction. Large quads bracket the frustum so dust reads over the whole frame.
 */
const LAYERS_CAMERA = [
  { position: [0, 0.35, -5], width: 140, height: 85, opacity: 0.95, drift: 0.03, stretch: 0.042, seed: 0.0 },
  { position: [4, -0.2, -11], width: 150, height: 92, opacity: 0.88, drift: 0.026, stretch: 0.038, seed: 2.9 },
  { position: [-5, 0.15, -17], width: 155, height: 95, opacity: 0.82, drift: 0.023, stretch: 0.035, seed: 5.7 },
  { position: [0, -0.45, -24], width: 165, height: 100, opacity: 0.74, drift: 0.021, stretch: 0.032, seed: 8.1 },
  { position: [6, 0.5, -30], width: 170, height: 102, opacity: 0.66, drift: 0.019, stretch: 0.03, seed: 1.2 },
  { position: [-3, 0.8, -38], width: 175, height: 105, opacity: 0.52, drift: 0.017, stretch: 0.028, seed: 11.5 },
]

function FogBillboard({
  position,
  width,
  height,
  drift,
  stretch,
  seed,
  opacity,
  uTime,
  uCameraPos,
  uFogReveal,
  uFlowSign,
  uDustColor,
  uOpacityScale,
  uSkyBandLow,
  uSkyBandHigh,
  uSkyBandFloor,
  uProminent,
  logShaderReady,
}) {
  const meshRef = useRef(null)

  const uniforms = useMemo(
    () => ({
      uTime,
      uCameraPos,
      uDrift: { value: drift },
      uOpacity: { value: opacity },
      uOpacityScale,
      uStretch: { value: stretch },
      uSeed: { value: seed },
      uFogReveal,
      uFlowSign,
      uDustColor,
      uSkyBandLow,
      uSkyBandHigh,
      uSkyBandFloor,
      uProminent,
    }),
    [
      uTime,
      uCameraPos,
      drift,
      opacity,
      stretch,
      seed,
      uFogReveal,
      uFlowSign,
      uDustColor,
      uOpacityScale,
      uSkyBandLow,
      uSkyBandHigh,
      uSkyBandFloor,
      uProminent,
    ],
  )

  useLayoutEffect(() => {
    const m = meshRef.current
    if (!m) return
    /* Never steal raycasts from terrain / celestials — dust is view-only. */
    m.raycast = () => {}
    m.frustumCulled = false
    m.renderOrder = DUST_RENDER_ORDER
  }, [])

  useEffect(() => {
    if (!logShaderReady) return
    const id = requestAnimationFrame(() => {
      const mat = meshRef.current?.material
      if (!mat?.isShaderMaterial) {
        console.warn('[SandAirFog] expected ShaderMaterial on dust mesh', mat?.type)
        return
      }
      const keys = Object.keys(mat.uniforms || {})
      console.log('[SandAirFog] ShaderMaterial linked', { uniformKeys: keys, program: !!mat.program })
    })
    return () => cancelAnimationFrame(id)
  }, [logShaderReady])

  return (
    <Billboard position={position} follow>
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height, 1, 1]} />
        <shaderMaterial
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Billboard>
  )
}

/**
 * @param {boolean} started
 * @param {boolean} [cameraAttached=true] Parent rig follows camera — dust fills the view and draws on top
 * @param {number} [flowSpeed=1.18]
 * @param {number} [flowSign=-1] -1 = dominant wind left→right vs legacy +1
 * @param {THREE.ColorRepresentation} [dustColor='#b8babf']
 * @param {number} [opacityScale=1.22]
 * @param {number} [fogRevealFloor=0.45] Minimum reveal multiplier while `started` so haze never fully vanishes mid-sequence
 * @param {number} [prominent=0.72] Shader visibility floor scale (0 = off). Higher = thicker unmistakable haze.
 * @param {boolean} [debug=false] Throttled `console.log` for reveal / uniforms / rig (set true to diagnose).
 */
export function SandAirFog({
  started = false,
  cameraAttached = true,
  flowSpeed = 1.18,
  flowSign = -1,
  dustColor = '#b8babf',
  opacityScale = 1.22,
  fogRevealFloor = 0.45,
  skyBandLow = 0.35,
  skyBandHigh = 22.0,
  skyBandFloor = 0.55,
  prominent = 0.72,
  debug = false,
}) {
  const timeUniform = useMemo(() => ({ value: 0 }), [])
  const cameraPos = useMemo(() => ({ value: new THREE.Vector3() }), [])
  const fogRevealUniform = useMemo(() => ({ value: 1 }), [])
  const uFlowSign = useMemo(() => ({ value: flowSign }), [flowSign])
  const uDustColor = useMemo(() => ({ value: new THREE.Color(dustColor) }), [dustColor])
  const uOpacityScale = useMemo(() => ({ value: opacityScale }), [opacityScale])
  const uSkyBandLow = useMemo(() => ({ value: skyBandLow }), [skyBandLow])
  const uSkyBandHigh = useMemo(() => ({ value: skyBandHigh }), [skyBandHigh])
  const uSkyBandFloor = useMemo(() => ({ value: skyBandFloor }), [skyBandFloor])
  const uProminent = useMemo(() => ({ value: prominent }), [prominent])
  const rigRef = useRef(null)
  const debugLogAcc = useRef(0)
  const debugLastStarted = useRef(null)

  const layers = cameraAttached ? LAYERS_CAMERA : LAYERS_WORLD

  useEffect(() => {
    if (!debug) return
    console.log('[SandAirFog] mount', {
      cameraAttached,
      layerCount: layers.length,
      prominent,
      FOG_RAMP_START,
      FOG_RAMP_DURATION,
    })
    return () => {
      if (debug) console.log('[SandAirFog] unmount')
    }
  }, [debug, cameraAttached, layers.length, prominent])

  useEffect(() => {
    if (!debug) return
    if (debugLastStarted.current === started) return
    debugLastStarted.current = started
    console.log('[SandAirFog] started changed', { started })
  }, [debug, started])

  useFrame(({ clock, camera }, delta) => {
    timeUniform.value = clock.elapsedTime
    cameraPos.value.copy(camera.position)
    uDustColor.value.set(dustColor)
    uFlowSign.value = flowSign
    uOpacityScale.value = opacityScale
    uSkyBandLow.value = skyBandLow
    uSkyBandHigh.value = skyBandHigh
    uSkyBandFloor.value = skyBandFloor
    uProminent.value = prominent

    const rig = rigRef.current
    if (cameraAttached && rig) {
      rig.position.copy(camera.position)
      rig.quaternion.copy(camera.quaternion)
      rig.scale.setScalar(1)
    }

    if (!started) {
      fogRevealUniform.value = 0
      if (debug) {
        debugLogAcc.current += delta
        if (debugLogAcc.current >= 0.8) {
          debugLogAcc.current = 0
          console.log('[SandAirFog] tick (scene not started)', {
            uFogReveal: fogRevealUniform.value,
            cameraPos: camera.position.toArray(),
          })
        }
      }
      return
    }
    const t = getRevealT()
    const u = Math.max(0, Math.min(1, (t - FOG_RAMP_START) / FOG_RAMP_DURATION))
    const eased = easeInOutCubic(u)
    fogRevealUniform.value = Math.max(eased, fogRevealFloor)

    if (debug) {
      debugLogAcc.current += delta
      if (debugLogAcc.current >= 0.75) {
        debugLogAcc.current = 0
        const rigNode = rigRef.current
        const wp = rigNode ? rigNode.getWorldPosition(new THREE.Vector3()).toArray() : null
        console.log('[SandAirFog] tick', {
          revealT: t,
          rampU: u,
          easedReveal: eased,
          uFogReveal: fogRevealUniform.value,
          fogRevealFloor,
          prominent,
          opacityScale,
          cameraPos: camera.position.toArray(),
          rigWorldPos: wp,
          cameraAttached,
          elapsed: clock.elapsedTime.toFixed(2),
        })
      }
    }
  })

  const content = (
    <>
      {layers.map((layer, i) => (
        <FogBillboard
          key={i}
          position={layer.position}
          width={layer.width}
          height={layer.height}
          opacity={layer.opacity}
          drift={layer.drift * flowSpeed}
          stretch={layer.stretch}
          seed={layer.seed}
          uTime={timeUniform}
          uCameraPos={cameraPos}
          uFogReveal={fogRevealUniform}
          uFlowSign={uFlowSign}
          uDustColor={uDustColor}
          uOpacityScale={uOpacityScale}
          uSkyBandLow={uSkyBandLow}
          uSkyBandHigh={uSkyBandHigh}
          uSkyBandFloor={uSkyBandFloor}
          uProminent={uProminent}
          logShaderReady={debug && i === 0}
        />
      ))}
    </>
  )

  if (cameraAttached) {
    return (
      <group ref={rigRef} matrixAutoUpdate>
        {content}
      </group>
    )
  }

  return <group>{content}</group>
}
