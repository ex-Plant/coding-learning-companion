import type { ReactNode } from 'react'

import { PageShell } from '@/components/layout/page-shell'
import { ButtonLink } from '@/components/ui/button-link'
import { MutedText } from '@/components/ui/muted-text'
import { Separator } from '@/components/ui/separator'
import { SubjectNoteSidebar } from '@/features/subjects/components/subject-note-sidebar'
import { SubjectSwitcher } from '@/features/subjects/components/subject-switcher'
import { DeleteSubjectButton } from '@/features/subjects/components/delete-subject-button'
import { getSubject, getSubjectNoteSummaries, getSubjects } from '@/features/subjects/queries'
import { assertFound } from '@/lib/assert-found'
import { pluralize } from '@/lib/utils/pluralize'

// This layout holds the persistent shell + header/sidebar; the nested [noteId] segment renders
// the active note's body, so a sidebar click is a soft RSC navigation that streams only the
// content pane. The layout+segment split is forced by RenderMarkdown being async/server-only — a
// client swap can't call it. Subject editing (?edit) lives in page.tsx since layouts get no searchParams.
export default async function SubjectLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [subject, summaries, subjects] = await Promise.all([
    getSubject(id),
    getSubjectNoteSummaries(id),
    getSubjects(),
  ])
  assertFound(subject)

  return (
    <PageShell
      title={subject.title}
      subtitle={
        <>
          <span className="block">{pluralize(summaries.length, 'note')}</span>
          <MutedText as="span" className="mt-1 block max-w-prose">
            {subject.description}
          </MutedText>
        </>
      }
      width="full"
    >
      {/* Full-width toolbar: select on the left, subject/note actions pushed to the right edge.
          Lives here (not PageShell's header) because that header column hugs its content, so
          justify-between there can't spread. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubjectSwitcher subjects={subjects} currentId={id} />
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/subjects/new">New subject</ButtonLink>
          <ButtonLink href={`/subjects/${id}?edit`} variant="outline">
            Edit subject
          </ButtonLink>
          <DeleteSubjectButton id={id} />
          <ButtonLink href={`/notes/new?subject=${id}`}>Add note</ButtonLink>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Keep the content-track min at 0: a grid-track min is a hard floor that overrides min-w-0,
          and any nonzero floor + sidebar + gap overflows <main>'s overflow-x-clip near the md
          breakpoint, clipping the note body. Sidebar is sticky (self-start). */}
      <div className="grid gap-6 md:grid-cols-[minmax(15rem,1fr)_minmax(0,64rem)]">
        {/* `relative` + inner-nav scroll (not wrapper scroll) so the bottom fade pins to the
            viewport edge instead of scrolling away — same trick as the AppNav top fade, mirrored.
            The fade itself is rendered by SubjectNoteSidebar, gated on actual overflow. */}
        <div className="relative flex flex-col gap-2 md:sticky md:top-20 md:max-h-[calc(100dvh-5rem)] md:self-start">
          <SubjectNoteSidebar subjectId={id} notes={summaries} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  )
}
