import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const fogVertexShader = /* glsl */ `
  attribute float a_phase;
  attribute float a_scale;
  attribute vec3  a_offset;

  varying vec2  vUv;
  varying float vLifeAlpha;

  uniform float u_time;
  uniform float u_speed;
  uniform float u_cycleLen;
  uniform float u_fadeIn;
  uniform float u_fadeOut;

  void main() {
    vUv = uv;

    /* Normalised life 0→1 within one cycle */
    float t       = mod(u_time * u_speed + a_phase * u_cycleLen, u_cycleLen);
    float life    = t / u_cycleLen;

    /* Fade in at birth, fade out near death */
    float fadeIn  = smoothstep(0.0, u_fadeIn,        life);
    float fadeOut = smoothstep(1.0, 1.0 - u_fadeOut, life);
    vLifeAlpha    = fadeIn * fadeOut;

    /* Wind: drift left→right along X */
    vec3 worldPos  = a_offset;
    worldPos.x    += t - u_cycleLen * 0.5;   /* starts left, ends right */

    /* Slight upward wisp as it fades out */
    worldPos.y    += life * 1.2;

    /* Billboard in camera space */
    vec4 mvPos  = modelViewMatrix * vec4(worldPos, 1.0);
    mvPos.xy   += position.xy * a_scale;

    gl_Position = projectionMatrix * mvPos;
  }
`

const fogFragmentShader = /* glsl */ `
  uniform float u_time;
  varying vec2  vUv;
  varying float vLifeAlpha;

  float random(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  float noise(vec2 st) {
    vec2 i = floor(st), f = fract(st);
    float a = random(i), b = random(i + vec2(1,0)),
          c = random(i + vec2(0,1)), d = random(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
  }
  float fbm(vec2 st) {
    float v = 0.0, amp = 0.55, freq = 1.0;
    for (int i = 0; i < 5; i++) {
      v    += amp * noise(st * freq);
      freq *= 2.1; amp *= 0.5;
    }
    return v;
  }

  void main() {
    /* Soft round puff shape */
    vec2  c      = vUv - 0.5;
    float radial = 1.0 - smoothstep(0.28, 0.5, length(c));

    /* Scrolling noise — also drifts left→right */
    vec2 fogUV  = vUv * 2.8;
    fogUV.x    += u_time * 0.06;

    float fog1 = fbm(fogUV + u_time * 0.025);
    float fog2 = fbm(fogUV * 1.5 - u_time * 0.018);
    float fog3 = fbm(fogUV * 0.65 + u_time * 0.04);

    float density = clamp((fog1 + fog2 + fog3) * 0.36, 0.2, 1.0);

    /* Sand palette shifts slightly warmer as puff ages (life baked into vLifeAlpha) */
    vec3 sandBase = vec3(0.84, 0.70, 0.44);
    vec3 sandDark = vec3(0.66, 0.50, 0.28);
    vec3 color    = mix(sandDark, sandBase, fog1);
    color         = clamp(color, 0.0, 1.0);

    float alpha = density * radial * 0.90 * vLifeAlpha;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(color, alpha);
  }
`

export function DesertFog({
  position = [0, 0, -4],
  volume = [1, 24, 38],   // [width, height, depth] of spawn area
  count = 90,
  speed = 2.35,          // wind speed (units/sec, left→right)
  cycleLen = 0.01,          // how many seconds one full crossing takes
  fadeIn = 0.12,          // fraction of life spent fading in  (0-1)
  fadeOut = 0.30,          // fraction of life spent fading out (0-1)
}) {
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_speed: { value: speed },
    u_cycleLen: { value: cycleLen },
    u_fadeIn: { value: fadeIn },
    u_fadeOut: { value: fadeOut },
  }), [speed, cycleLen, fadeIn, fadeOut])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1)

    const phases = new Float32Array(count)
    const scales = new Float32Array(count)
    const offsets = new Float32Array(count * 3)
    const [w, h, d] = volume

    for (let i = 0; i < count; i++) {
      phases[i] = Math.random()
      scales[i] = 3.5 + Math.random() * 7
      /* X starts spread so they aren't all born at the same edge */
      offsets[i * 3] = (Math.random() - 0.5) * w
      offsets[i * 3 + 1] = (Math.random() - 0.5) * h
      offsets[i * 3 + 2] = (Math.random() - 0.5) * d
    }

    geo.setAttribute('a_phase', new THREE.InstancedBufferAttribute(phases, 1))
    geo.setAttribute('a_scale', new THREE.InstancedBufferAttribute(scales, 1))
    geo.setAttribute('a_offset', new THREE.InstancedBufferAttribute(offsets, 3))

    return geo
  }, [count, volume])

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.elapsedTime
  })

  return (
    <instancedMesh
      args={[geometry, null, count]}
      position={position}
      renderOrder={999}
    >
      <shaderMaterial
        vertexShader={fogVertexShader}
        fragmentShader={fogFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={true}
        toneMapped={false}
      />
    </instancedMesh>
  )
}