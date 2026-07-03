import type { LinkedCardT } from '@/features/notes/components/move-linked-cards-dialog'
import type { MemoryCardT } from '@/features/memory-cards/types'

// The slim {id, prompt} shape NoteForm's move/unlink dialog needs, from a note's full cards. One
// owner for the projection so both note surfaces (and any future caller) can't drift from LinkedCardT.
export function toLinkedCards(cards: MemoryCardT[] | undefined): LinkedCardT[] {
  return (cards ?? []).map((card) => ({ id: card.id, prompt: card.prompt }))
}
