---
change_id: note-detail-consolidation
title: In-place note edit and streamed memory cards in the subject note pane
status: archived
created: 2026-07-03
updated: 2026-07-03
archived_at: 2026-07-03T14:40:46Z
---

## Notes

Bring in-place note edit and streamed memory cards into the subject note pane; extract a shared NoteMemoryCards Suspense wrapper adopted by both /subjects/[id]/[noteId] and /notes/[id].

### Settled design (from brainstorming)

- **Extract** `features/memory-cards/components/note-memory-cards.tsx` — async server component that self-fetches `[getMemoryCardsForNote, getOpenRouterStatus, getResolvedSystemPrompts]` and renders `PromptDefaultsProvider > MemoryCardsSection`. This becomes the single card-rendering path.
- **Suspense-stream, no toggle, no searchParam.** Cards render below the note wrapped in `<Suspense fallback={<Spinner/>}>`. The fetch lives _inside_ the Suspense child so the note body streams first; cards fill in after. On-demand fetch-deferral (`?cards` / server-action toggle) was explicitly rejected in favor of "simplest, see if it's fast enough."
  - Why a client toggle can't defer the load: `MemoryCardsSection` pre-renders card bodies through server-only Shiki `RenderMarkdown`; a server component runs once at request time, client state can't re-run it. Suspense streams but does not defer the fetch — accepted.
- **`/subjects/[id]/[noteId]/page.tsx`** — reads `?edit=note` (segment gets `searchParams`). Read mode = `RenderMarkdown` + streamed `NoteMemoryCards`. Edit mode = `NoteForm` with **eager** linked-cards. Edit button becomes `?edit=note` on the current URL (stops bouncing to `/notes/[id]`). Delete stays in place.
- **`/notes/[id]/page.tsx`** — adopt the same streamed `NoteMemoryCards`; drop eager cards/ai/prompts from its top-level `Promise.all`. Stays the home for subjectless notes (`subject_id` is nullable — the reason this route can't be deleted).
- **Edit-mode linked-cards stay eager.** `NoteForm`'s move/unlink dialog reads `linkedCards` (`{id, prompt}[]`) synchronously on Save (opens only when subject changed AND `linkedCards.length > 0`), so it can't be Suspense-streamed. Unchanged from today.
- **Post-move nav:** editing a note from the subject pane and MOVING it to another subject redirects to `/subjects/<newSubjectId>/<noteId>` — follow the note.

### Open for planning

- Preserve the `?edit=note` cancel/redirect ergonomics on the subject route (Cancel → back to read view at `/subjects/[id]/[noteId]`).
- Confirm `getSubjects` etc. dedupe across layout + page renders (React `cache`), or fetch only what the page needs.
- E2E/regression: the move/unlink dialog now reachable from the subject route.
