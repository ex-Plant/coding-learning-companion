import Link from 'next/link'

import { LogoLink } from '@/components/logo/logo-link'
import { Button } from '@/components/ui/button'
import { LandingShell } from '@/features/landing/components/landing-shell'

// pointer-events-none on the header + auto on the nav so the transparent header-fade tail stays clickable.
export function LandingNav() {
  return (
    <header className="header-fade pointer-events-none sticky top-0 z-40">
      <LandingShell as="nav" className="pointer-events-auto flex items-center justify-between py-4">
        <LogoLink href="/home" size="sm" nameClassName="hidden sm:flex" />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="ai" size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </LandingShell>
    </header>
  )
}
