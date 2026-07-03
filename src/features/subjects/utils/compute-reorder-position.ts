import { arrayMove } from '@dnd-kit/sortable'

import { midpoint } from '@/features/subjects/utils/midpoint'
import type { SubjectNoteSummaryT } from '@/features/subjects/types'

// The drag-to-reorder seam: given the position-DESC list and a move from oldIndex→newIndex,
// returns the reordered array with the moved row stamped with its new fractional position.
// Extracted from the sidebar so the component, the unit test, and the integration test all
// run the SAME neighbor-selection + midpoint math — a copy in the test would drift from the
// component and re-open the direction bug it guards. Position is minted DESC (see midpoint).
export function computeReorderPosition(
  items: SubjectNoteSummaryT[],
  oldIndex: number,
  newIndex: number,
): { reordered: SubjectNoteSummaryT[]; position: number } {
  const reordered = arrayMove(items, oldIndex, newIndex)
  const position = midpoint(
    reordered[newIndex - 1]?.position ?? undefined,
    reordered[newIndex + 1]?.position ?? undefined,
    items[oldIndex].position ?? 0,
  )
  reordered[newIndex] = { ...reordered[newIndex], position }
  return { reordered, position }
}
