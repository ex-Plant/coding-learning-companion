import type { PostgrestFilterBuilder } from '@supabase/supabase-js'

import { NO_SUBJECT_VALUE } from '@/features/subjects/constants'

// Applies the subject multiselect to a notes/memory_cards builder, honoring the NO_SUBJECT_VALUE
// sentinel (unfiled = `subject_id IS NULL`) that a plain `.in('subject_id', …)` structurally
// excludes. Shared by getNotes and applyCardFilters so both browse views filter unfiled items the
// same way. Generic over the concrete builder T — the `any` bound only relaxes postgrest-js's
// per-position variance (same trick applyCardFilters uses); T stays inferred so call sites keep
// their projection→row typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySubjectIdFilter<T extends PostgrestFilterBuilder<any, any, any, any>>(
  query: T,
  subjectIds?: string[],
): T {
  if (!subjectIds || subjectIds.length === 0) return query
  const includeUnfiled = subjectIds.includes(NO_SUBJECT_VALUE)
  const realIds = subjectIds.filter((id) => id !== NO_SUBJECT_VALUE)
  // Both a real subject AND unfiled picked: OR them so NULL rows (which `.in` can't reach) join the
  // subject rows. A second `.or()` for search ANDs with this — PostgREST combines distinct params.
  if (includeUnfiled && realIds.length > 0) {
    return query.or(`subject_id.in.(${realIds.join(',')}),subject_id.is.null`)
  }
  if (includeUnfiled) return query.is('subject_id', null)
  return query.in('subject_id', realIds)
}
