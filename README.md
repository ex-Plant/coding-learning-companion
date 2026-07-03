# eggplant_notes

A personal learning companion. Keep markdown **notes** on whatever you're learning,
group them into **subjects**, and turn them into spaced-repetition **memory cards** so
the material actually sticks. Every card links back to the note it came from, so a review
session always has a path back to the full context.

It's a solo-MVP web app (installable as a PWA) with three things worth calling out:

- **Spaced repetition that works** — cards are scheduled with the [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) algorithm, not fixed intervals.
- **Bring-your-own-key AI** — connect your own [OpenRouter](https://openrouter.ai) key to generate notes and cards from a topic or imported text. Generation runs server-side, your key is encrypted at rest, and every result is preview-gated (you review and edit before anything saves).
- **A token-authenticated HTTP API** — drive the whole thing from your own CLI or coding agent. Settings even hands you a ready-made agent skill with your base URL baked in.

The full user-facing walkthrough lives in the in-app **/faq** page.

## Tech stack

| Layer       | Choice                                                              |
| ----------- | ------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack) · React 19                       |
| Language    | TypeScript                                                          |
| Data + auth | Supabase (Postgres, RLS, Auth)                                      |
| Styling     | Tailwind CSS v4 · shadcn/ui                                         |
| Forms       | TanStack Form                                                       |
| AI          | Vercel AI SDK v6 + OpenRouter (BYOK)                                |
| Scheduling  | ts-fsrs                                                             |
| Tests       | Vitest (unit + integration) · Playwright (E2E) · Stryker (mutation) |
| Hosting     | Vercel (`fra1`)                                                     |

More detail: [`context/foundation/tech-stack.md`](context/foundation/tech-stack.md).

## Local development

Toolchain is managed with [mise](https://mise.jdx.dev) (Node 24, pnpm 11, Supabase CLI).
**Use `pnpm`, never `npm`/`npx`** — there is no `package-lock.json`.

```bash
mise install          # provision node / pnpm / supabase CLI (mise.toml)
pnpm install          # install dependencies
supabase start        # start the local Supabase stack (runs on the host, not Docker)
pnpm dev              # http://localhost:3000
```

Local dev uses a **local** Supabase stack with its own keys in `.env.local` — never the
hosted prod/preview credentials. Two seeded accounts are available after `supabase db reset`:
`dev@example.com` / `password123` and `test@gmail.com` / `test@Test`.

### Common scripts

| Command                     | Does                                                            |
| --------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                  | Dev server (Turbopack)                                          |
| `pnpm build` / `pnpm start` | Production build / serve                                        |
| `pnpm typecheck`            | `tsc --noEmit`                                                  |
| `pnpm lint` · `pnpm format` | ESLint · Prettier check                                         |
| `pnpm test`                 | Vitest unit specs                                               |
| `pnpm test:integration`     | Supabase-backed integration specs (`RUN_INTEGRATION=1`)         |
| `pnpm test:e2e`             | Playwright E2E (needs `supabase start`; auto-runs a prod build) |
| `pnpm db:types`             | Regenerate `src/lib/supabase/types.ts` from the local DB        |

## API

A small token-authenticated HTTP API lets a CLI or coding agent read, create, update, and
delete your content. Authenticate with an `Authorization: Bearer egg_…` token minted in
Settings.

| Method                     | Endpoint                 | Purpose                                             |
| -------------------------- | ------------------------ | --------------------------------------------------- |
| `GET` / `POST`             | `/api/subjects`          | List / create subjects                              |
| `PATCH` / `DELETE`         | `/api/subjects/{id}`     | Rename / delete a subject                           |
| `GET` / `POST`             | `/api/notes`             | List (`?subject=`) / create notes                   |
| `GET` / `PATCH` / `DELETE` | `/api/notes/{id}`        | Read / edit / delete a note                         |
| `GET` / `POST`             | `/api/memory-cards`      | List (`?note`/`?subject`/`?unfiled`) / create cards |
| `PATCH` / `DELETE`         | `/api/memory-cards/{id}` | Edit / delete a card                                |
| `GET`                      | `/api/skill`             | Download the agent skill documenting this API       |

The in-app UI and these routes share the same `*-core.ts` mutation modules, so a Server
Action can't drift from its API route. `GET /api/skill` serves a ready-made skill for
external coding agents.

## Testing

Risk-first, layered per the quality contract in
[`context/foundation/test-plan.md`](context/foundation/test-plan.md): Vitest for pure
logic, Supabase-backed integration specs for the data layer and RLS, Playwright for
browser-level flows, and a scoped Stryker mutation gate. Tests map to concrete risks
(e.g. FSRS misscheduling, cross-user RLS isolation, markdown XSS) — the plan names each.

## Documentation

The project is built from its written foundation in
[`context/foundation/`](context/foundation/):

- [`prd-v2.md`](context/foundation/prd-v2.md) — product requirements (problem, scope, functionality)
- [`roadmap.md`](context/foundation/roadmap.md) — build slices + what's shipped
- [`tech-stack.md`](context/foundation/tech-stack.md) — stack and versions
- [`test-plan.md`](context/foundation/test-plan.md) — risk map + test strategy

Agent/contributor onboarding lives in [`AGENTS.md`](AGENTS.md).
