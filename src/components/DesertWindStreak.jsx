/**
 * DesertWindStreak — ground-level instanced sand-wind patches.
 *
 * Single draw call: InstancedBufferGeometry (COUNT billboard quads).
 * Each puff lives at a random Y near the ground, travels left→right
 * along +X, fades in/out at the edges of its cycle, and is revealed
 * in sync with the scene's fog ramp from revealProgressStore.
 *
 * Shader is intentionally lean (4-octave fBm, elongated radial mask)
 * to keep fragment cost low given the higher puff count.
 */

import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getRevealT } from '../store/revealProgressStore'
import { FOG_RAMP_DURATION, FOG_RAMP_START, easeInOutCubic } from '../constants/revealTimeline'

const COUNT = 72

/* ─── Vertex shader ─────────────────────────────────────────────────────────
 * Positions each puff at a_offset + wind drift (left→right along X),
 * then adds billboard vertex offset in camera space so quads always face cam.
 */
const vert = /* glsl */ `
  attribute float a_phase;
  attribute float a_speedMult;
  attribute float a_scale;
  attribute vec3  a_offset;

  varying vec2  vUv;
  varying float vAlpha;

  uniform float u_time;
  uniform float u_baseSpeed;
  uniform float u_travel;
  uniform float u_fadeIn;
  uniform float u_fadeOut;
  uniform float u_reveal;

  void main() {
    vUv = uv;

    /* Normalised life [0, 1] within one cycle — different per puff via a_speedMult */
    float spd  = a_speedMult * u_baseSpeed;
    float life = fract(u_time * spd + a_phase);

    float fi = smoothstep(0.0, u_fadeIn,        life);
    float fo = smoothstep(1.0, 1.0 - u_fadeOut, life);
    vAlpha   = fi * fo * u_reveal;

    /* World-space position: puff drifts from left edge to right edge of travel range */
    vec3 wp  = a_offset;
    wp.x    += (life - 0.5) * u_travel;

    /* Very slight vertical wisp as puff ages (adds natural dissolve feel) */
    wp.y += life * 0.55;

    /* Billboard: transform origin to camera space, then add per-vertex screen offset.
       Since the mesh has no parent transforms, modelViewMatrix == viewMatrix here. */
    vec4 mv  = modelViewMatrix * vec4(wp, 1.0);
    /* Stretch X 2.2× — wind streaks are wider than tall */
    mv.xy   += position.xy * a_scale * vec2(2.2, 1.0);

    gl_Position = projectionMatrix * mv;
  }
`

/* ─── Fragment shader ───────────────────────────────────────────────────────
 * Elongated radial mask × fBm noise = soft sand-fog patch.
 * Noise UVs scroll left→right to reinforce wind direction.
 * Sand palette desaturates gracefully under the scene's HueSaturation(-1).
 */
const frag = /* glsl */ `
  varying vec2  vUv;
  varying float vAlpha;

  uniform float u_time;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),           hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  /* 4-octave fBm — lean but convincing enough for a soft haze patch */
  float fbm(vec2 p) {
    float v = 0.0, a = 0.52;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    /* Elongated horizontal puff silhouette */
    vec2  c      = (vUv - 0.5) * vec2(1.55, 1.0);
    float radial = 1.0 - smoothstep(0.27, 0.50, length(c));

    /* Noise UVs scroll right (same direction as wind) at two speeds for depth */
    vec2 uv1 = vUv * vec2(3.4, 2.2) + vec2(u_time * 0.09,  0.0);
    vec2 uv2 = vUv * vec2(2.1, 1.6) + vec2(u_time * 0.065, u_time * 0.018);

    float n1      = fbm(uv1);
    float n2      = fbm(uv2 + n1 * 0.28);
    float density = smoothstep(0.22, 0.76, n1 * 0.62 + n2 * 0.38);

    /* Warm sand: desaturates to a light-mid gray under the scene post-processing */
    vec3 col = mix(vec3(0.56, 0.44, 0.26), vec3(0.90, 0.78, 0.56), n1);

    float a = density * radial * 0.86 * vAlpha;
    if (a < 0.006) discard;

    gl_FragColor = vec4(col, a);
  }
`

/* ─── Component ─────────────────────────────────────────────────────────── */

export function DesertWindStreak({ started = false }) {
  const { geometry, uniforms } = useMemo(() => {
    /* Base quad — InstancedBufferGeometry lets us draw COUNT copies in one call */
    const base = new THREE.PlaneGeometry(1, 1)
    const geo  = new THREE.InstancedBufferGeometry()

    geo.index = base.index
    geo.setAttribute('position', base.getAttribute('position'))
    geo.setAttribute('uv',       base.getAttribute('uv'))
    geo.instanceCount = COUNT

    const phases     = new Float32Array(COUNT)
    const speedMults = new Float32Array(COUNT)
    const scales     = new Float32Array(COUNT)
    const offsets    = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      phases[i]          = Math.random()
      /* Speed variety 0.72–1.38: prevents all puffs syncing at scene edges */
      speedMults[i]      = 0.72 + Math.random() * 0.66
      /* Size variety 4.5–12 world-units (pre ×2.2 X stretch) */
      scales[i]          = 4.5 + Math.random() * 7.5

      /* Spread across the ground plane just above terrain */
      offsets[i * 3]     = (Math.random() - 0.5) * 52  // X: –26 … +26
      offsets[i * 3 + 1] = Math.random() * 1.7          // Y:  0  …  1.7  (ground level)
      offsets[i * 3 + 2] = -Math.random() * 24          // Z:  0  … –24   (scene depth)
    }

    geo.setAttribute('a_phase',     new THREE.InstancedBufferAttribute(phases,     1))
    geo.setAttribute('a_speedMult', new THREE.InstancedBufferAttribute(speedMults, 1))
    geo.setAttribute('a_scale',     new THREE.InstancedBufferAttribute(scales,     1))
    geo.setAttribute('a_offset',    new THREE.InstancedBufferAttribute(offsets,    3))

    const uni = {
      u_time:      { value: 0 },
      /* ~15 s full cycle at speedMult = 1 */
      u_baseSpeed: { value: 0.065 },
      /* Total X distance per cycle — covers scene width with comfortable bleed */
      u_travel:    { value: 54 },
      u_fadeIn:    { value: 0.14 },
      u_fadeOut:   { value: 0.22 },
      u_reveal:    { value: 0 },
    }

    base.dispose()
    return { geometry: geo, uniforms: uni }
  }, [])

  /* Dispose geometry on unmount */
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime

    if (!started) {
      uniforms.u_reveal.value = 0
      return
    }
    const t = getRevealT()
    const u = Math.max(0, Math.min(1, (t - FOG_RAMP_START) / FOG_RAMP_DURATION))
    /* Slightly lower floor than SandAirFog so ground wind emerges a touch later */
    uniforms.u_reveal.value = easeInOutCubic(u) * 0.9
  })

  return (
    <mesh
      geometry={geometry}
      renderOrder={99_998}
      frustumCulled={false}
    >
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}
