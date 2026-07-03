// A note's canonical route: nested under its subject when it has one, else the bare /notes/[id]
// page (unassigned notes have no /subjects/[id]/[noteId] route). One owner so the source link, the
// eyebrow, and the follow-the-note redirect can't drift.
export function noteHref(noteId: string, subjectId: string | null) {
  return subjectId ? `/subjects/${subjectId}/${noteId}` : `/notes/${noteId}`
}
