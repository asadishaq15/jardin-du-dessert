import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard, useCursor } from '@react-three/drei'
import { HoverMesh } from './DesertGlb'
import { PROTOTYPE_HOVER_SUN } from '../constants/prototypeHoverCopy'
import {
  HOVER_CELESTIAL_STACKED_FONT_SCALE,
} from '../constants/hoverUi'

/** Shared with selective bloom in DesertScene — only sun meshes use this layer. */
export const SUN_LAYER = 2

/** Draw sun before most scene meshes so it sits “behind” foreground (depth still occludes). */
const SUN_GROUP_RENDER_ORDER = -100

/**
 * Billboarding sun disk (upper-left), camera-locked like SceneMoon3D.
 * Emissive sphere (no texture maps); bloom handled in DesertScene selective pass.
 */
export function SceneSun3D({ onHoverSelect }) {
  const groupRef = useRef(null)
  const meshRef = useRef(null)
  const { camera, raycaster } = useThree()
  const [hoverUi, setHoverUi] = useState(false)
  useCursor(hoverUi, 'pointer')

  useLayoutEffect(() => {
    camera.layers.enable(SUN_LAYER)
    raycaster.layers.enable(SUN_LAYER)
    return () => {
      camera.layers.disable(SUN_LAYER)
      raycaster.layers.disable(SUN_LAYER)
    }
  }, [camera, raycaster])

  useLayoutEffect(() => {
    if (meshRef.current) meshRef.current.layers.set(SUN_LAYER)
  }, [])

  /* Upper-left in camera space; offset magnitude ~20–26 so the disk reads at a natural size while
   * still sitting past nearby dunes for depth occlusion (was ~58 and read as a pinprick). */
  const offsetLocal = useMemo(() => new THREE.Vector3(-70.4, -2.85, -20.5), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    q.copy(camera.quaternion)
    v.copy(offsetLocal).applyQuaternion(q)
    g.position.copy(camera.position).add(v)
    g.quaternion.identity()

    const mesh = meshRef.current
    if (mesh) mesh.rotation.y += delta * 0.028
  })

  return (
    <group ref={groupRef} renderOrder={SUN_GROUP_RENDER_ORDER}>
      <HoverMesh
        label={PROTOTYPE_HOVER_SUN.realm}
        chipStyle="stacked"
        screenSizeMode="fixed"
        /*
          Billboard local space (+X ≈ screen right). X past sphere radius so the
          stacked chip sits beside the disk, not centered on it (Html uses center).
        */
        htmlPosition={[13.0, 1.55, 0.02]}
        stackedMaxWidth={300}
        stackedFontScale={HOVER_CELESTIAL_STACKED_FONT_SCALE}
        stackedPadding="8px 22px 9px"
        stackedRowGap={4}
        stackedEnterCompact
        onHoverChange={setHoverUi}
        onSelect={() => onHoverSelect?.(PROTOTYPE_HOVER_SUN)}
      >
        <Billboard follow>
          <mesh ref={meshRef} castShadow={false} scale={3.88} renderOrder={SUN_GROUP_RENDER_ORDER + 1}>
            <sphereGeometry args={[1, 72, 72]} />
            <meshStandardMaterial
              color="#fff4d8"
              roughness={0.12}
              metalness={0}
              emissive="#ffedc4"
              emissiveIntensity={2.05}
              envMapIntensity={0.06}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={4}
              polygonOffsetUnits={4}
              toneMapped
            />
          </mesh>
        </Billboard>
      </HoverMesh>
    </group>
  )
}
