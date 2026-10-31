import type { Scene } from '../api/types'
import { ROLE_BAR, ROLE_LABEL } from '../lib/roles'
import { cx } from '../lib/ui'

// 역할 색은 테두리·점으로만 쓴다. hook·cta 색은 작은 글자로 쓰면 대비가 모자란다
const ROLE_CLASS: Record<Scene['role'], string> = {
  hook: 'border-hook/60 bg-hook/10',
  body: 'border-body/60 bg-body/10',
  cta: 'border-cta/60 bg-cta/10',
}

/** 장면 역할은 색 + 글자 둘 다로 표시한다(색만으로 구분 금지, 5장) */
export function RoleBadge({ role, className }: { role: Scene['role']; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-ink',
        ROLE_CLASS[role],
        className,
      )}
    >
      <span aria-hidden="true" className={cx('size-1.5 rounded-full', ROLE_BAR[role])} />
      {ROLE_LABEL[role]}
    </span>
  )
}
