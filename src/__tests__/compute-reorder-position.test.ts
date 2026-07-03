import { describe, expect, it } from 'vitest'

import { computeReorderPosition } from '@/features/subjects/utils/compute-reorder-position'
import type { SubjectNoteSummaryT } from '@/features/subjects/types'

// Guards the drag-reorder SEAM that midpoint alone can't: neighbor selection against the
// position-DESC list the sidebar renders. The invariant that matters is round-trip — after a
// drag, re-sorting the notes position-DESC (what getSubjectNoteSummaries does on refetch) must
// reproduce the order the user dragged into. midpoint's edge-direction bug surfaced exactly here.
const note = (id: string, position: number): SubjectNoteSummaryT => ({ id, title: id, position })

// Mirror getSubjectNoteSummaries: position DESC. Assign the minted position onto the moved row,
// re-sort the whole set, and read back the id order.
function idsAfterRefetch(
  items: SubjectNoteSummaryT[],
  movedId: string,
  position: number,
): string[] {
  return items
    .map((i) => (i.id === movedId ? { ...i, position } : i))
    .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    .map((i) => i.id)
}

describe('computeReorderPosition', () => {
  // DESC display: c (300) on top, a (100) at bottom.
  const items = [note('c', 300), note('b', 200), note('a', 100)]

  it('drag to the top survives a DESC refetch (top → highest position)', () => {
    const { position } = computeReorderPosition(items, 2, 0) // move 'a' from bottom to top
    expect(idsAfterRefetch(items, 'a', position)).toEqual(['a', 'c', 'b'])
  })

  it('drag to the bottom survives a DESC refetch (bottom → lowest position)', () => {
    const { position } = computeReorderPosition(items, 0, 2) // move 'c' from top to bottom
    expect(idsAfterRefetch(items, 'c', position)).toEqual(['b', 'a', 'c'])
  })

  it('drag into the middle lands between the new neighbors', () => {
    const { position } = computeReorderPosition(items, 0, 1) // move 'c' between b and a
    expect(idsAfterRefetch(items, 'c', position)).toEqual(['b', 'c', 'a'])
  })
})
