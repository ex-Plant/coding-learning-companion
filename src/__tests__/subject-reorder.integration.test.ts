import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'

import { ANON_KEY, JWT_SECRET, SUPABASE_URL } from './local-supabase-creds'
import type { Database } from '@/lib/supabase/types'

// Integration for the drag-reorder SEAM the unit tests can't cross: real DESC query
// (getSubjectNoteSummaries) + numeric-column write + the real client-side drag math
// (computeReorderPosition). The original bug lived here — a top/bottom drop computed a position
// that refetched at the WRONG end. Asserts the PERSISTED order (refetch), not the write's return.
// Skipped unless RUN_INTEGRATION=1. Run: pnpm test:integration (requires `supabase start`).
const RUN = !!process.env.RUN_INTEGRATION

describe.skipIf(!RUN)('subject note reorder (integration)', () => {
  // getSubjectNoteSummaries → create-server-client → env eager-parses its whole schema on import,
  // so every schema var must be set before the dynamic imports below (this test sends no email).
  process.env.NEXT_PUBLIC_SUPABASE_URL ??= SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= ANON_KEY
  process.env.NEXT_PUBLIC_SITE_URL ??= 'http://localhost:3000'
  process.env.SUPABASE_JWT_SECRET ??= JWT_SECRET
  process.env.NEXT_PUBLIC_EMAIL_USER ??= 'noreply@example.com'
  process.env.EMAIL_HOST ??= 'localhost'
  process.env.EMAIL_PASS ??= 'x'
  process.env.EMAIL_TO ??= 'noreply@example.com'
  process.env.OPENROUTER_ENC_KEY ??= Buffer.alloc(32).toString('base64')

  let getSubjectNoteSummaries: typeof import('@/features/subjects/queries').getSubjectNoteSummaries
  let computeReorderPosition: typeof import('@/features/subjects/utils/compute-reorder-position').computeReorderPosition

  beforeAll(async () => {
    ;({ getSubjectNoteSummaries } = await import('@/features/subjects/queries'))
    ;({ computeReorderPosition } =
      await import('@/features/subjects/utils/compute-reorder-position'))
  })

  let seq = 0
  // Seed a fresh owner + subject + three notes with ascending positions (DESC display: c, b, a).
  // `asUser` mints a fresh RLS-scoped client per call so each getSubjectNoteSummaries hits the DB
  // (the query is React-`cache`d; a distinct client arg dodges memoization on refetch).
  async function seed(): Promise<{ subjectId: string; asUser: () => SupabaseClient<Database> }> {
    const signup = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const email = `reorder_${Date.now()}_${seq++}@example.com`
    const { data, error } = await signup.auth.signUp({ email, password: 'password123' })
    if (error || !data.session) throw error ?? new Error('signUp returned no session')
    const token = data.session.access_token
    const asUser = () =>
      createClient<Database>(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      })

    const { data: subject, error: sErr } = await asUser()
      .from('subjects')
      .insert({ title: `reorder-${email}` })
      .select('id')
      .single()
    if (sErr || !subject) throw sErr ?? new Error('subject insert returned no row')

    const { error: nErr } = await asUser()
      .from('notes')
      .insert([
        { title: 'a', subject_id: subject.id, position: 100 },
        { title: 'b', subject_id: subject.id, position: 200 },
        { title: 'c', subject_id: subject.id, position: 300 },
      ])
    if (nErr) throw nErr
    return { subjectId: subject.id, asUser }
  }

  it('a note dragged to the top stays first after refetch', async () => {
    const { subjectId, asUser } = await seed()
    const before = await getSubjectNoteSummaries(subjectId, asUser())
    expect(before.map((n) => n.title)).toEqual(['c', 'b', 'a'])

    // Drag the bottom note to the top using the real sidebar math, then persist that one row.
    const bottom = before.length - 1
    const { position } = computeReorderPosition(before, bottom, 0)
    const { error } = await asUser().from('notes').update({ position }).eq('id', before[bottom].id)
    expect(error).toBeNull()

    const after = await getSubjectNoteSummaries(subjectId, asUser())
    expect(after.map((n) => n.title)).toEqual(['a', 'c', 'b'])
  })

  it('a note dragged to the bottom stays last after refetch', async () => {
    const { subjectId, asUser } = await seed()
    const before = await getSubjectNoteSummaries(subjectId, asUser())

    const { position } = computeReorderPosition(before, 0, before.length - 1)
    const { error } = await asUser().from('notes').update({ position }).eq('id', before[0].id)
    expect(error).toBeNull()

    const after = await getSubjectNoteSummaries(subjectId, asUser())
    expect(after.map((n) => n.title)).toEqual(['b', 'a', 'c'])
  })
})
