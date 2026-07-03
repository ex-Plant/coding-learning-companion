import Link from 'next/link'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

import { AnimatedLogo } from './animated-logo'
import { Logo } from './logo'

export type LogoLinkPropsT = ComponentProps<typeof Link> & {
  size?: 'sm' | 'lg'
  // Per-call app name tweaks — e.g. the desktop nav hides the text below `lg`.
  nameClassName?: string
  // Opt in to the scatter-entrance logo (the marketing variant) in place of the static mark.
  animated?: boolean
}

// Literal lookups so Tailwind can scan the size classes (it can't read `size-${x}`).
const LOGO_SIZE = { sm: 'size-11', lg: 'size-14 md:size-16' } as const
const TEXT_SIZE = { sm: 'text-sm md:text-base', lg: 'text-2xl md:text-3xl' } as const

// Hover glow: transparent base → soft-cyan on group-hover, fading over 300ms. Tokens in globals.css.
const GLOW =
  'drop-shadow-glow-cyan-soft-off group-hover:drop-shadow-glow-cyan-soft transition duration-300'

export function LogoLink({
  size = 'sm',
  className,
  nameClassName,
  animated = false,
  ...props
}: LogoLinkPropsT) {
  const LogoIcon = animated ? AnimatedLogo : Logo
  // The mark is always a link, so the hover affordance + transition are always on.
  return (
    <Link
      aria-label="eggplant_notes"
      className={cn('group flex shrink-0 items-center gap-1', className)}
      {...props}
    >
      <LogoIcon className={cn(LOGO_SIZE[size], GLOW)} />
      <span className={cn(GLOW, 'font-mono font-semibold', TEXT_SIZE[size], nameClassName)}>
        eggplant_notes
      </span>
    </Link>
  )
}
