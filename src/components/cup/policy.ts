/** When the crema loop is allowed to keep requesting frames. */
export function shouldRunCupLoop(o: {
  active: boolean
  visible: boolean
  reduced: boolean
  canvas: boolean
  hidden: boolean
}): boolean {
  return o.active && o.visible && o.canvas && !o.reduced && !o.hidden
}

/** Ease-out fill for the pour illustration. 0 at the start, 1 at durationMs. */
export function pourFill(elapsedMs: number, durationMs = 1400): number {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs))
  return 1 - (1 - t) ** 3
}

/**
 * A slight brightness shift from yield. Visual only — it does not model the cup's volume
 * or predict extraction. Classic sits near 1, the ends of the slider stay close to it.
 */
export function cremaLightness(yieldG: number, min = 15, max = 70): number {
  const span = max - min || 1
  const f = Math.min(1, Math.max(0, (yieldG - min) / span))
  return 0.92 + f * 0.16
}
