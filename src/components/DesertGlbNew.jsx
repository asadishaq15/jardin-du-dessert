import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { setRevealT } from '../store/revealProgressStore'
import { useRevealUiStore } from '../store/useRevealUiStore'

const DESERT_GLB_URL = '/3d/desert.glb'
const CAMERA_GLB_URL = '/3d/camera(2).glb'
const SAND_EXR_URL = '/3d/sand-dunes-desert-aerial_2K_835f4211-f6ea-421c-ba13-a4106bfe1c78.exr'

/** Camera rig names from the shared Blender outliner screenshot. */
const CAMERA_DRIVER_NAMES = ['Camera_Web', 'Camera_Web_Data', 'Camera']

/**
 * Three-stage scroll:
 *   [0 → 1] camera moves from start to lock point
 *   [1 → 2] text phases animate while camera stays locked
 *   [2 → 3] camera resumes from lock point to end
 */
const TOTAL_MAX = 3
const CAMERA_LOCK_PROGRESS = 0.423
const LOCK_TRANSITION_TOTAL_SPAN = 0.16
const LOCK_TRANSITION_PATH_PORTION = 0.14
const WHEEL_TO_PROGRESS = 0.00014
const SMOOTH_LAMBDA = 5.2
const MAX_DAMP_DT = 0.08
const PARALLAX_MAX_X = 0.34
const PARALLAX_MAX_Y = 0.16
const PARALLAX_LAMBDA = 7.5
const INITIAL_DOWN_TILT_DEG = 5.5
const INITIAL_DOWN_TILT_PATH_FADE_END = 0.22
/** Device tilt → same axes as cursor parallax (landscape phone). */
const TILT_GAMMA_SCALE = 42
const TILT_BETA_CENTER = 44
const TILT_BETA_SCALE = 40

function shapeEdgeParallax(v) {
  const a = Math.abs(v)
  const t = THREE.MathUtils.clamp((a - 0.18) / 0.82, 0, 1)
  const eased = t * t * (3 - 2 * t)
  return Math.sign(v) * eased
}

function normalizeWheelDelta(e) {
  let y = e.deltaY
  if (e.deltaMode === 1) y *= 16
  else if (e.deltaMode === 2) y *= typeof window !== 'undefined' ? window.innerHeight || 800 : 800
  return y
}

function findCameraDriver(root) {
  for (const name of CAMERA_DRIVER_NAMES) {
    const o = root.getObjectByName(name)
    if (o) return o
  }
  let found = null
  root.traverse((obj) => {
    if (!found && obj.isPerspectiveCamera) found = obj
  })
  return found
}

function findCameraPathAction(actions) {
  const entries = Object.entries(actions).filter(([, a]) => a)
  if (!entries.length) return null

  const score = (name) => {
    const n = name.toLowerCase()
    if (n.includes('camera_webaction')) return 130
    if (n.includes('camera_web')) return 110
    if (n.includes('camera') && n.includes('action')) return 100
    if (n.includes('path') || n.includes('nurbs')) return 90
    if (n.includes('cloud')) return -1
    return 0
  }

  let best = null
  let bestScore = -1
  for (const [name, action] of entries) {
    const s = score(name)
    if (s > bestScore) {
      bestScore = s
      best = action
    }
  }
  return bestScore > 0 ? best : null
}

function mapTotalToRevealProgress(total) {
  return THREE.MathUtils.clamp(total - 1, 0, 1)
}

function mapTotalToPathProgress(total) {
  const blendSpan = THREE.MathUtils.clamp(LOCK_TRANSITION_TOTAL_SPAN, 0.001, 0.45)
  const lockInStart = 1 - blendSpan
  const lockOutEnd = 2 + blendSpan
  const preLockProgress = CAMERA_LOCK_PROGRESS * (1 - LOCK_TRANSITION_PATH_PORTION)
  const postLockProgress =
    CAMERA_LOCK_PROGRESS + (1 - CAMERA_LOCK_PROGRESS) * LOCK_TRANSITION_PATH_PORTION

  if (total <= lockInStart) {
    const u = THREE.MathUtils.clamp(total / lockInStart, 0, 1)
    return THREE.MathUtils.lerp(0, preLockProgress, u)
  }
  if (total <= 1) {
    const u = THREE.MathUtils.smoothstep(total, lockInStart, 1)
    return THREE.MathUtils.lerp(preLockProgress, CAMERA_LOCK_PROGRESS, u)
  }
  if (total <= 2) return CAMERA_LOCK_PROGRESS
  if (total <= lockOutEnd) {
    const u = THREE.MathUtils.smoothstep(total, 2, lockOutEnd)
    return THREE.MathUtils.lerp(CAMERA_LOCK_PROGRESS, postLockProgress, u)
  }
  const u = THREE.MathUtils.clamp((total - lockOutEnd) / (TOTAL_MAX - lockOutEnd), 0, 1)
  return THREE.MathUtils.lerp(postLockProgress, 1, u)
}

function applySandTexture(scene, texture) {
  const exactMeshNames = new Set(['Plane.001'])
  const sandRegex = /(sand|dune|desert|gn desert|procedural sand)/i

  scene.traverse((obj) => {
    if (!obj.isMesh) return
    obj.castShadow = true
    obj.receiveShadow = true

    const meshName = obj.name || ''
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of mats) {
      if (!mat) continue
      const matName = mat.name || ''
      const isSandTarget =
        exactMeshNames.has(meshName) ||
        sandRegex.test(meshName) ||
        sandRegex.test(matName)
      if (!isSandTarget) continue

      /*
       * Do NOT use the EXR as color map — it is an aerial photo and will
       * tint the sand an alien colour when used as mat.map.
       * Use it only as a bumpMap to add fine ripple surface detail.
       */
      if ('map' in mat) mat.map = null
      if ('roughness' in mat) mat.roughness = 0.88
      if ('metalness' in mat) mat.metalness = 0
      if ('envMapIntensity' in mat) mat.envMapIntensity = 0.12
      if ('bumpMap' in mat) {
        mat.bumpMap = texture
        mat.bumpScale = 0.06
      }
      mat.needsUpdate = true
    }
  })
}

/**
 * Loads split assets:
 * - `desert.glb` for visible geometry
 * - `camera.glb` for path animation rig
 * - EXR texture mapped onto desert sand material
 */
export function DesertGlbNew({ mobileOptimized = false }) {
  const { scene: desertScene } = useGLTF(DESERT_GLB_URL)
  const { scene: cameraScene, animations: cameraAnimations } = useGLTF(CAMERA_GLB_URL)
  const sandExr = useLoader(EXRLoader, SAND_EXR_URL)
  const { actions } = useAnimations(cameraAnimations, cameraScene)
  const { camera, gl } = useThree()
  const setHorizonHotspotVisible = useRevealUiStore((s) => s.setHorizonHotspotVisible)

  const driverRef = useRef(null)
  const pathActionRef = useRef(null)
  const totalRef = useRef(0)
  const totalTargetRef = useRef(0)
  const lastPathProgRef = useRef(-1)
  const lastLoggedPathPctRef = useRef(-1)
  const tmpPos = useRef(new THREE.Vector3())
  const tmpQuat = useRef(new THREE.Quaternion())
  const tmpScl = useRef(new THREE.Vector3())
  const tmpRight = useRef(new THREE.Vector3())
  const tmpUp = useRef(new THREE.Vector3())
  const tmpTiltQuat = useRef(new THREE.Quaternion())
  const tmpTiltAxis = useRef(new THREE.Vector3())
  const pointerTarget = useRef({ x: 0, y: 0 })
  const tiltTarget = useRef({ x: 0, y: 0 })
  const swaySmoothed = useRef({ x: 0, y: 0 })

  const sandTexture = useMemo(() => {
    sandExr.wrapS = THREE.RepeatWrapping
    sandExr.wrapT = THREE.RepeatWrapping
    sandExr.repeat.set(1.75, 1.75)
    sandExr.flipY = false
    sandExr.colorSpace = THREE.LinearSRGBColorSpace
    sandExr.needsUpdate = true
    return sandExr
  }, [sandExr])

  useLayoutEffect(() => {
    /* Enable shadows on every mesh so the directional sun creates depth */
    desertScene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
      }
    })
    applySandTexture(desertScene, sandTexture)
  }, [desertScene, sandTexture])

  useLayoutEffect(() => {
    driverRef.current = findCameraDriver(cameraScene)
    cameraScene.traverse((obj) => {
      if (obj.isPerspectiveCamera) obj.visible = false
    })
  }, [cameraScene])

  useEffect(() => {
    totalRef.current = 0
    totalTargetRef.current = 0
    lastPathProgRef.current = -1
    setRevealT(0)
    setHorizonHotspotVisible(false)
    return () => {
      setRevealT(0)
      setHorizonHotspotVisible(false)
    }
  }, [setHorizonHotspotVisible])

  useEffect(() => {
    const pathAction = findCameraPathAction(actions)
    pathActionRef.current = pathAction

    for (const action of Object.values(actions)) {
      if (!action) continue
      action.reset()
      if (action === pathAction) {
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        action.play()
        action.paused = true
        action.time = 0
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.clampWhenFinished = false
        action.play()
      }
    }
  }, [actions])

  useEffect(() => {
    const el = gl.domElement
    const onWheel = (e) => {
      e.preventDefault()
      const y = normalizeWheelDelta(e)
      const next = totalTargetRef.current + y * WHEEL_TO_PROGRESS
      totalTargetRef.current = THREE.MathUtils.clamp(next, 0, TOTAL_MAX)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl])

  useEffect(() => {
    if (mobileOptimized) return undefined

    const el = gl.domElement

    const onPointerMove = (e) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1
      pointerTarget.current.x = shapeEdgeParallax(nx)
      pointerTarget.current.y = shapeEdgeParallax(ny)
    }

    const onPointerLeave = () => {
      pointerTarget.current.x = 0
      pointerTarget.current.y = 0
    }

    el.addEventListener('pointermove', onPointerMove, { passive: true })
    el.addEventListener('pointerleave', onPointerLeave)
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [gl, mobileOptimized])

  useEffect(() => {
    if (!mobileOptimized) {
      tiltTarget.current.x = 0
      tiltTarget.current.y = 0
      return undefined
    }

    const el = gl.domElement

    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return
      const gx = THREE.MathUtils.clamp(e.gamma / TILT_GAMMA_SCALE, -1, 1)
      const gy = THREE.MathUtils.clamp((e.beta - TILT_BETA_CENTER) / TILT_BETA_SCALE, -1, 1)
      tiltTarget.current.x = shapeEdgeParallax(gx)
      tiltTarget.current.y = shapeEdgeParallax(gy)
    }

    let listening = false
    const start = () => {
      if (listening) return
      listening = true
      window.addEventListener('deviceorientation', onOrient, true)
    }
    const stop = () => {
      window.removeEventListener('deviceorientation', onOrient, true)
      listening = false
      tiltTarget.current.x = 0
      tiltTarget.current.y = 0
    }

    const iosNeedsPrompt =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'

    if (iosNeedsPrompt) {
      const unlock = () => {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') start()
          })
          .catch(() => {})
        el.removeEventListener('touchstart', unlock)
      }
      el.addEventListener('touchstart', unlock, { passive: true })
      return () => {
        el.removeEventListener('touchstart', unlock)
        stop()
      }
    }

    start()
    return stop
  }, [gl, mobileOptimized])

  /* Stage map: camera-in -> labels (locked cam) -> camera-out. */
  useFrame((_, delta) => {
    const pathAction = pathActionRef.current
    const dt = Math.min(delta, MAX_DAMP_DT)

    totalRef.current = THREE.MathUtils.damp(
      totalRef.current,
      totalTargetRef.current,
      SMOOTH_LAMBDA,
      dt,
    )

    const total = totalRef.current
    const revealT = mapTotalToRevealProgress(total)
    const pathProg = mapTotalToPathProgress(total)

    setRevealT(revealT)
    setHorizonHotspotVisible(pathProg >= 0.99)

    if (!pathAction?.getClip()) return
    const duration = Math.max(pathAction.getClip().duration, 1e-6)
    pathAction.time = pathProg * duration
  }, -1000)

  useFrame((_, delta) => {
    const driver = driverRef.current
    if (!driver) return

    const dt = Math.min(delta, MAX_DAMP_DT)
    const swayTx = mobileOptimized ? tiltTarget.current.x : pointerTarget.current.x
    const swayTy = mobileOptimized ? tiltTarget.current.y : pointerTarget.current.y

    swaySmoothed.current.x = THREE.MathUtils.damp(
      swaySmoothed.current.x,
      swayTx,
      PARALLAX_LAMBDA,
      dt,
    )
    swaySmoothed.current.y = THREE.MathUtils.damp(
      swaySmoothed.current.y,
      swayTy,
      PARALLAX_LAMBDA,
      dt,
    )

    const pathProg = mapTotalToPathProgress(totalRef.current)
    const pathPct = Math.round(pathProg * 1000) / 10
    if (import.meta.env.DEV) {
      if (
        lastLoggedPathPctRef.current < 0 ||
        Math.abs(pathPct - lastLoggedPathPctRef.current) >= 0.5
      ) {
        lastLoggedPathPctRef.current = pathPct
        console.log(`[camera-path] ${pathPct}%`)
      }
    }
    lastPathProgRef.current = pathProg

    driver.updateMatrixWorld(true)
    driver.matrixWorld.decompose(tmpPos.current, tmpQuat.current, tmpScl.current)
    camera.position.copy(tmpPos.current)
    camera.quaternion.copy(tmpQuat.current)

    /* Slight initial downward bias, then fade out as path progresses. */
    const tiltMix = 1 - THREE.MathUtils.smoothstep(pathProg, 0, INITIAL_DOWN_TILT_PATH_FADE_END)
    if (tiltMix > 1e-4) {
      const downTiltRad = THREE.MathUtils.degToRad(INITIAL_DOWN_TILT_DEG * tiltMix)
      tmpTiltAxis.current.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize()
      tmpTiltQuat.current.setFromAxisAngle(tmpTiltAxis.current, -downTiltRad)
      camera.quaternion.premultiply(tmpTiltQuat.current)
    }

    /* Subtle cursor parallax in camera-local right/up directions. */
    tmpRight.current.set(1, 0, 0).applyQuaternion(tmpQuat.current)
    tmpUp.current.set(0, 1, 0).applyQuaternion(tmpQuat.current)
    camera.position.addScaledVector(tmpRight.current, swaySmoothed.current.x * PARALLAX_MAX_X)
    camera.position.addScaledVector(tmpUp.current, -swaySmoothed.current.y * PARALLAX_MAX_Y)

    camera.scale.set(1, 1, 1)
  }, 100)

  return <primitive object={desertScene} />
}

useGLTF.preload(DESERT_GLB_URL)
useGLTF.preload(CAMERA_GLB_URL)
