import { Suspense } from 'react'
import { PageShell } from '@/components/layout/page-shell'
import { RenderMarkdown } from '@/components/markdown/render-markdown'
import { ButtonLink } from '@/components/ui/button-link'
import { ContextLink } from '@/components/ui/context-link'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { updateNote } from '@/features/notes/actions/update-note'
import { DeleteNoteButton } from '@/features/notes/components/delete-note-button'
import { NoteForm } from '@/features/notes/components/note-form'
import { getNote } from '@/features/notes/queries'
import { getSubjects } from '@/features/subjects/queries'
import { getMemoryCardsForNote } from '@/features/memory-cards/queries'
import { NoteMemoryCards } from '@/features/memory-cards/components/note-memory-cards'
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
          <ContextLink href={`/subjects/${subject.id}/${note.id}`}>
            Open in {subject.title}
          </ContextLink>
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
          linkedCards={(memoryCards ?? []).map((c) => ({ id: c.id, prompt: c.prompt }))}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <RenderMarkdown content={note.content} />

          <Separator variant="ai" className="neon-glow" />

          <Suspense fallback={<Spinner className="size-8" />}>
            <NoteMemoryCards
              noteId={note.id}
              noteTitle={note.title}
              noteContent={note.content ?? ''}
            />
          </Suspense>
        </div>
      )}
    </PageShell>
  )
}
