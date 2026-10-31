import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'

/** 큰 번호 */
export function Num({ n, className }: { n: number | string; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('block whitespace-nowrap font-black leading-[0.82] tracking-[-0.06em]', className)}>
      {typeof n === 'number' ? String(n).padStart(2, '0') : n}
    </span>
  )
}

export function Head({ children, id, className }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h1 id={id} className={cx('m-0 text-[clamp(2.5rem,6.4vw,5rem)] font-black leading-[0.98] tracking-[-0.04em]', className)}>
      {children}
    </h1>
  )
}

export function Cap({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0 text-[12px] font-bold uppercase leading-snug tracking-[0.08em]', className)}>{children}</p>
}

/** 역할은 색이 아니라 기호와 글자: ■ Hook, □ 본문, ● CTA */
export function Mark({ role, className }: { role: Scene['role']; className?: string }) {
  const g = { hook: '■', body: '□', cta: '●' }[role]
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-[13px] font-bold leading-none', className)}>
      <span aria-hidden="true" className={role === 'hook' ? 'text-accent' : 'text-ink'}>
        {g}
      </span>
      {ROLE_LABEL[role]}
    </span>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-4 border-l-[10px] p-5 sm:flex-row sm:items-center', tone === 'error' ? 'border-accent bg-accent-soft' : 'border-ink bg-panel-2')}>
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-6 shrink-0', tone === 'error' && 'text-accent')} />
        <div className="min-w-0 text-[16px] leading-[1.6]">
          {title && <p className="m-0 text-[18px] font-black leading-tight tracking-[-0.01em]">{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행', done: '완료', failed: '실패' }

/** 큰 번호가 붙은 단계 표 */
export function Rows({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 list-none border-t-4 border-ink p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-x-5 gap-y-2 border-b border-ink py-4 sm:grid-cols-[6rem_1fr_auto]">
            <Num n={i + 1} className={cx('text-[clamp(2.75rem,7vw,4.5rem)]', item.state === 'active' ? 'text-accent' : item.state === 'pending' ? 'text-line' : 'text-ink')} />
            <p className={cx('m-0 text-[clamp(1.125rem,2.4vw,1.5rem)] font-extrabold leading-tight tracking-[-0.02em]', item.state === 'pending' && 'text-muted')}>{item.label}</p>
            <p className={cx('m-0 text-[14px] font-bold tabular-nums', item.state === 'failed' && 'bg-accent px-2 py-1 text-on-accent', item.state === 'active' && 'text-accent')}>
              {item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}
            </p>
            {item.state === 'active' && (
              <div className="col-span-full h-[6px] bg-line" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이 눈금: 0~75초 위에 권장 구간을 검은 띠로 */
export function Scale({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 flex items-baseline gap-3 text-[13px] font-bold">
          {actual ? '전체 길이' : '예상 길이'}
          <span className={cx('text-[26px] font-black leading-none tracking-[-0.03em] tabular-nums', range !== 'ok' && 'text-accent')}>{tc(seconds)}</span>
        </p>
        <p className="m-0 text-[13px] font-medium tabular-nums text-muted">
          권장 {MIN_VIDEO_SEC}–{MAX_VIDEO_SEC}초
        </p>
      </div>
      <div className="relative h-4" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-ink" />
        <div className="absolute inset-y-1 bg-ink/15" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className="absolute inset-y-0 w-[5px] -translate-x-1/2 bg-accent" style={{ left: at(seconds) }} />
      </div>
      {range !== 'ok' && <p className="m-0 text-[14px] font-bold text-accent">{range === 'short' ? `${MIN_VIDEO_SEC}초 미만. 문구를 늘리세요.` : `${MAX_VIDEO_SEC}초 초과. 문구를 줄이세요.`}</p>}
    </div>
  )
}
