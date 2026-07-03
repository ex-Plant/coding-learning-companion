import { Spinner } from '@/components/ui/spinner'

// Not fixed inset-0 like the global loader (that covers the sidebar too); min-h gives the otherwise
// height-less content column room to center the spinner in.
export default function NoteLoading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
