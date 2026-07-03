import { PageShell } from '@/components/layout/page-shell'
import { ButtonLink } from '@/components/ui/button-link'
import { ContextLink } from '@/components/ui/context-link'
import { updateNote } from '@/features/notes/actions/update-note'
import { DeleteNoteButton } from '@/features/notes/components/delete-note-button'
import { NoteForm } from '@/features/notes/components/note-form'
import { NoteReadBody } from '@/features/notes/components/note-read-body'
import { getNote } from '@/features/notes/queries'
import { noteHref } from '@/features/notes/utils/note-href'
import { toLinkedCards } from '@/features/notes/utils/to-linked-cards'
import { getSubjects } from '@/features/subjects/queries'
import { getMemoryCardsForNote } from '@/features/memory-cards/queries'
import { assertFound } from '@/lib/assert-found'
import { formatLocaleDateTime } from '@/lib/utils/date'

// Next 16 `params`/`searchParams` are Promises. getNote() is RLS-scoped, so a missing OR
// not-owned id both 404. `?edit=note` swaps the form in place (no client edit state — forced
// because RenderMarkdown is an async server-only Shiki component).
export default async function NotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams
  const isEditingNote = edit === 'note'
  // Cards only feed the edit form's move/unlink dialog (linkedCards) — read mode streams them
  // separately via <NoteMemoryCards>, so the eager fetch is edit-only.
  const [note, subjects, memoryCards] = await Promise.all([
    getNote(id),
    getSubjects(),
    isEditingNote ? getMemoryCardsForNote(id) : undefined,
  ])
  assertFound(note)

  const subject = note.subject_id ? subjects.find((s) => s.id === note.subject_id) : undefined

  return (
    <PageShell
      // Edit mode shows "Edit note", not the title, which would duplicate NoteForm's title field.
      title={isEditingNote ? 'Edit note' : (note.title ?? 'Untitled')}
      eyebrow={
        !isEditingNote && subject ? (
          <ContextLink href={noteHref(note.id, subject.id)}>Open in {subject.title}</ContextLink>
        ) : undefined
      }
      subtitle={isEditingNote ? undefined : `Updated ${formatLocaleDateTime(note.updated_at)}`}
      // Read and edit share "wide": the editor needs it for the write/preview grid, and the read
      // view is matched to the in-subject note pane so a note is the same width on either path.
      width="wide"
      backHistory
      backHref="/notes"
      backLabel="Back"
      actions={
        isEditingNote ? (
          <ButtonLink href={`/notes/${note.id}`} variant="outline" size="sm">
            Cancel
          </ButtonLink>
        ) : (
          <>
            <ButtonLink href={`/notes/${note.id}?edit=note`} variant="outline" size="sm">
              Edit
            </ButtonLink>
            <DeleteNoteButton id={note.id} />
          </>
        )
      }
    >
      {isEditingNote ? (
        <NoteForm
          action={updateNote}
          note={note}
          subjects={subjects}
          linkedCards={toLinkedCards(memoryCards)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <NoteReadBody note={note} />
        </div>
      )}
    </PageShell>
  )
}
