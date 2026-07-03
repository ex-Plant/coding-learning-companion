'use server'

import { z } from 'zod'

import { getNotesForLinking } from '@/features/notes/queries'
import { validateInput } from '@/lib/validate'

// Server-Action wrapper because queries are server-only; shape-only validation, RLS owns ownership.
const subjectFilterSchema = z.guid('Invalid subject id').nullable()

export async function getNotesForLinkingAction(
  subjectId: string | null,
): Promise<{ id: string; title: string | null }[]> {
  const parsed = validateInput(subjectFilterSchema, subjectId)
  if (!parsed.success) return []
  return getNotesForLinking(parsed.data)
}
