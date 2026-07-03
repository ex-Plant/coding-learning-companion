import { notFound } from 'next/navigation'

import { ButtonLink } from '@/components/ui/button-link'
import { getMemoryCardsForNote } from '@/features/memory-cards/queries'
import { updateNote } from '@/features/notes/actions/update-note'
import { DeleteNoteButton } from '@/features/notes/components/delete-note-button'
import { NoteForm } from '@/features/notes/components/note-form'
import { NoteReadBody } from '@/features/notes/components/note-read-body'
import { getNote } from '@/features/notes/queries'
import { toLinkedCards } from '@/features/notes/utils/to-linked-cards'
import { getSubjects } from '@/features/subjects/queries'

// getNote is RLS-scoped so a missing/not-owned id 404s; the subject_id guard also 404s a note
// reached via the wrong subject path. `?edit=note` swaps the form in place (same param as
// /notes/[id]); cards are fetched eagerly only in edit mode (for NoteForm's linkedCards) and
// streamed via <NoteReadBody> otherwise so the note body paints first.
export default async function SubjectReadNote({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; noteId: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id, noteId } = await params
  const { edit } = await searchParams
  const isEditingNote = edit === 'note'
  // subjects + cards only feed the edit form (subject picker + linkedCards); read mode uses neither,
  // so both fetches are gated on edit to keep the common read path off two extra table queries.
  const [note, subjects, memoryCards] = await Promise.all([
    getNote(noteId),
    isEditingNote ? getSubjects() : undefined,
    isEditingNote ? getMemoryCardsForNote(noteId) : undefined,
  ])
  if (!note || note.subject_id !== id) notFound()

  return (
    // max-w-4xl mirrors PageShell's 'wide' width so a note reads at the same measure here as on /notes/[id].
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <header className="flex items-start justify-between gap-2">
        <h2 className="min-w-0 text-xl font-semibold wrap-anywhere">
          {isEditingNote ? 'Edit note' : (note.title ?? 'Untitled')}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {isEditingNote ? (
            <ButtonLink href={`/subjects/${id}/${note.id}`} variant="outline" size="sm">
              Cancel
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href={`/subjects/${id}/${note.id}?edit=note`} variant="outline" size="sm">
                Edit
              </ButtonLink>
              <DeleteNoteButton id={note.id} redirectTo={`/subjects/${id}`} />
            </>
          )}
        </div>
      </header>

      {isEditingNote ? (
        <NoteForm
          action={updateNote}
          note={note}
          subjects={subjects ?? []}
          linkedCards={toLinkedCards(memoryCards)}
          followNoteOnSave
        />
      ) : (
        <NoteReadBody note={note} />
      )}
    </article>
  )
}
