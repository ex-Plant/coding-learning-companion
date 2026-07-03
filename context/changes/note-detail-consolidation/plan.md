# Note Detail Consolidation Implementation Plan

## Overview

Bring in-place note editing and memory cards into the subject note pane (`/subjects/[id]/[noteId]`) so a note can be read, edited, and have its cards viewed without leaving the subject context. Cards are streamed with Suspense so they never block the note body, and a single shared `NoteMemoryCards` wrapper is adopted by both the subject route and the standalone `/notes/[id]` route to prevent drift.

## Current State Analysis

- **`/subjects/[id]/[noteId]/page.tsx`** — read-only pane: title header, an **Edit** button that bounces to `/notes/[id]?edit=note`, `DeleteNoteButton` (redirects to `/subjects/[id]`), and `RenderMarkdown`. No memory cards, no in-place edit. The segment receives `searchParams` (unlike the subject _layout_, which doesn't).
- **`/notes/[id]/page.tsx`** — the "full" surface: top-level `Promise.all` eagerly fetches `[getNote, getMemoryCardsForNote, getSubjects, getOpenRouterStatus, getResolvedSystemPrompts]`, then renders read/edit (`?edit=note`) + `MemoryCardsSection` (always, in both modes). This route stays the home for **subjectless notes** (`note.subject_id` is nullable — `notes/[id]/page.tsx:41`).
- **`MemoryCardsSection`** (`memory-cards-section.tsx`) — server component; pre-renders each card body through server-only Shiki `RenderMarkdown` (`:39-44`). This is why cards can't be revealed by client state and why the note/pane split exists.
- **`NoteForm`** (`note-form.tsx`) — shared create/edit form. Edit mode reads `linkedCards` (`{id, prompt}[]`) synchronously on Save to drive the move/unlink dialog, which opens only when `subject_id` changed AND `linkedCards.length > 0` (`:116-120`). On success it stays in place and toasts "Note saved" (`:132`). Create mode navigates via `useActionNavigation`'s `navigate(result.redirectTo, ...)`.
- **`updateNote`** (`actions/update-note.ts`) — returns `ActionResultT` (`{success}`), no redirect; runs `revalidatePath('/', 'layout')` so sidebars/panes refresh after a move. `updateNoteCore` internally computes `subjectChanged` but the action doesn't surface it — the client already knows the target `subject_id`.
- **`template.tsx`** (subject `[noteId]`) — re-mounts + fade-slides the pane on every note navigation; our Suspense boundary lives inside it.
- Queries (`getNote`, `getSubjects`) are **not** `cache()`-wrapped, so layout + page fetch subjects independently — pre-existing, not changed here.

## Desired End State

- From `/subjects/[id]/[noteId]` you can read a note, click **Edit** to edit it in place (`?edit=note`, no route bounce), Save, and view its memory cards below — all within the subject shell.
- The note body paints immediately; the memory-cards section streams in behind a `Spinner`.
- Editing shows **only the form** (no card section); reading shows the streamed card section.
- Moving a note to another subject from the pane lands you on the note in its **new** subject's pane (follow-the-note); moving it to None lands on `/notes/<id>`.
- `/notes/[id]` behaves identically to today except: cards now **stream** in read mode, and the card section is **hidden during edit**. It remains the home for subjectless notes.
- Exactly one card-rendering path (`NoteMemoryCards`) feeds both routes.

**Verification:** `pnpm typecheck` + `pnpm lint` pass; note body renders before cards on both routes (observable network/stream); editing from the subject pane saves in place and returns to read view; moving a note follows it to the new subject; deleting from the pane returns to `/subjects/[id]`.

### Key Discoveries:

- The subject `[noteId]` **page** gets `searchParams` — `?edit=note` works here exactly as on `/notes/[id]` (`notes/[id]/page.tsx:21-29`).
- Cards must render server-side (Shiki) — streaming via `<Suspense>` with the fetch **inside** the boundary is the only way to make the note paint first (`memory-cards-section.tsx:39-44`).
- `NoteForm` already knows `value.subject_id` + `note.id` client-side, so follow-the-note nav needs no new server return value — just an optional client-side redirect hook (`note-form.tsx:111-133`).
- Edit mode genuinely needs eager `getMemoryCardsForNote` (for `linkedCards`); read mode does not — so the eager fetch becomes conditional on `?edit=note`.

## What We're NOT Doing

- **No** on-demand/lazy card _fetching_ (no `?cards` param, no server-action toggle). Cards fetch on every read view; Suspense only makes them non-blocking. (Explicitly chosen — revisit only if too slow.)
- **No** extraction of the note header/body/edit shell into a shared component — the two routes' shells (PageShell vs subject pane, back-links, post-save nav) genuinely diverge. Only `NoteMemoryCards` is shared.
- **No** change to `updateNote` / `updateNoteCore` / the move-unlink dialog logic.
- **No** `cache()`-wrapping of queries (pre-existing double-fetch left as-is).
- **No** change to card creation, AI generation, or FSRS/review surfaces.

## Implementation Approach

Two phases. Phase 1 extracts the shared streamed wrapper and lands it on the existing `/notes/[id]` route first (low blast radius, provable in isolation). Phase 2 uses that wrapper to enrich the subject pane and adds the one shared `NoteForm` nav hook needed for follow-the-note.

---

## Phase 1: Extract & stream `NoteMemoryCards`

### Overview

Create the shared async server wrapper and adopt it on `/notes/[id]`, moving cards behind a Suspense boundary in read mode and hiding them in edit mode.

### Changes Required:

#### 1. New shared card wrapper

**File**: `src/features/memory-cards/components/note-memory-cards.tsx` (new)

**Intent**: A self-contained async server component that fetches everything the card section needs and renders it, so any page can drop it inside `<Suspense>` without threading card/AI/prompt data through the page's own `await`.

**Contract**: `async function NoteMemoryCards({ noteId, noteTitle, noteContent }: { noteId: string; noteTitle: string | null; noteContent: string })`. Internally `Promise.all([getMemoryCardsForNote(noteId), getOpenRouterStatus(), getResolvedSystemPrompts()])`, then renders `PromptDefaultsProvider value={systemDefaults}` wrapping `MemoryCardsSection` with `noteId/noteTitle/noteContent/cards/aiEnabled/defaultModel`. Mirrors the block currently inline at `notes/[id]/page.tsx:89-100`. No `Separator` inside (the caller owns layout above it).

#### 2. Adopt on the standalone note page

**File**: `src/app/(protected)/notes/[id]/page.tsx`

**Intent**: Stop eagerly fetching cards/AI/prompts at the top level; fetch cards eagerly **only when editing** (for `NoteForm`'s `linkedCards`); render the streamed wrapper in read mode and drop the card section entirely in edit mode.

**Contract**:

- Top-level fetch becomes `Promise.all([getNote(id), getSubjects()])`; add `const memoryCards = isEditingNote ? await getMemoryCardsForNote(id) : undefined` (or fold into the conditional). `getOpenRouterStatus` / `getResolvedSystemPrompts` leave this file (now owned by `NoteMemoryCards`).
- Read mode body: `<RenderMarkdown/>` then `<Separator variant="ai" className="neon-glow"/>` then `<Suspense fallback={<Spinner className="size-8"/>}><NoteMemoryCards noteId={note.id} noteTitle={note.title} noteContent={note.content ?? ''} /></Suspense>`.
- Edit mode body: `NoteForm` only (linkedCards from the eager `memoryCards`); **no** `Separator`/card section.
- `Suspense` imported from `react`; `Spinner` from `@/components/ui/spinner`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `pnpm typecheck`
- Linting passes: `pnpm lint`
- Existing unit/integration suite passes: `pnpm test`

#### Manual Verification:

- `/notes/[id]` read view: note body renders immediately; card section appears a beat later behind a spinner.
- `/notes/[id]?edit=note`: form shows, **no** card section below it; Save works and toasts "Note saved" (unchanged behavior).
- Subjectless note still opens and edits at `/notes/[id]`.
- No regression in AI card generation / add-card from the read view.

**Implementation Note**: After Phase 1 automated checks pass, pause for human manual confirmation before Phase 2.

---

## Phase 2: Enrich the subject note pane

### Overview

Turn `/subjects/[id]/[noteId]` into a read+edit surface with streamed cards, and add the optional follow-the-note nav hook to `NoteForm`.

### Changes Required:

#### 1. Optional edit-success nav hook on `NoteForm`

**File**: `src/features/notes/components/note-form.tsx`

**Intent**: Let a caller redirect after a successful edit instead of staying in place, without changing `/notes/[id]`'s behavior (which omits the prop).

**Contract**: Add optional `buildSavedHref?: (subjectId: string | null) => string` to the **edit** variant of `NoteFormPropsT`. In `submitEdit`, after a successful `props.action(...)`: if `buildSavedHref` is present, call `navigate(props.buildSavedHref(noteInput.subject_id), 'note-saved')` (reuse the existing `useActionNavigation` `navigate`); otherwise keep the current `reportResult(result, { successMessage: 'Note saved' })`. This path is shared by both the direct-save and the move/unlink-dialog `onConfirm` routes, so follow-the-note works when a move occurred too.

#### 2. Subject note pane: read + in-place edit + streamed cards

**File**: `src/app/(protected)/subjects/[id]/[noteId]/page.tsx`

**Intent**: Read `?edit=note`; render read mode (header + markdown + streamed cards) or edit mode (edit header + form only), keep the 404 guards, and wire follow-the-note.

**Contract**:

- Signature gains `searchParams: Promise<{ edit?: string }>`; `const { edit } = await searchParams`; `const isEditingNote = edit === 'note'`.
- Keep `getNote` + `note.subject_id !== id` guard (`notFound()`). Fetch `getSubjects()` always (edit needs it; cheap). Fetch `getMemoryCardsForNote(noteId)` **only** when `isEditingNote` (for `linkedCards`).
- **Read mode**: existing `<article>` header (title `<h2>` + Edit button + `DeleteNoteButton redirectTo={/subjects/${id}}`), but the **Edit** button becomes `href={?edit=note}` on the current path (no more `/notes/[id]` bounce) — use a `ButtonLink` to `/subjects/${id}/${note.id}?edit=note`. Below `RenderMarkdown`: `<Separator variant="ai" className="neon-glow"/>` + `<Suspense fallback={<Spinner className="size-8"/>}><NoteMemoryCards .../></Suspense>`.
- **Edit mode**: header shows "Edit note" label + a **Cancel** `ButtonLink` to `/subjects/${id}/${note.id}` (drops `?edit`); body = `<NoteForm action={updateNote} note={note} subjects={subjects} linkedCards={memoryCards.map(c => ({id: c.id, prompt: c.prompt}))} buildSavedHref={(sid) => sid ? \`/subjects/${sid}/${note.id}\` : \`/notes/${note.id}\`} />`. No card section.
- Follow-the-note falls out of `buildSavedHref`: same subject → back to read view; different subject → its pane; None → `/notes/[id]`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `pnpm typecheck`
- Linting passes: `pnpm lint`
- Suite passes: `pnpm test`

#### Manual Verification:

- Subject pane read view: note renders first, cards stream in below.
- **Edit** in the pane swaps to the form in place (URL `?edit=note`, no navigation to `/notes`); **Cancel** returns to read view.
- Plain edit (no subject change) + Save → returns to read view in the same subject with updated content.
- Change subject to another subject with linked cards → move/unlink dialog appears → Save → lands on the note in the **new** subject's pane, and the old subject's sidebar no longer lists it.
- Change subject to None → lands on `/notes/<id>`.
- Delete from the pane → returns to `/subjects/[id]`.
- `/notes/[id]` still behaves as in Phase 1 (prop omitted → stay-in-place toast).

**Implementation Note**: After Phase 2 automated checks pass, pause for human manual confirmation.

---

## Testing Strategy

### Unit / Integration:

- Existing `src/__tests__/**` must stay green; the API-route and core-module tests are unaffected (no `*-core` changes).
- No new unit test is warranted for pure wiring; the risk here is browser-level (edit/move/nav), covered manually and optionally by E2E below.

### Manual Testing Steps:

1. Read a note in a subject → confirm body-before-cards streaming.
2. Edit in place → Save plain edit → back to read view, content updated.
3. Move note to another subject (with linked cards) → resolve dialog → verify follow-the-note + old sidebar drops it + card subjects updated.
4. Move note to None → verify `/notes/<id>` landing.
5. Delete from pane → `/subjects/[id]`.
6. Repeat read/edit on `/notes/[id]` (incl. a subjectless note) → confirm unchanged except streamed/hidden cards.

### Optional E2E (defer unless requested):

- A `/10x-e2e` spec covering "edit + move a note from the subject pane" would guard the multi-boundary path (routing + action + DB + dialog). Flagged as follow-up, not required for this change.

## Performance Considerations

- Streaming makes the note interactive without waiting on the (Shiki-heavy) card render — the primary win.
- Edit mode double-fetch of cards is avoided by not rendering the card section during edit (the only eager card fetch is the `linkedCards` list the form needs).

## Migration Notes

None — no schema or data changes.

## References

- Settled design + rationale: `context/changes/note-detail-consolidation/change.md`
- Inline block being extracted: `src/app/(protected)/notes/[id]/page.tsx:89-100`
- Shiki/server-only constraint: `src/features/memory-cards/components/memory-cards-section.tsx:39-44`
- Edit/move logic: `src/features/notes/components/note-form.tsx:111-133`, `src/features/notes/update-note-core.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Extract & stream NoteMemoryCards

#### Automated

- [x] 1.1 Type checking passes: `pnpm typecheck` — cdeb165
- [x] 1.2 Linting passes: `pnpm lint` — cdeb165
- [x] 1.3 Suite passes: `pnpm test` — cdeb165

#### Manual

- [x] 1.4 `/notes/[id]` read view streams cards after the note body — cdeb165
- [x] 1.5 `/notes/[id]?edit=note` shows form only; Save toasts "Note saved" — cdeb165
- [x] 1.6 Subjectless note still opens/edits at `/notes/[id]` — cdeb165
- [x] 1.7 No regression in AI card generation / add-card — cdeb165

### Phase 2: Enrich the subject note pane

#### Automated

- [x] 2.1 Type checking passes: `pnpm typecheck` — b55e6e1
- [x] 2.2 Linting passes: `pnpm lint` — b55e6e1
- [x] 2.3 Suite passes: `pnpm test` — b55e6e1

#### Manual

- [x] 2.4 Pane read view streams cards after the note body — b55e6e1
- [x] 2.5 Edit-in-place (`?edit=note`) + Cancel work without leaving the subject — b55e6e1
- [x] 2.6 Plain edit + Save returns to read view, content updated — b55e6e1
- [x] 2.7 Move to another subject → dialog → follow-the-note + old sidebar drops it — b55e6e1
- [x] 2.8 Move to None → lands on `/notes/<id>` — b55e6e1
- [x] 2.9 Delete from pane → returns to `/subjects/[id]` — b55e6e1
- [x] 2.10 `/notes/[id]` unchanged (prop omitted → stay-in-place toast) — b55e6e1
