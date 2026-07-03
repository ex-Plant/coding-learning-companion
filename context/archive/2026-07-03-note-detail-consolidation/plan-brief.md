# Note Detail Consolidation — Plan Brief

> Full plan: `context/changes/note-detail-consolidation/plan.md`

## What & Why

Let a note be read, edited, and have its memory cards viewed directly inside the subject note pane (`/subjects/[id]/[noteId]`), instead of bouncing to `/notes/[id]` to edit or see cards. Cards stream in with Suspense so they never delay the note body, and one shared `NoteMemoryCards` wrapper serves both routes so they can't drift.

## Starting Point

The subject pane is read-only today: its **Edit** button navigates away to `/notes/[id]?edit=note`, and it shows no memory cards. `/notes/[id]` is the only surface with in-place edit + cards, and it fetches cards eagerly in both read and edit modes. Notes can be subjectless (`subject_id` nullable), so `/notes/[id]` stays alive as their home.

## Desired End State

Reading a note in a subject shows the body immediately with cards streaming in below; **Edit** flips the same pane to an in-place form (`?edit=note`, no route change); saving returns to the read view; moving the note to another subject follows it into that subject's pane. `/notes/[id]` is unchanged except cards now stream and are hidden while editing.

## Key Decisions Made

| Decision               | Choice                                  | Why                                                                                                | Source     |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| Card loading           | Suspense stream, no toggle/param        | Simplest; cards can't lazy-_fetch_ client-side (server-only Shiki), so just make them non-blocking | Brainstorm |
| Two note surfaces      | Keep both; share only `NoteMemoryCards` | Subjectless notes need `/notes/[id]`; shells diverge, only the card block is truly shared          | Brainstorm |
| Cards during edit      | Hide (form only), both routes           | Avoids a redundant fetch + declutters the edit view                                                | Plan       |
| Post-move nav          | Follow the note to its new subject pane | The note is what the user cares about                                                              | Brainstorm |
| Edit-mode linked-cards | Stay eager                              | The move/unlink dialog reads them synchronously on Save                                            | Plan       |

## Scope

**In scope:** shared `NoteMemoryCards` wrapper; `/notes/[id]` adopts it (stream + hide-on-edit); subject pane gains `?edit=note` + streamed cards + follow-the-note; one optional `NoteForm` nav prop.

**Out of scope:** lazy card _fetching_; sharing the note header/body shell; changes to `updateNote`/`updateNoteCore`/move dialog; query `cache()`-wrapping; card creation/AI/review surfaces.

## Architecture / Approach

New async server component `NoteMemoryCards` self-fetches `[cards, openRouterStatus, systemPrompts]` and renders `PromptDefaultsProvider > MemoryCardsSection`. Each route drops it inside `<Suspense fallback={<Spinner/>}>` in read mode so the note streams first. The subject page reads `?edit=note` (segments get `searchParams`) to swap `RenderMarkdown` ↔ `NoteForm`; a `buildSavedHref` prop on `NoteForm` redirects on save for the subject route only.

## Phases at a Glance

| Phase                                 | What it delivers                                                              | Key risk                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Extract & stream `NoteMemoryCards` | Shared wrapper + `/notes/[id]` streams cards / hides them on edit             | Ensuring eager card fetch only runs in edit mode          |
| 2. Enrich subject pane                | In-place edit + streamed cards + follow-the-note in `/subjects/[id]/[noteId]` | `NoteForm` nav prop must not alter `/notes/[id]` behavior |

**Prerequisites:** none (no schema/data changes).
**Estimated effort:** ~1 session, 2 phases.

## Open Risks & Assumptions

- `NoteForm`'s new optional prop must leave `/notes/[id]` (which omits it) byte-for-byte in behavior.
- Streaming perf is assumed "good enough"; if a note's card render is slow the spinner is the fallback, and lazy-fetch remains a deferred escape hatch.
- Move/unlink dialog is now reachable from a second route — manual verification covers it; an E2E spec is a flagged follow-up.

## Success Criteria (Summary)

- Read a note in a subject → body first, cards stream in.
- Edit/save/move a note without leaving the subject; a move follows the note to its new subject.
- `/notes/[id]` (incl. subjectless notes) works exactly as before, minus eager/always-on cards.
