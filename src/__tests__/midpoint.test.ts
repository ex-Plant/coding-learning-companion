import { describe, expect, it } from 'vitest'

import { midpoint } from '@/features/subjects/utils/midpoint'

// Guards the fractional-ordering math shared by the subject ToC + docs-view sidebar.
// The sidebar renders notes position-DESC (index 0 = highest position), and passes the
// neighbor ABOVE the drop as `prev` (higher position) and the neighbor BELOW as `next`
// (lower position). So `prev >= next` always, and a valid new position must satisfy
// prev > result > next — top drops must exceed the current max, bottom drops must fall
// below the current min. The single-neighbor branches must respect that DESC direction.
describe('midpoint', () => {
  it('averages two neighbors (drop in the middle)', () => {
    expect(midpoint(2, 4, 0)).toBe(3)
    expect(midpoint(1, 2, 0)).toBe(1.5)
  })

  it('exceeds the below-neighbor when dropped at the top (no prev)', () => {
    // Top of a DESC list → must be greater than the old max so it re-sorts to the top.
    expect(midpoint(undefined, 4, 99)).toBeGreaterThan(4)
  })

  it('falls below the above-neighbor when dropped at the bottom (no next)', () => {
    // Bottom of a DESC list → must be less than the old min so it re-sorts to the bottom.
    expect(midpoint(8, undefined, 99)).toBeLessThan(8)
  })

  it('falls back to the original position when there are no neighbors', () => {
    expect(midpoint(undefined, undefined, 5)).toBe(5)
  })

  it('keeps shrinking the gap on repeated middle inserts', () => {
    const a = midpoint(1, 2, 0) // 1.5
    const b = midpoint(1, a, 0) // 1.25
    expect(a).toBe(1.5)
    expect(b).toBe(1.25)
    expect(b).toBeGreaterThan(1)
    expect(b).toBeLessThan(a)
  })
})
