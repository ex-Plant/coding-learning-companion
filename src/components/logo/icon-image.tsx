import { DARK_SURFACE } from '@/components/logo/logo-colors'
import { buildLogoDots, VIEWBOX } from '@/components/logo/logo-dots'

// Shared element for the installable home-screen icons (PWA manifest + apple-touch). Distinct from
// app/icon.tsx (the favicon: transparent, edge-to-edge): these may be masked to a circle by the OS,
// so the mark is inset into the maskable safe zone and the background is filled. One renderer keeps
// every size pixel-identical and tracking the same logo-dots geometry as the favicon/logo.
export function iconElement(px: number) {
  // The mark fills ~78% of the canvas; the remaining margin is the maskable safe zone a circular
  // mask can crop without clipping the dots.
  const markH = Math.round(px * 0.78)
  const markW = Math.round((markH * VIEWBOX.width) / VIEWBOX.height)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: DARK_SURFACE,
      }}
    >
      <svg width={markW} height={markH} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}>
        {buildLogoDots().map((d) => (
          <circle key={`${d.cx}-${d.cy}`} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} />
        ))}
      </svg>
    </div>
  )
}
