import type { ReactNode } from 'react'

import { LogoWithName } from '@/components/logo/logo-with-name'
import { IntroProvider } from '@/components/logo/intro-provider'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <IntroProvider>
      <main className="flex min-h-svh items-center justify-center p-4">
        <div className="grid w-full max-w-sm gap-8">
          <LogoWithName
            logoClassName="size-14 md:size-16"
            nameClassName="mt-2 font-mono text-2xl font-semibold tracking-tight md:text-3xl"
          />
          {children}
        </div>
      </main>
    </IntroProvider>
  )
}
