'use server'

import { revalidatePath } from 'next/cache'

import { noteIdSchema, noteInputSchema } from '@/features/notes/schemas'
import { updateNoteCore, type CardActionsT } from '@/features/notes/update-note-core'
import { createClient } from '@/lib/supabase/create-server-client'
import { validateInput } from '@/lib/validate'
import type { ActionResultT } from '@/types/action'

// Cookie-client entry point; the patch/subject-change/card fan-out lives in updateNoteCore (shared with PATCH /api/notes/:id).
export async function updateNote(
  id: string,
  input: unknown,
  cardActions?: CardActionsT,
): Promise<ActionResultT> {
  const parsedId = validateInput(noteIdSchema, id)
  if (!parsedId.success) return parsedId
  const parsed = validateInput(noteInputSchema, input)
  if (!parsed.success) return parsed

  const supabase = await createClient()
  const result = await updateNoteCore(supabase, parsedId.data, parsed.data, cardActions)
  if ('error' in result) return { success: false, error: result.error }

  revalidatePath('/', 'layout')
  return { success: true }
}
