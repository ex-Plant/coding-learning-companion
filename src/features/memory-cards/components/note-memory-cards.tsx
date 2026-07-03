import { MemoryCardsSection } from '@/features/memory-cards/components/memory-cards-section'
import { getMemoryCardsForNote } from '@/features/memory-cards/queries'
import { PromptDefaultsProvider } from '@/features/openrouter/components/prompt-defaults-context'
import { getOpenRouterStatus, getResolvedSystemPrompts } from '@/features/openrouter/queries'

type NoteMemoryCardsPropsT = {
  noteId: string
  noteTitle: string | null
  noteContent: string
}

// Self-fetching card block so any note surface can stream it behind <Suspense> without threading
// card/AI/prompt data through the page's own await — the fetch lives HERE so the note body paints
// first. Cards must render server-side (Shiki), so this can't be deferred by client state.
export async function NoteMemoryCards({ noteId, noteTitle, noteContent }: NoteMemoryCardsPropsT) {
  const [cards, { connected: aiEnabled, defaultModel }, systemDefaults] = await Promise.all([
    getMemoryCardsForNote(noteId),
    getOpenRouterStatus(),
    getResolvedSystemPrompts(),
  ])

  return (
    <PromptDefaultsProvider value={systemDefaults}>
      <MemoryCardsSection
        noteId={noteId}
        noteTitle={noteTitle}
        noteContent={noteContent}
        cards={cards}
        aiEnabled={aiEnabled}
        defaultModel={defaultModel}
      />
    </PromptDefaultsProvider>
  )
}
