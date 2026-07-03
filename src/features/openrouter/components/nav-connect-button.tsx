import { ConnectOpenRouterButton } from '@/features/openrouter/components/connect-openrouter-button'

export function NavConnectButton({ className }: { className?: string }) {
  return <ConnectOpenRouterButton className={className} testId="nav-openrouter-connect" />
}
