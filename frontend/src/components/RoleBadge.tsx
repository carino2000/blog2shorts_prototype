import type { Scene } from '../api/types'
import { ROLE_LABEL } from '../lib/roles'
import { cx } from '../lib/ui'

const ROLE_CLASS: Record<Scene['role'], string> = {
  hook: 'border-hook/40 bg-hook/12 text-hook',
  body: 'border-body/40 bg-body/12 text-body',
  cta: 'border-cta/40 bg-cta/12 text-cta',
}

/** 장면 역할은 색 + 글자 둘 다로 표시한다(색만으로 구분 금지, 5장) */
export function RoleBadge({ role, className }: { role: Scene['role']; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        ROLE_CLASS[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}
