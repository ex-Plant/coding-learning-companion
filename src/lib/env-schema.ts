import { z } from 'zod'

// Plain schema source — no side effects, no `import 'server-only'`. Both the client (`env.ts`) and
// server (`env.server.ts`) env entries import these schemas; the eager parse in `env.server.ts` is
// pulled into the root layout, so a missing/malformed server var fails `next build`.
//
// Var names mirror the portfolio repo so existing SMTP values copy over 1:1. The sender/from
// address is public there (`NEXT_PUBLIC_EMAIL_USER`); only host/pass/to are secret.

// z.url() (like new URL()) silently normalizes an http(s) scheme missing its `//` authority
// separator — 'https:host' parses as protocol 'https:' + path 'host' and passes. The malformed
// value then breaks when emitted as a raw href/redirect (a baked 'https:host' reset link resolves
// relative to the mail client's domain → 404). These are all http(s) deployment URLs, so require
// the literal '//'. Regression caught in the portfolio repo's NEXT_PUBLIC_FRONTEND_URL.
const httpUrl = z
  .url()
  .refine((s) => /^https?:\/\//i.test(s), 'URL must include the // authority separator')

export const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: httpUrl,
  NEXT_PUBLIC_EMAIL_USER: z.email(),
})

export const serverSchema = z.object({
  EMAIL_HOST: z.string().min(1),
  // Signs the short-lived user JWT the token API mints (mint-user-jwt.ts) so an `egg_` request runs
  // under RLS. The root layout's eager env.server parse runs serverSchema at build start, so a missing
  // secret fails fast there instead of as an opaque runtime 500 from a token API call. HS256 secrets ≥ 32 chars.
  SUPABASE_JWT_SECRET: z.string().min(32),
  EMAIL_PASS: z.string().min(1),
  EMAIL_TO: z.email(),
  // AES-256-GCM master key for the per-user OpenRouter key at rest (aes-gcm.ts). Build-validated for
  // presence here so a missing key fails `next build` instead of throwing only when a user first
  // connects/uses a key; the 32-byte base64 decode is still checked at call time in getKey().
  OPENROUTER_ENC_KEY: z.string().min(1),
  // Set to '1' ONLY by the Playwright webServer (playwright.config.ts) so server code can skip real
  // outbound side-effects (the new-user operator email) during E2E, which signs up many real
  // accounts. Optional — absent everywhere except the E2E server process.
  E2E: z.string().optional(),
})
