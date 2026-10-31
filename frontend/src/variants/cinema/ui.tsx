import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { LABEL } from './styles'

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0', LABEL, className)}>{children}</p>
}

/** 포스터 제목 */
export function Poster({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1 id={id} className={cx('m-0 font-display text-[clamp(2.75rem,8.5vw,7rem)] font-bold leading-[1.08] tracking-[-0.02em] [word-break:keep-all]', className)}>
      {children}
    </h1>
  )
}

export function Notice({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'note'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-4 border p-5 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-accent/40 bg-accent-soft')}>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-[16px] leading-[1.7]">
          {title && <p className={cx('m-0 font-display text-[20px] font-bold', tone === 'error' && 'text-danger-ink')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '상영 중', done: '종료', failed: '중단' }

/** 크레딧처럼 가운데 정렬한 단계 목록 */
export function Credits({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col items-center gap-9 p-0 text-center">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex w-full max-w-xl flex-col items-center gap-3">
            <p className={cx('m-0 font-sans text-[11px] font-semibold uppercase tracking-[0.3em]', item.state === 'failed' ? 'text-danger-ink' : item.state === 'active' ? 'text-accent' : 'text-muted')}>
              {item.state === 'active' && pct !== null ? `${STATE_TEXT.active} · ${pct}%` : STATE_TEXT[item.state]}
            </p>
            <p className={cx('m-0 font-display text-[clamp(1.5rem,3.4vw,2.25rem)] leading-tight', item.state === 'pending' && 'text-muted', item.state === 'done' && 'text-ink/70')}>{item.label}</p>
            {item.state === 'active' && (
              <div className="h-px w-full bg-edge" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('-mt-px h-[3px] bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 러닝타임 */
export function Runtime({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className={LABEL}>{actual ? 'Running time' : 'Est. running time'}</span>
        <span className={cx('font-display text-[28px] font-bold leading-none tabular-nums', range !== 'ok' && 'text-danger-ink')}>{tc(seconds)}</span>
        <span className="text-[13px] text-muted">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
      </p>
      <div className="relative h-4" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-edge" />
        <div className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-accent/40" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute inset-y-0 w-[3px] -translate-x-1/2', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
      {range !== 'ok' && <p className="m-0 text-[14px] font-semibold text-danger-ink">{range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧습니다. 문구를 늘려 주세요.` : `${MAX_VIDEO_SEC}초를 넘습니다. 문구를 줄여 주세요.`}</p>}
    </div>
  )
}
