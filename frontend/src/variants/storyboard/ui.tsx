import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

/** 양식 머리글 한 칸: 작은 이름표 + 값 */
export function Cell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1 border-ink px-3 py-2', className)}>
      <span className="text-[11px] font-bold text-muted">{label}</span>
      <div className="min-w-0 text-[15px] font-semibold">{children}</div>
    </div>
  )
}

/** 인쇄 양식의 맨 위 줄 */
export function FormHead({ title, no, children }: { title: string; no: string; children?: ReactNode }) {
  return (
    <header className="border-b-2 border-ink">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-4 pb-2 pt-4 sm:px-6">
        <h1 className="m-0 text-[22px] font-extrabold leading-tight sm:text-[26px]">{title}</h1>
        <p className="m-0 text-[12px] font-bold tracking-wide text-muted">양식 No. {no}</p>
      </div>
      {children && <div className="grid border-t border-ink sm:grid-cols-3 [&>*+*]:border-t sm:[&>*+*]:border-l sm:[&>*+*]:border-t-0">{children}</div>}
    </header>
  )
}

export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('sb-sheet mx-auto w-full max-w-[1180px]', className)}>{children}</div>
}

/** 연필로 쓴 글씨 */
export function Pencil({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('sb-pencil text-[22px] leading-tight', className)}>{children}</span>
}

export function RoleMark({ role }: { role: Scene['role'] }) {
  const c = { hook: 'text-hook', body: 'text-muted', cta: 'text-cta' }[role]
  return <span className={cx('text-[12px] font-extrabold', c)}>[{ROLE_LABEL[role]}]</span>
}

/** 그림 칸 */
export function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('sb-frame p-0', className)}>
      <Stage>{children}</Stage>
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 border-2 p-4 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger bg-danger-soft' : 'border-ink bg-panel-2')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.65]">
          {title && <p className={cx('m-0 font-extrabold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const MARK: Record<StageItem['state'], string> = { pending: '', active: '…', done: '✓', failed: '×' }
const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '작업 중', done: '완료', failed: '중단' }

/** 체크란: 네모 칸에 연필 체크 */
export function Checklist({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-2 border-b border-line px-4 py-3 last:border-b-0">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center border-2 border-ink bg-surface">
                <span className={cx('sb-pencil text-[26px] leading-none', item.state === 'failed' && '!text-danger')}>{MARK[item.state]}</span>
              </span>
              <p className={cx('m-0 flex-1 text-[15px]', item.state === 'pending' ? 'text-muted' : 'font-bold', item.state === 'done' && 'line-through decoration-accent decoration-2')}>
                {i + 1}. {item.label}
              </p>
              <span className={cx('text-[12px] font-bold tabular-nums', item.state === 'failed' ? 'text-danger-ink' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</span>
            </div>
            {item.state === 'active' && (
              <div className="ml-10 h-3 border border-ink" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full bg-[repeating-linear-gradient(135deg,var(--accent)_0_4px,transparent_4px_8px)] transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function Total({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[13px] text-muted">
        <span className="font-bold">{actual ? '총 길이(실제)' : '총 길이(예상)'}</span>
        <b className={cx('text-[22px] tabular-nums', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="relative h-4 border border-ink" aria-hidden="true">
        <div className="absolute inset-y-0 bg-accent/20" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -inset-y-1 w-1 -translate-x-1/2', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
