import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

/** 노선 번호 원 (1호선 같은 표지) */
export function LineBadge({ n, className }: { n: number | string; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('inline-grid size-9 shrink-0 place-items-center rounded-full bg-accent font-display text-[20px] leading-none text-white', className)}>
      {n}
    </span>
  )
}

/** 안내판: 짙은 남색 판 + 흰 글자 */
export function Sign({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-card bg-[#0d2240] p-5 text-white sm:p-7', className)}>{children}</div>
}

/** 역 원: 흰 바탕 + 굵은 테두리 */
export function Dot({ state = 'idle', size = 'md', children }: { state?: 'idle' | 'on' | 'done' | 'fail'; size?: 'md' | 'lg'; children?: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'relative z-10 grid shrink-0 place-items-center rounded-full border-[5px] bg-white font-display leading-none',
        size === 'lg' ? 'size-11 text-[20px]' : 'size-9 text-[17px]',
        state === 'on' ? 'border-ink bg-accent text-white' : state === 'done' ? 'border-accent text-accent' : state === 'fail' ? 'border-danger text-danger' : 'border-line text-muted',
      )}
    >
      {children}
    </span>
  )
}

export function RoleChip({ role }: { role: Scene['role'] }) {
  const c = { hook: 'bg-[#f6b100] text-black', body: 'bg-panel-2 text-ink', cta: 'bg-cta text-white' }[role]
  return <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[12px] font-extrabold leading-none', c)}>{ROLE_LABEL[role]}</span>
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-[22px] border-[5px] border-ink bg-black p-1', className)}>
      <Stage className="rounded-2xl">{children}</Stage>
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 rounded-card border-[3px] p-4 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger bg-danger-soft' : 'border-[#f6b100] bg-[#fff8e5]')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-6 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[15px] leading-[1.65]">
          {title && <p className={cx('m-0 font-extrabold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '운행 중', done: '통과', failed: '운행 중단' }

/** 단계 노선: 세로 선 위에 역 원이 줄지어 있다 */
export function Route({ items }: { items: StageItem[] }) {
  return (
    <ol className="mt-rail m-0 list-none p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-4 pb-7 last:pb-0">
            <Dot state={item.state === 'active' ? 'on' : item.state === 'done' ? 'done' : item.state === 'failed' ? 'fail' : 'idle'} size="lg">
              {i + 1}
            </Dot>
            <div className="flex min-w-0 flex-col gap-2 pt-1">
              <p className="m-0 flex flex-wrap items-baseline gap-x-3">
                <span className={cx('font-display text-[24px] leading-tight', item.state === 'pending' ? 'text-muted' : 'text-ink')}>{item.label}</span>
                <span className={cx('text-[13px] font-extrabold', item.state === 'failed' ? 'text-danger-ink' : item.state === 'done' ? 'text-cta' : item.state === 'active' ? 'text-accent' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</span>
              </p>
              {item.state === 'active' && (
                <div className="h-3.5 max-w-md overflow-hidden rounded-full border-2 border-ink bg-white" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                  <div className={cx('h-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function Fare({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[14px] text-muted">
        <span className="font-bold">{actual ? '총 소요(실제)' : '총 소요(예상)'}</span>
        <b className={cx('font-display text-[28px] font-normal tabular-nums', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="relative h-4 rounded-full bg-panel-2" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-accent/30" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-ink bg-white', range !== 'ok' && 'border-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
