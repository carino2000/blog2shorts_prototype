import { CircleAlert, Check, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

export function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sf-glass rounded-card', className)}>{children}</div>
}

export function Chip({ children, tone = 'plain', className }: { children: ReactNode; tone?: 'plain' | 'accent' | 'hook'; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold leading-tight', tone === 'accent' ? 'bg-accent-soft text-accent' : tone === 'hook' ? 'bg-[#ffe9d9] text-hook' : 'bg-ink/[0.07] text-muted', className)}>
      {children}
    </span>
  )
}

export function RoleChip({ role }: { role: Scene['role'] }) {
  return <Chip tone={role === 'hook' ? 'hook' : role === 'cta' ? 'accent' : 'plain'}>{ROLE_LABEL[role]}</Chip>
}

/** 둥근 휴대폰 화면 (유리 틀) */
export function Bubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[2.25rem] border-[6px] border-white bg-white shadow-[0_28px_50px_-24px_rgba(29,43,40,0.45)]', className)}>
      <div className="overflow-hidden rounded-[1.75rem]">
        <Stage>{children}</Stage>
      </div>
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 rounded-[24px] border p-5 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-[#f2d3b8] bg-[#fff6ee]')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.65]">
          {title && <p className={cx('m-0 text-[15px] font-semibold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** 단계 목록: 둥근 알약 줄 */
export function Pills({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className={cx('rounded-full border px-5 py-3.5', item.state === 'active' ? 'sf-glass border-white' : item.state === 'failed' ? 'border-danger-line bg-danger-soft' : 'border-line bg-white/45')}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={cx('grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold', item.state === 'done' ? 'bg-accent text-white' : item.state === 'active' ? 'bg-accent-soft text-accent' : item.state === 'failed' ? 'bg-danger text-white' : 'bg-ink/10 text-muted')}>
                {item.state === 'done' ? <Check className="size-4" /> : item.state === 'failed' ? '!' : ''}
              </span>
              <p className={cx('m-0 flex-1 text-[15px]', item.state === 'pending' ? 'text-muted' : 'font-semibold')}>{item.label}</p>
              <span className={cx('text-[13px] font-semibold tabular-nums', item.state === 'failed' ? 'text-danger-ink' : item.state === 'pending' ? 'text-muted' : 'text-accent')}>{item.state === 'active' ? (pct !== null ? `${pct}%` : '진행 중') : item.state === 'done' ? '완료' : item.state === 'failed' ? '중단' : '대기'}</span>
            </div>
            {item.state === 'active' && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full rounded-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이: 알약 모양 막대 */
export function Length({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[13px] text-muted">
        <span>{actual ? '실제 길이' : '예상 길이'}</span>
        <b className={cx('text-[26px] font-bold tabular-nums', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '조금 짧아요' : '조금 길어요'}</b>}
      </p>
      <div className="relative h-3 rounded-full bg-ink/10" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-accent/25" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-md', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
