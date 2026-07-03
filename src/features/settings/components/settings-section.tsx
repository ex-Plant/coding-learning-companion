import type { ReactNode } from 'react'

import { MutedText } from '@/components/ui/muted-text'
import { cn } from '@/lib/utils'

type SettingsSectionPropsT = {
  title: string
  description: ReactNode
  children: ReactNode
  variant?: 'default' | 'danger'
  className?: string
}

export function SettingsSection({
  title,
  description,
  children,
  variant = 'default',
  className,
}: SettingsSectionPropsT) {
  const isDanger = variant === 'danger'

  return (
    <section
      className={cn(
        'grid w-full gap-3 rounded-lg border p-4',
        isDanger && 'border-destructive/30',
        className,
      )}
    >
      <div className="grid gap-1">
        <h2 className={cn('text-lg font-medium', isDanger && 'text-destructive')}>{title}</h2>
        <MutedText>{description}</MutedText>
      </div>
      {children}
    </section>
  )
}
