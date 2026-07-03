import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { connectOpenRouter } from '@/features/openrouter/actions/connect'

// Must never be rendered inside another <form> — nested forms are invalid HTML and submit
// unpredictably (AG-3).
export function ConnectOpenRouterButton({
  className,
  testId = 'openrouter-connect',
}: {
  className?: string
  testId?: string
}) {
  return (
    <form action={connectOpenRouter}>
      <Button type="submit" variant="ai" size="sm" data-testid={testId} className={className}>
        <Sparkles />
        Connect OpenRouter
      </Button>
    </form>
  )
}
