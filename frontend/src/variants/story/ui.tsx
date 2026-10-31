import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

/** 세로 무대: 화면 높이에 맞춘 9:16 틀. 위에 얹는 것은 children에 absolute로 둔다 */
export function Pane({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cx('st-stage mx-auto', className)}>
      <Stage className="rounded-[28px] border border-white/15 shadow-[0_0_80px_-30px_rgba(61,220,255,0.35)]">{children}</Stage>
    </section>
  )
}

export function RoleLabel({ role, className }: { role: Scene['role']; className?: string }) {
  const c = { hook: 'bg-hook text-black', body: 'bg-white/90 text-black', cta: 'bg-cta text-black' }[role]
  return <span className={cx('inline-flex rounded-full px-2.5 py-1 text-[12px] font-extrabold leading-none', c, className)}>{ROLE_LABEL[role]}</span>
}

/** 스토리 진행 막대: 칸마다 하나. 지나간 칸은 채워지고 현재 칸은 반쯤 */
export function Bars({ states }: { states: ('done' | 'active' | 'pending' | 'failed')[] }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {states.map((s, i) => (
        <i key={i} className={cx('h-1 flex-1 rounded-full', s === 'done' ? 'bg-white' : s === 'active' ? 'bg-accent' : s === 'failed' ? 'bg-danger' : 'bg-white/30')} />
      ))}
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 rounded-3xl border p-4', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-white/25 bg-panel-2')}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.6]">
          {title && <p className={cx('m-0 font-bold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Length({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[13px] text-muted">
        <span>{actual ? '실제 길이' : '예상 길이'}</span>
        <b className={cx('text-[24px] font-extrabold tabular-nums', range === 'ok' ? 'text-white' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="relative h-2 rounded-full bg-white/15" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-accent/35" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
