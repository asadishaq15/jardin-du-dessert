import { useEffect, useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { DESERT_QUALITY_TIER } from '../utils/desertQualityTier'

export const DUST_GLB_URL = '/Final_Dust_Scene_v3_alpha_masked_emission.glb'

const LOOP_DURATION = 41.666667
const MAT5_UV_Y = 4.3
const MAT5_UV_X_START = 2.281

/** Matches `GN Desert` root in /3d/desert.glb — dust was authored against this transform. */
const DESERT_ROOT = {
  position: [0.4790534973144531, 0, 0],
  rotation: [0.01808851771056652, -0.024602381512522697, 0.009287441149353981, 0.9994906187057495],
}

/** Per-mesh position tweaks if a plane still drifts after root alignment. */
export const DUST_MESH_OFFSETS = {}

/** @typedef {'standard' | 'fast' | 'mat5'} DustScrollProfile */

/** @param {string} materialName */
function scrollProfileForMaterial(materialName) {
  if (materialName === 'cloud 65.001') return 'fast'
  if (materialName === 'cloud 65.007') return 'mat5'
  return 'standard'
}

/** @param {DustScrollProfile} profile @param {number} t */
function uvOffsetForProfile(profile, t) {
  const u = t / LOOP_DURATION
  switch (profile) {
    case 'fast':
      return { x: u * 5, y: 0 }
    case 'mat5':
      return { x: MAT5_UV_X_START + u * 2, y: MAT5_UV_Y }
    default:
      return { x: u * 2, y: 0 }
  }
}

function configureTexture(map, maxAnisotropy) {
  if (!map) return
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.anisotropy = maxAnisotropy
  map.needsUpdate = true
}

const AUTHORED_EMISSIVE_STRENGTH = 4

/** @param {THREE.Material} material @param {number} emissiveScale */
function applyEmissiveScale(material, emissiveScale) {
  const scaled = AUTHORED_EMISSIVE_STRENGTH * emissiveScale
  const ext = material.extensions?.KHR_materials_emissive_strength
  if (ext) ext.emissiveStrength = scaled
  material.emissiveIntensity = scaled
}

/**
 * Designer dust/wind planes — manual UV scroll (glTF uses KHR_animation_pointer, unsupported in Three.js).
 */
export function DesertDustGlb({
  started = false,
  qualityTier = DESERT_QUALITY_TIER.HIGH,
}) {
  const { scene } = useGLTF(DUST_GLB_URL)
  const { gl } = useThree()
  const scrollMaterialsRef = useRef([])
  const startTimeRef = useRef(null)

  const emissiveScale =
    qualityTier === DESERT_QUALITY_TIER.HIGH
      ? 1
      : qualityTier === DESERT_QUALITY_TIER.BALANCED
        ? 2.5 / 4
        : 2.5 / 4

  const maxAnisotropy =
    qualityTier === DESERT_QUALITY_TIER.PERFORMANCE
      ? Math.min(2, gl.capabilities.getMaxAnisotropy())
      : Math.min(8, gl.capabilities.getMaxAnisotropy())

  useLayoutEffect(() => {
    const seen = new Set()
    const entries = []

    scene.traverse((obj) => {
      if (!obj.isMesh) return

      obj.frustumCulled = true
      obj.renderOrder = 50
      obj.raycast = () => null

      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const material of mats) {
        if (!material || seen.has(material)) continue
        seen.add(material)

        material.depthWrite = false
        material.transparent = true
        configureTexture(material.emissiveMap, maxAnisotropy)
        configureTexture(material.map, maxAnisotropy)
        applyEmissiveScale(material, emissiveScale)

        entries.push({
          material,
          profile: scrollProfileForMaterial(material.name),
        })
      }
    })

    scrollMaterialsRef.current = entries
    applyMeshOffsets(scene)
  }, [scene, emissiveScale, maxAnisotropy])

  useEffect(() => {
    startTimeRef.current = null
  }, [started])

  useFrame(({ clock }) => {
    if (!started) return

    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime
    }

    const t = (clock.elapsedTime - startTimeRef.current) % LOOP_DURATION

    for (const { material, profile } of scrollMaterialsRef.current) {
      const { x, y } = uvOffsetForProfile(profile, t)
      if (material.emissiveMap) {
        material.emissiveMap.offset.set(x, y)
      }
      if (material.map) {
        material.map.offset.set(x, y)
      }
    }
  })

  return (
    <group position={DESERT_ROOT.position} quaternion={DESERT_ROOT.rotation}>
      <primitive object={scene} />
    </group>
  )
}

function applyMeshOffsets(scene) {
  for (const [name, offset] of Object.entries(DUST_MESH_OFFSETS)) {
    const mesh = scene.getObjectByName(name)
    if (!mesh || !offset) continue
    mesh.position.add(offset)
  }
}

useGLTF.preload(DUST_GLB_URL)
