import { describe, expect, it } from 'vitest'
import { elapsedMs, pauseClock, resumeClock, startClock } from './timer'

describe('timestamp timer', () => {
  it('counts from the start time across a gap with no ticks', () => {
    const clock = startClock(1_000)
    expect(elapsedMs(clock, 1_000)).toBe(0)
    expect(elapsedMs(clock, 6_500)).toBe(5_500)
  })

  it('pauses and resumes without adding the time in between', () => {
    const running = startClock(0)
    const paused = pauseClock(running, 4_000)
    expect(elapsedMs(paused, 9_000)).toBe(4_000)
    const again = resumeClock(paused, 9_000)
    expect(elapsedMs(again, 11_000)).toBe(6_000)
  })
})
