'use client'

import { useRouter } from 'next/navigation'

import { Combobox } from '@/components/ui/combobox'
import type { SubjectOptionT } from '@/features/subjects/types'

type SubjectSwitcherPropsT = { subjects: SubjectOptionT[]; currentId: string }

export function SubjectSwitcher({ subjects, currentId }: SubjectSwitcherPropsT) {
  const router = useRouter()

  return (
    <Combobox
      options={subjects.map((subject) => ({ value: subject.id, label: subject.title }))}
      value={currentId}
      onChange={(id) => router.push(`/subjects/${id}`)}
      searchPlaceholder="Search subjects…"
      emptyMessage="No subjects."
      className="w-fit max-w-72"
    />
  )
}
