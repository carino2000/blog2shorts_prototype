import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'

export function Shout({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1 id={id} className={cx('m-0 font-display text-[clamp(2.75rem,8.5vw,6.5rem)] leading-[1.08] tracking-[-0.01em] [word-break:keep-all]', className)}>
      {children}
    </h1>
  )
}

/** 형광펜 칠 */
export function Hl({ children }: { children: ReactNode }) {
  return <span className="zine-hl">{children}</span>
}

/** 역할 스티커: 색 + 글자 */
export function Tag({ role, className }: { role: Scene['role']; className?: string }) {
  return (
    <span className={cx('inline-block border-[3px] border-ink px-2 py-0.5 font-display text-[16px] leading-tight text-ink', { hook: 'bg-hi', body: 'bg-surface', cta: 'bg-accent' }[role], className)}>
      {ROLE_LABEL[role]}
    </span>
  )
}

/** 번호 스티커 */
export function Dot({ n, on = false, className }: { n: number; on?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display text-[24px] leading-none', on ? 'bg-accent' : 'bg-hi', className)}>
      {n}
    </span>
  )
}

/** 오류·주의: 검은 상자에 형광 그림자 */
export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={cx('appear flex flex-col gap-4 border-[3px] p-5 sm:flex-row sm:items-center', tone === 'error' ? 'border-ink bg-ink text-bg shadow-[6px_6px_0_var(--accent)]' : 'border-ink bg-hi text-ink shadow-[6px_6px_0_#0a0a0a]')}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Icon aria-hidden="true" className="mt-0.5 size-7 shrink-0" />
        <div className="min-w-0 text-[17px] font-semibold leading-[1.6]">
          {title && <p className="m-0 font-display text-[26px] font-normal leading-tight">{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-4">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '돌리는 중', done: '끝!', failed: '망함' }

/** 스티커처럼 쌓은 단계 막대 */
export function Bars({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-5 p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li
            key={item.key}
            aria-current={item.state === 'active' ? 'step' : undefined}
            className={cx('flex flex-col gap-3 border-[3px] border-ink p-4 shadow-[6px_6px_0_#0a0a0a]', item.state === 'active' ? 'bg-hi' : item.state === 'failed' ? 'bg-ink text-bg' : item.state === 'done' ? 'bg-accent' : 'bg-surface text-muted', i % 2 ? 'sm:ml-6' : 'sm:mr-6')}
          >
            <div className="flex items-center gap-4">
              <Dot n={i + 1} on={item.state === 'done'} className={item.state === 'failed' ? 'border-bg bg-bg text-ink' : ''} />
              <p className="m-0 min-w-0 flex-1 font-display text-[clamp(1.375rem,3.4vw,2rem)] leading-tight">{item.label}</p>
              <p className="m-0 shrink-0 font-display text-[20px] leading-none tabular-nums">{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</p>
            </div>
            {item.state === 'active' && (
              <div className="h-6 border-[3px] border-ink bg-surface" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('zine-stripes zine-stripes-anim h-full transition-[width] duration-500', pct === null && 'w-1/3')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이 눈금: 굵은 막대 위에 권장 구간 */
export function Ruler({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-4 font-display text-[20px] leading-tight">
        {actual ? '전체 길이' : '예상 길이'}
        <span className={cx('px-2 text-[30px] leading-none', range === 'ok' ? 'bg-hi' : 'bg-accent')}>{tc(seconds)}</span>
        <span className="font-sans text-[14px] font-bold text-muted">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
      </p>
      <div className="relative h-5 border-[3px] border-ink bg-surface" aria-hidden="true">
        <div className="absolute inset-y-0 border-x-[3px] border-ink bg-hi" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className="absolute -bottom-2 -top-2 w-[7px] -translate-x-1/2 bg-ink" style={{ left: at(seconds) }} />
      </div>
      {range !== 'ok' && <p className="m-0 font-sans text-[16px] font-extrabold">{range === 'short' ? `▲ ${MIN_VIDEO_SEC}초보다 짧다! 문구를 더 써라.` : `▲ ${MAX_VIDEO_SEC}초 넘는다! 문구를 줄여라.`}</p>}
    </div>
  )
}
