import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'

/** 초대형 제목 */
export function Giant({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1 id={id} className={cx('m-0 font-display text-[clamp(3.25rem,13vw,10.5rem)] leading-[0.92] tracking-[-0.02em] [overflow-wrap:normal] [word-break:keep-all]', className)}>
      {children}
    </h1>
  )
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0 font-display text-[18px] leading-none tracking-wide', className)}>{children}</p>
}

/** 역할: 큰 글자 + 색(색면이 이미 역할을 알려 준다) */
export function RoleTag({ role, className }: { role: Scene['role']; className?: string }) {
  return <span className={cx('inline-block bg-ink px-2 py-1 font-display text-[15px] leading-none text-bg', className)}>{ROLE_LABEL[role]}</span>
}

/** 오류·주의: 바탕과 글자를 뒤집은 상자 */
export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className="appear flex flex-col gap-4 bg-ink p-5 text-bg sm:flex-row sm:items-center sm:p-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon aria-hidden="true" className="mt-0.5 size-7 shrink-0" />
        <div className="min-w-0 text-[17px] leading-[1.6]">
          {title && <p className="m-0 font-display text-[24px] leading-tight">{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행 중', done: '완료', failed: '실패' }

/** 단계를 초대형 단어로 쌓는다: 끝난 단계는 취소선, 지금 단계는 퍼센트 */
export function Words({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-2 border-b-[3px] border-ink pb-3">
            <div className="flex items-end justify-between gap-4">
              <p className={cx('m-0 font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-none', item.state === 'pending' && 'opacity-45', item.state === 'done' && 'line-through decoration-[5px]')}>
                <span className="mr-3 text-[0.5em] align-middle opacity-70">{String(i + 1).padStart(2, '0')}</span>
                {item.label}
              </p>
              <p className="m-0 shrink-0 font-display text-[clamp(1.25rem,3vw,2rem)] leading-none tabular-nums">{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</p>
            </div>
            {item.state === 'active' && (
              <div className="h-4 bg-ink/25" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full bg-ink transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
