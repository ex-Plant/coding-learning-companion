import { ImageResponse } from 'next/og'

import { iconElement } from '@/components/logo/icon-image'

export function GET() {
  return new ImageResponse(iconElement(512), { width: 512, height: 512 })
}
