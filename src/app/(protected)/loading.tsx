import { Spinner } from '@/components/ui/spinner'

export default function ProtectedLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Spinner className="size-8" />
    </div>
  )
}
