import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cx('inline-flex min-w-5 items-center justify-center rounded-[4px] border border-edge bg-panel-2 px-1 font-mono text-[11px] leading-[18px] text-muted', className)}>{children}</kbd>
  )
}

export function Mono({ children, className, ...rest }: ComponentProps<'span'>) {
  return (
    <span className={cx('font-mono tabular-nums', className)} {...rest}>
      {children}
    </span>
  )
}

/** 역할 표시: 색 점 + 글자 */
export function RoleChip({ role }: { role: Scene['role'] }) {
  const dot = { hook: 'bg-hook', body: 'bg-body', cta: 'bg-cta' }[role]
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
      <i aria-hidden="true" className={cx('size-2 rounded-full', dot)} />
      {ROLE_LABEL[role]}
    </span>
  )
}

/** 섹션 머리글 + 본문 패널 */
export function Panel({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-card border border-edge bg-panel', className)}>
      {(title || aside) && (
        <header className="flex min-h-10 items-center justify-between gap-3 border-b border-line px-3.5">
          {title && <h2 className="m-0 text-[12px] font-semibold uppercase tracking-[0.04em] text-muted">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={cx('appear flex flex-col gap-2.5 rounded-card border p-3 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-accent/30 bg-accent-soft')}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-4 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-[13px] leading-snug">
          {title && <p className={cx('m-0 font-semibold', tone === 'error' ? 'text-danger-ink' : 'text-ink')}>{title}</p>}
          <div className="text-ink">{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '실행 중', done: '완료', failed: '실패' }

/** 작업 단계 표(처리 중·렌더 중 공통) */
export function StageTable({ items }: { items: StageItem[] }) {
  return (
    <div role="table" aria-label="작업 단계" className="overflow-hidden rounded-card border border-edge bg-panel">
      <div role="row" className="cmd-th grid grid-cols-[2.5rem_1fr_7rem] border-b border-line bg-panel-2 px-3 py-2">
        <span role="columnheader">#</span>
        <span role="columnheader">단계</span>
        <span role="columnheader" className="text-right">
          상태
        </span>
      </div>
      <ol className="m-0 list-none p-0">
        {items.map((item, i) => {
          const pct = item.percent !== undefined ? Math.round(item.percent) : null
          return (
            <li key={item.key} role="row" aria-current={item.state === 'active' ? 'step' : undefined} className={cx('grid grid-cols-[2.5rem_1fr_7rem] items-center gap-y-2 border-b border-line px-3 py-3 last:border-b-0', item.state === 'active' && 'bg-accent-soft')}>
              <Mono role="cell" className="text-[12px] text-muted">
                {String(i + 1).padStart(2, '0')}
              </Mono>
              <span role="cell" className={cx('text-[14px]', item.state === 'pending' ? 'text-muted' : 'font-semibold')}>
                {item.label}
              </span>
              <span role="cell" className="flex items-center justify-end gap-1.5 text-[12px] font-semibold">
                <i
                  aria-hidden="true"
                  className={cx('size-2 rounded-full', item.state === 'done' && 'bg-cta', item.state === 'active' && 'bg-accent', item.state === 'failed' && 'bg-danger', item.state === 'pending' && 'border border-edge')}
                />
                <span className={cx(item.state === 'failed' && 'text-danger-ink', item.state === 'pending' && 'font-normal text-muted')}>
                  {item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}
                </span>
              </span>
              {item.state === 'active' && (
                <div className="col-span-full col-start-2 pr-1" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                  <div className="relative h-1 overflow-hidden rounded-full bg-line">
                    {pct !== null ? <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} /> : <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent motion-safe:animate-pulse" />}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** 길이 한 줄 요약 + 눈금 */
export function Meter({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const warn = range !== 'ok'
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-1.5" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[12px] text-muted">
        <span>{actual ? '전체 길이' : '예상 길이'}</span>
        <Mono className={cx('text-[14px] font-semibold', warn ? 'text-danger-ink' : 'text-ink')}>{tc(seconds)}</Mono>
        <span className="tabular-nums">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {warn && <span className="font-semibold text-danger-ink">{range === 'short' ? '짧음' : '김'}</span>}
      </p>
      <div className="relative h-1.5 rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-cta/25" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -top-0.5 h-2.5 w-0.5 -translate-x-1/2 rounded-full', warn ? 'bg-danger' : 'bg-accent')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
