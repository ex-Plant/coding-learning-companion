'use server'

import { revalidatePath } from 'next/cache'

import { insertNoteWithCards } from '@/features/notes/insert-note-with-cards'
import { createNoteWithCardsSchema } from '@/features/notes/schemas'
import { createClient } from '@/lib/supabase/create-server-client'
import { validateInput } from '@/lib/validate'
import type { RedirectResultT } from '@/types/action'

// Cookie-client entry point; the note+cards write lives in insertNoteWithCards (shared with POST /api/notes).
export async function createNote(input: unknown): Promise<RedirectResultT> {
  const parsed = validateInput(createNoteWithCardsSchema, input)
  if (!parsed.success) return parsed

  const supabase = await createClient()
  let newId: string
  try {
    newId = await insertNoteWithCards(supabase, parsed.data)
  } catch (error) {
    console.error('[createNote] create_note_with_cards error', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note',
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: `/notes/${newId}` }
}
