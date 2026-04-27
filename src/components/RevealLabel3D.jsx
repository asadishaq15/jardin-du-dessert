import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { getRevealT } from '../store/revealProgressStore'
import { useTopNavStore } from '../store/useTopNavStore'
import { phaseLabelOpacity } from '../constants/revealTimeline'

/** GrandSlang-Roman ttf is shipped from public/ — Drei `<Text>` (troika) loads via fetch. */
const GRAND_SLANG_FONT = '/GrandSlang-Roman/web/font/GrandSlang-Roman.ttf'

/** Draw above haze (DUST_RENDER_ORDER = 100_000) but below moon (100_001) is fine — labels are camera-facing. */
const LABEL_RENDER_ORDER = 99_000

/**
 * 3D realm label tied to a single reveal phase.
 *
 * The label fades in, holds, then fades out via `phaseLabelOpacity(t, phase)` — so the parent
 * phase's object reveal can pick up where the label leaves off.
 *
 * For world-anchored labels (Mind / Body / Heart), pass `position` in the host group's local
 * space. For camera-attached labels (Spirit / Soul), pass `cameraOffset` to make the label
 * follow the camera at a fixed view-space offset.
 *
 * @param {{ id: string, start: number, end: number }} phase  Phase descriptor from REVEAL_PHASES.
 * @param {string} text  Realm name to render (e.g. 'Mind Realm').
 * @param {[number, number, number]} [position=[0, 0, 0]]  Local-space anchor (used when not camera-attached).
 * @param {[number, number, number]} [cameraOffset]  When set, label follows the camera at this view-space offset.
 * @param {number} [fontSize=0.85]  Drei `<Text>` font size in world units.
 * @param {string} [color='#ffffff']  Plain white fill for maximum readability.
 * @param {string} [outlineColor='transparent']  Disabled by default (no stroke).
 * @param {number} [outlineWidth=0]  Outline thickness disabled for plain text.
 */
export function RevealLabel3D({
  phase,
  text,
  position = [0, 0, 0],
  cameraOffset,
  fontSize = 0.85,
  color = '#ffffff',
  outlineColor = 'transparent',
  outlineWidth = 0,
}) {
  const groupRef = useRef(null)
  const textRef = useRef(null)
  const { camera } = useThree()
  /* Reused scratch math objects so per-frame work allocates nothing. */
  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])
  const tmpVec = useMemo(() => new THREE.Vector3(), [])
  const cameraOffsetVec = useMemo(
    () => (cameraOffset ? new THREE.Vector3().fromArray(cameraOffset) : null),
    [cameraOffset],
  )

  /* Hide on mount — `useFrame` below switches it on once the phase opens. */
  useLayoutEffect(() => {
    const g = groupRef.current
    if (g) g.visible = false
  }, [])

  useFrame(() => {
    const g = groupRef.current
    const t3 = textRef.current
    if (!g || !t3) return

    /* On the About page, suppress the label entirely — no realm chrome behind the page content. */
    if (useTopNavStore.getState().aboutOpen) {
      g.visible = false
      return
    }

    if (cameraOffsetVec) {
      /* Camera-locked: place the label at a fixed view-space offset (Spirit / Soul labels). */
      tmpQuat.copy(camera.quaternion)
      tmpVec.copy(cameraOffsetVec).applyQuaternion(tmpQuat)
      g.position.copy(camera.position).add(tmpVec)
      g.quaternion.identity()
    }

    const opacity = phaseLabelOpacity(getRevealT(), phase)
    /* Toggle visibility off when fully transparent so troika does not waste raster time. */
    g.visible = opacity > 0.001
    if (!g.visible) return
    /* `fillOpacity` / `outlineOpacity` are troika's per-glyph alpha — material.opacity is left at 1. */
    t3.fillOpacity = opacity
    t3.outlineOpacity = 0
  })

  return (
    <group
      ref={groupRef}
      position={cameraOffsetVec ? undefined : position}
      renderOrder={LABEL_RENDER_ORDER}
    >
      <Billboard follow>
        <Text
          ref={textRef}
          font={GRAND_SLANG_FONT}
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineColor={outlineColor}
          outlineWidth={outlineWidth}
          outlineBlur={0}
          letterSpacing={0.04}
          renderOrder={LABEL_RENDER_ORDER}
          material-toneMapped={false}
          material-transparent
          material-depthWrite={false}
          material-depthTest={false}
        >
          {text}
        </Text>
      </Billboard>
    </group>
  )
}

export default RevealLabel3D
