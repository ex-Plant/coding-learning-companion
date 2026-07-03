// Fractional midpoint for a note dropped between its new neighbors (no sequence rebalance).
// The caller lists notes position-DESC and passes the neighbor ABOVE as `prev` (higher) and
// the one BELOW as `next` (lower), so branches must mint in the DESC direction: a top drop
// (no `prev`) must exceed the max, a bottom drop (no `next`) must fall below the min.
// Known degeneracy: repeated midpoints between two close values exhaust float precision —
// accepted.
export function midpoint(
  prev: number | undefined,
  next: number | undefined,
  fallback: number,
): number {
  if (prev !== undefined && next !== undefined) return (prev + next) / 2
  if (next !== undefined) return next + 1
  if (prev !== undefined) return prev / 2
  return fallback
}
