'use client'

import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

// Selects the card for the in-place review panel via `?review=<id>` (filters preserved). `scroll: false`
// keeps Next from hard-jumping to the top — ReviewCardTransition smooth-scrolls the swapped card into
// view once it mounts (scrolling here would fire before the new card has loaded).
export function ReviewCardButton({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const onReview = () => {
    const params = new URLSearchParams(searchParams)
    params.set('review', id)
    router.replace(`/memory-cards?${params}`, { scroll: false })
  }

  return (
    <Button variant="outline" size="sm" onClick={onReview}>
      Review
    </Button>
  )
}
