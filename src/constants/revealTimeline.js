/**
 * Single source for post-Start reveal: 3D timeline + 2D overlay fade (keep in sync with App.css --overlay-fade-ms).
 *
 * The reveal is a single normalized progress `t` in [0, 1]. It is split into 5 sequential phases
 * (Mind → Body → Heart → Spirit → Soul). Each phase plays a 3D realm label (label-in / hold /
 * label-out) and only then ramps that phase's object(s).
 */

/** Normalized reveal progress runs [0,1] over this many seconds after Start (see RevealAndCamera). */
export const REVEAL_DURATION_SEC = 14.5

/**
 * Exponential smoothing for reveal `t` (higher = snappier, lower = smoother).
 * Reduces camera / foliage judder when skinned meshes and large groups spike frame time.
 */
export const REVEAL_T_SMOOTH_LAMBDA = 6.5

/** Cap `delta` when integrating reveal progress so one long frame cannot jump `t` too far. */
export const REVEAL_MAX_DELTA_SEC = 1 / 60

/** Must match .intro-overlay CSS transition duration (set via inline --overlay-fade-ms). */
export const OVERLAY_FADE_MS = 1400

/**
 * Begin advancing scene `t` and foliage this many ms after fade starts — scene motion sits under
 * the fading overlay (~65%) so the first heavy frames are less visible.
 */
export const OVERLAY_SCENE_START_MS = Math.round(OVERLAY_FADE_MS * 0.65)

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * Per-phase sub-window weights — must sum to 1.0.
 * label-in → hold → label-out → gap (pause before next realm).
 * Balanced so fade-in and fade-out are equal, with a generous hold.
 */
export const PHASE_LABEL_IN_FRAC = 0.25
export const PHASE_LABEL_HOLD_FRAC = 0.40
export const PHASE_LABEL_OUT_FRAC = 0.25
export const PHASE_OBJECT_FRAC = 0.10

/** Five equal-width phases across [0, 1]; lookup by id. */
export const REVEAL_PHASES = {
  mind: { id: 'mind', start: 0.0, end: 0.2, label: 'Mind Realm' },
  body: { id: 'body', start: 0.2, end: 0.4, label: 'Body Realm' },
  heart: { id: 'heart', start: 0.4, end: 0.6, label: 'Heart Realm' },
  spirit: { id: 'spirit', start: 0.6, end: 0.8, label: 'Spirit Realm' },
  soul: { id: 'soul', start: 0.8, end: 1.0, label: 'Soul Realm' },
}

/** `{ rampStart, rampDuration }` for the object-reveal slice of a phase (after label-out finishes). */
export function phaseObjectWindow(phase) {
  const span = phase.end - phase.start
  const labelFrac = PHASE_LABEL_IN_FRAC + PHASE_LABEL_HOLD_FRAC + PHASE_LABEL_OUT_FRAC
  const rampStart = phase.start + span * labelFrac
  return { rampStart, rampDuration: phase.end - rampStart }
}

/** [0,1] label opacity curve for a phase: ease-in fade-in, hold, ease-out fade-out, else 0. */
export function phaseLabelOpacity(t, phase) {
  const span = phase.end - phase.start
  const u = (t - phase.start) / span
  if (u < 0 || u >= 1) return 0
  const inEnd = PHASE_LABEL_IN_FRAC
  const holdEnd = inEnd + PHASE_LABEL_HOLD_FRAC
  const outEnd = holdEnd + PHASE_LABEL_OUT_FRAC
  if (u < inEnd) return easeInOutCubic(u / inEnd)
  if (u < holdEnd) return 1
  if (u < outEnd) return 1 - easeInOutCubic((u - holdEnd) / PHASE_LABEL_OUT_FRAC)
  return 0
}

/* ───────────────────────── Derived ramps for existing scene wrappers ─────────────────────────
 * Kept as named exports so consumers (DesertGlb, SceneMoon3D, SceneSun3D, SandAirFog, DesertScene)
 * import a stable shape. Each derives from REVEAL_PHASES + phaseObjectWindow above — so a
 * timeline tweak (e.g. shifting Heart) propagates to palms / oasis / fog without manual edits.
 */

const heartObjectWindow = phaseObjectWindow(REVEAL_PHASES.heart)
const spiritObjectWindow = phaseObjectWindow(REVEAL_PHASES.spirit)
const soulObjectWindow = phaseObjectWindow(REVEAL_PHASES.soul)

/** Coconut palms + oasis water + pool hover — share the Heart phase object window. */
export const PALM_OASIS_RAMP_START = heartObjectWindow.rampStart
export const PALM_OASIS_RAMP_DURATION = heartObjectWindow.rampDuration

/** Sun (Spirit) reveal envelope — celestial pair was previously fused; now split per realm. */
export const SUN_RAMP_START = spiritObjectWindow.rampStart
export const SUN_RAMP_DURATION = spiritObjectWindow.rampDuration

/** Moon (Soul) reveal envelope — final phase before horizon hotspot. */
export const MOON_RAMP_START = soulObjectWindow.rampStart
export const MOON_RAMP_DURATION = soulObjectWindow.rampDuration

/**
 * Sand / dust haze: ramp across the back half of the reveal (Heart → Soul) so haze still reads
 * on screen but never veils a phase before its label has finished playing.
 */
export const FOG_RAMP_START = REVEAL_PHASES.heart.start
export const FOG_RAMP_DURATION = REVEAL_PHASES.soul.end - REVEAL_PHASES.heart.start

/** DOM horizon hotspot: show only after fog + reveal have essentially finished (normalized `t`). */
export const HORIZON_REVEAL_T = 0.995
