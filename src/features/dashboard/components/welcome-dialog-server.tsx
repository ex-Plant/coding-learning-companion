import { cookies } from 'next/headers'

import { WelcomeDialog } from '@/features/dashboard/components/welcome-dialog'
import { WELCOME_SEEN_COOKIE } from '@/features/dashboard/welcome-dialog-cookie'
import { isAccountEmpty } from '@/features/sample-data/queries'

export async function WelcomeDialogServer() {
  const welcomeSeen = (await cookies()).get(WELCOME_SEEN_COOKIE)?.value === '1'
  if (welcomeSeen) return null
  const isEmpty = await isAccountEmpty()
  if (!isEmpty) return null

  return <WelcomeDialog />
}
