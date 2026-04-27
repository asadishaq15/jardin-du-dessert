import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────
//  SAND GRAIN SHADERS
//  Small, fast particles that hug the ground
// ─────────────────────────────────────────────
const sandVert = /* glsl */ `
  attribute float aSpeed;
  attribute float aSize;
  attribute float aOffset;

  uniform float uTime;
  uniform float uWindSpeed;
  uniform float uBoundsX;
  uniform float uBoundsY;
  uniform float uGust;          // 0–1 gust strength

  varying float vAlpha;

  void main() {
    // Wind drift along +X with per-particle speed
    float wind = uWindSpeed * (1.0 + uGust * 0.6);
    float driftX = position.x + uTime * aSpeed * wind;

    // Wrap particles seamlessly across the field
    float wrappedX = mod(driftX + uBoundsX, uBoundsX * 2.0) - uBoundsX;

    // Multi-freq turbulence — keeps motion organic
    float t1 = sin(uTime * 1.4 + aOffset)          * 0.18;
    float t2 = sin(uTime * 3.3 + aOffset * 2.1)    * 0.06;
    float t3 = cos(uTime * 0.7 + aOffset * 0.5)    * 0.10;
    float turbY = t1 + t2;
    float turbZ = t3 + sin(uTime * 2.1 + aOffset)  * 0.08;

    // Gust: push particles slightly upward during peaks
    float gustLift = uGust * sin(uTime * 0.9 + aOffset) * 0.4;

    vec3 pos = vec3(wrappedX,
                    position.y + turbY + gustLift,
                    position.z + turbZ);

    // Fade near ground, top, and wrap seams
    float yFade = smoothstep(0.0, 0.6, pos.y)
                * smoothstep(uBoundsY, uBoundsY - 0.8, pos.y);
    float xFade = smoothstep(-uBoundsX, -uBoundsX + 3.5, wrappedX)
                * smoothstep( uBoundsX,  uBoundsX - 3.5, wrappedX);
    vAlpha = yFade * xFade;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position  = projectionMatrix * mvPosition;
  }
`

const sandFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Soft circular grain
    float alpha = smoothstep(0.5, 0.05, dist) * vAlpha * 0.75;
    gl_FragColor = vec4(uColor, alpha);
  }
`

// ─────────────────────────────────────────────
//  DUST WISP SHADERS
//  Large, slow, semi-transparent clouds
// ─────────────────────────────────────────────
const wispVert = /* glsl */ `
  attribute float aSpeed;
  attribute float aSize;
  attribute float aOffset;

  uniform float uTime;
  uniform float uWindSpeed;
  uniform float uBoundsX;
  uniform float uGust;

  varying float vAlpha;

  void main() {
    float wind = uWindSpeed * (1.0 + uGust * 0.4);
    float driftX  = position.x + uTime * aSpeed * wind * 0.45;
    float wrappedX = mod(driftX + uBoundsX, uBoundsX * 2.0) - uBoundsX;

    // Lazy swirling
    float swirl  = sin(uTime * 0.35 + aOffset)        * 0.55
                 + sin(uTime * 0.9  + aOffset * 1.7)   * 0.15;
    float swirlZ = cos(uTime * 0.28 + aOffset * 0.8)  * 0.4;

    vec3 pos = vec3(wrappedX, position.y + swirl, position.z + swirlZ);

    float xFade = smoothstep(-uBoundsX, -uBoundsX + 5.0, wrappedX)
                * smoothstep( uBoundsX,  uBoundsX - 5.0, wrappedX);
    vAlpha = xFade;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (320.0 / -mvPosition.z);
    gl_Position  = projectionMatrix * mvPosition;
  }
`

const wispFrag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Very soft, billowy falloff
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * 0.18;
    gl_FragColor = vec4(uColor, alpha);
  }
`

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function buildArrays(count, { xRange, yRange, zRange, speedRange, sizeRange }) {
  const positions = new Float32Array(count * 3)
  const speeds    = new Float32Array(count)
  const sizes     = new Float32Array(count)
  const offsets   = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * xRange
    positions[i * 3 + 1] =  Math.random()        * yRange
    positions[i * 3 + 2] = (Math.random() - 0.5) * zRange

    speeds[i]  = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0])
    sizes[i]   = sizeRange[0]  + Math.random() * (sizeRange[1]  - sizeRange[0])
    offsets[i] = Math.random() * Math.PI * 2
  }
  return { positions, speeds, sizes, offsets }
}

// ─────────────────────────────────────────────
//  SAND LAYER  (~8 k tiny fast grains)
// ─────────────────────────────────────────────
function SandLayer({ gustRef }) {
  const data = useMemo(() => buildArrays(8000, {
    xRange: 50, yRange: 2.5, zRange: 22,
    speedRange: [0.6, 2.2], sizeRange: [1, 4.5],
  }), [])

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uWindSpeed: { value: 3.2 },
    uBoundsX:   { value: 25 },
    uBoundsY:   { value: 2.5 },
    uGust:      { value: 0 },
    uColor:     { value: new THREE.Color('#d49a5a') },
  }), [])

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    // Gust: smooth sine at 0.07 Hz — 14-second cycle
    uniforms.uGust.value = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 0.45)
    if (gustRef) gustRef.current = uniforms.uGust.value
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSpeed"   args={[data.speeds,    1]} />
        <bufferAttribute attach="attributes-aSize"    args={[data.sizes,     1]} />
        <bufferAttribute attach="attributes-aOffset"  args={[data.offsets,   1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={sandVert}
        fragmentShader={sandFrag}
      />
    </points>
  )
}

// ─────────────────────────────────────────────
//  DUST LAYER  (400 large slow wisps)
// ─────────────────────────────────────────────
function DustLayer({ gustRef }) {
  const data = useMemo(() => buildArrays(400, {
    xRange: 50, yRange: 5, zRange: 18,
    speedRange: [0.15, 0.7], sizeRange: [30, 80],
  }), [])

  const uniforms = useMemo(() => ({
    uTime:      { value: 0 },
    uWindSpeed: { value: 1.4 },
    uBoundsX:   { value: 25 },
    uGust:      { value: 0 },
    uColor:     { value: new THREE.Color('#e8c090') },
  }), [])

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uGust.value = gustRef?.current ?? 0
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aSpeed"   args={[data.speeds,    1]} />
        <bufferAttribute attach="attributes-aSize"    args={[data.sizes,     1]} />
        <bufferAttribute attach="attributes-aOffset"  args={[data.offsets,   1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        uniforms={uniforms}
        vertexShader={wispVert}
        fragmentShader={wispFrag}
      />
    </points>
  )
}

// ─────────────────────────────────────────────
//  PUBLIC EXPORT — drop inside any <Canvas>
//
//  Props
//  ─────
//  yOffset   : number   lift the whole effect (default 0)
//  scale     : number   uniform scale (default 1)
// ─────────────────────────────────────────────
export function DesertWind({ yOffset = 0, scale = 1 }) {
  // Shared gust value so both layers stay in sync
  const gustRef = useRef(0)

  return (
    <group position={[0, yOffset, 0]} scale={scale}>
      <SandLayer gustRef={gustRef} />
      <DustLayer gustRef={gustRef} />
    </group>
  )
}