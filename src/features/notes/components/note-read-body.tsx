import { Suspense } from 'react'

import { RenderMarkdown } from '@/components/markdown/render-markdown'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { NoteMemoryCards } from '@/features/memory-cards/components/note-memory-cards'
import type { NoteT } from '@/types/note'

// The read-mode body shared by both note surfaces (/notes/[id] and the subject pane): the note
// markdown, then its memory cards streamed behind Suspense so the body paints first. Returns a
// fragment — each page supplies its own gap container. Only the read body is shared; the edit
// shells (PageShell vs article, back-links, post-save nav) deliberately diverge and stay per-page.
export function NoteReadBody({ note }: { note: NoteT }) {
  return (
    <>
      <RenderMarkdown content={note.content} />

      <Separator variant="ai" className="neon-glow" />

      <Suspense fallback={<Spinner className="size-8" />}>
        <NoteMemoryCards noteId={note.id} noteTitle={note.title} noteContent={note.content ?? ''} />
      </Suspense>
    </>
  )
}
