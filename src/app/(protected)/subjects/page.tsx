import { PageShell } from '@/components/layout/page-shell'
import { ButtonLink } from '@/components/ui/button-link'
import { EmptyState } from '@/components/ui/empty-state'
import { getSubjectsWithFirstNote } from '@/features/subjects/queries'
import { SubjectPicker } from '@/features/subjects/components/subject-picker'

// The options carry each subject's first note id so it is opened by default. `delete-subject` also
// lands here, so a delete drops you on the picker.
export default async function SubjectsPage() {
  const subjects = await getSubjectsWithFirstNote()

  return (
    <PageShell title="Subjects" width="prose">
      {subjects.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <SubjectPicker subjects={subjects} />
          <ButtonLink href="/subjects/new" variant="outline">
            New subject
          </ButtonLink>
        </div>
      ) : (
        <EmptyState
          message="No subjects yet. Group your notes under one."
          action={{ label: 'Create your first subject', href: '/subjects/new' }}
        />
      )}
    </PageShell>
  )
}
