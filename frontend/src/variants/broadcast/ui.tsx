import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono tabular-nums', className)}>{children}</span>
}

/** 모니터 위 작은 이름표: PGM(송출), PVW(프리뷰) */
export function Tally({ tone, children, live = false }: { tone: 'pgm' | 'pvw' | 'idle'; children: ReactNode; live?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-[2px] px-2 py-0.5 font-display text-[14px] font-bold uppercase leading-tight tracking-[0.12em] text-black', tone === 'pgm' ? 'bg-accent-bright' : tone === 'pvw' ? 'bg-hook' : 'bg-muted')}>
      <i aria-hidden="true" className={cx('size-2 rounded-full bg-black/70', live && 'bc-live')} />
      {children}
    </span>
  )
}

/** 모니터: 이름표 + 9:16 화면 + 아래 정보 한 줄 */
export function Monitor({ tag, info, children, className }: { tag: ReactNode; info?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className={cx('m-0 flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">{tag}</div>
      <div className="bc-monitor p-1.5">
        <Stage>{children}</Stage>
      </div>
      {info && <figcaption className="m-0 font-mono text-[11px] tabular-nums text-muted">{info}</figcaption>}
    </figure>
  )
}

export function Role({ role }: { role: Scene['role'] }) {
  const c = { hook: 'text-hook', body: 'text-muted', cta: 'text-hi' }[role]
  return <span className={cx('font-display text-[15px] font-semibold uppercase tracking-[0.1em]', c)}>{ROLE_LABEL[role]}</span>
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 rounded-card border border-l-[6px] p-4 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger-line border-l-danger bg-danger-soft' : 'border-edge border-l-hook bg-panel-2')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.6]">
          {title && <p className={cx('m-0 font-display text-[19px] font-semibold uppercase tracking-[0.06em]', tone === 'error' && 'text-danger-ink')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: 'STANDBY', active: 'RUNNING', done: 'DONE', failed: 'FAULT' }

/** 마스터 컨트롤 로그: 단계마다 램프 하나 */
export function Master({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 list-none overflow-hidden rounded-card border border-edge bg-panel p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="border-b border-line px-4 py-3 last:border-b-0">
            <div className="grid grid-cols-[1.75rem_1fr_auto] items-center gap-x-3">
              <i aria-hidden="true" className={cx('size-3 rounded-full', item.state === 'done' && 'bg-hi', item.state === 'active' && 'bc-live bg-accent-bright', item.state === 'failed' && 'bg-danger', item.state === 'pending' && 'border border-edge')} />
              <p className={cx('m-0 text-[15px]', item.state === 'pending' ? 'text-muted' : 'font-semibold')}>
                <Mono className="mr-3 text-[12px] text-muted">CH{String(i + 1).padStart(2, '0')}</Mono>
                {item.label}
              </p>
              <Mono className={cx('text-[12px] font-semibold', item.state === 'failed' ? 'text-danger-ink' : item.state === 'done' ? 'text-hi' : item.state === 'active' ? 'text-accent-bright' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</Mono>
            </div>
            {item.state === 'active' && (
              <div className="ml-[2.5rem] mt-2.5 h-1.5 rounded-full bg-line" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full rounded-full bg-accent-bright transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 방송 길이 눈금 */
export function Duration({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[12px] text-muted">
        <span className="font-display text-[14px] font-semibold uppercase tracking-[0.1em]">{actual ? 'TOTAL' : 'EST.'}</span>
        <Mono className={cx('text-[22px] font-semibold', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</Mono>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="relative h-2.5 rounded-[2px] bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-[2px] bg-hi/30" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -inset-y-1 w-[3px] -translate-x-1/2', range === 'ok' ? 'bg-accent-bright' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
