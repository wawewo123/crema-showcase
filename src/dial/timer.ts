export type Clock = { running: boolean; anchor: number | null; offsetMs: number }

export const idleClock = (): Clock => ({ running: false, anchor: null, offsetMs: 0 })

export function startClock(now: number): Clock {
  return { running: true, anchor: now, offsetMs: 0 }
}

export function elapsedMs(clock: Clock, now: number): number {
  if (!clock.running || clock.anchor == null) return clock.offsetMs
  return clock.offsetMs + Math.max(0, now - clock.anchor)
}

export function pauseClock(clock: Clock, now: number): Clock {
  return { running: false, anchor: null, offsetMs: elapsedMs(clock, now) }
}

export function resumeClock(clock: Clock, now: number): Clock {
  if (clock.running) return clock
  return { running: true, anchor: now, offsetMs: clock.offsetMs }
}
