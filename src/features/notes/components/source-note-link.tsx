import { ContextLink } from '@/components/ui/context-link'
import { noteHref } from '@/features/notes/utils/note-href'

type PropsT = {
  noteId: string
  // null for unassigned notes — they have no /subjects/[id]/[noteId] route, so the link falls
  // back to the bare /notes/[noteId] page.
  subjectId: string | null
  title: string
  className?: string
}

export function SourceNoteLink({ noteId, subjectId, title, className }: PropsT) {
  const href = noteHref(noteId, subjectId)
  return (
    <ContextLink href={href} className={className}>
      From: {title}
    </ContextLink>
  )
}
