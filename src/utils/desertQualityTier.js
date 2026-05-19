/**
 * Tiered rendering for desert scenes — maps to shadow resolution, DPR, AA, bloom, and shadow cast rules.
 */

export const DESERT_QUALITY_TIER = {
  PERFORMANCE: 'performance',
  BALANCED: 'balanced',
  HIGH: 'high',
}

const STORAGE_KEY = 'desertQualityTier'

export function isMobileViewport() {
  if (typeof window === 'undefined') return false
  const isNarrow = window.matchMedia('(max-width: 900px)').matches
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  const noHover = window.matchMedia('(hover: none)').matches
  return isNarrow && (hasCoarsePointer || noHover)
}

/** Touch devices in landscape (width >900px) — used for loading cactus sizing. */
export function isMobileLoadingLayout() {
  if (typeof window === 'undefined') return false
  const touch =
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches
  if (!touch) return false
  return (
    window.matchMedia('(max-width: 900px)').matches ||
    window.matchMedia('(max-height: 500px)').matches
  )
}

function parseTierParam(value) {
  if (!value || typeof value !== 'string') return null
  const t = value.trim().toLowerCase()
  if (
    t === DESERT_QUALITY_TIER.PERFORMANCE ||
    t === DESERT_QUALITY_TIER.BALANCED ||
    t === DESERT_QUALITY_TIER.HIGH
  ) {
    return t
  }
  return null
}

/**
 * URL `?quality=performance|balanced|high` overrides; then localStorage; then
 * performance on touch/narrow viewports, high on desktop.
 */
export function resolveDesertQualityTier() {
  if (typeof window === 'undefined') return DESERT_QUALITY_TIER.HIGH

  const fromUrl = parseTierParam(new URLSearchParams(window.location.search).get('quality'))
  if (fromUrl) return fromUrl

  try {
    const fromStorage = parseTierParam(localStorage.getItem(STORAGE_KEY))
    if (fromStorage) return fromStorage
  } catch (_) {
    /* ignore */
  }

  if (isMobileViewport()) return DESERT_QUALITY_TIER.PERFORMANCE
  return DESERT_QUALITY_TIER.HIGH
}

/** One step down for adaptive FPS (never upgrades). */
export function downgradeDesertQualityTier(tier) {
  if (tier === DESERT_QUALITY_TIER.HIGH) return DESERT_QUALITY_TIER.BALANCED
  if (tier === DESERT_QUALITY_TIER.BALANCED) return DESERT_QUALITY_TIER.PERFORMANCE
  return DESERT_QUALITY_TIER.PERFORMANCE
}

/**
 * @returns {{
 *   shadowMapSize: number,
 *   softShadow: boolean,
 *   dpr: [number, number],
 *   antialias: boolean,
 *   directionalNormalBiasTight: boolean
 * }}
 */
export function getDesertQualityRendererSettings(tier) {
  switch (tier) {
    case DESERT_QUALITY_TIER.PERFORMANCE:
      return {
        shadowMapSize: 1024,
        softShadow: false,
        dpr: [1, 1.25],
        antialias: false,
        directionalNormalBiasTight: false,
      }
    case DESERT_QUALITY_TIER.BALANCED:
      return {
        shadowMapSize: 2048,
        softShadow: true,
        dpr: [1, 1.5],
        antialias: true,
        directionalNormalBiasTight: false,
      }
    case DESERT_QUALITY_TIER.HIGH:
    default:
      return {
        shadowMapSize: 4096,
        softShadow: true,
        dpr: [1, 2],
        antialias: true,
        directionalNormalBiasTight: true,
      }
  }
}

/** Legacy ModelBeta.glb shadow cast strategy */
export function getDesertShadowCastMode(tier) {
  switch (tier) {
    case DESERT_QUALITY_TIER.PERFORMANCE:
      return 'minimal'
    case DESERT_QUALITY_TIER.BALANCED:
      return 'balanced'
    default:
      return 'full'
  }
}

/** Selective bloom intensity on legacy desert — slightly lower on balanced to save fill rate. */
export function getDesertSelectiveBloomIntensity(tier) {
  if (tier === DESERT_QUALITY_TIER.BALANCED) return 1.12
  return 1.35
}
