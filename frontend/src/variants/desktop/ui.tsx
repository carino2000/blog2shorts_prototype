import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

/** 창: 제목 줄 + 내용. 제목 줄은 장식이 아니라 창 이름이다 */
export function Win({ title, children, className, bodyClassName, right }: { title: string; children: ReactNode; className?: string; bodyClassName?: string; right?: ReactNode }) {
  return (
    <section aria-label={title} className={cx('dk-win min-w-0', className)}>
      <div className="flex min-h-9 items-center justify-between gap-3 bg-accent px-3 py-1 text-on-accent">
        <h2 className="m-0 truncate font-mono text-[13px] font-bold">{title}</h2>
        {right && <div className="shrink-0 font-mono text-[12px]">{right}</div>}
      </div>
      <div className={cx('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

/** 화면 제목: 창 밖의 큰 글씨 */
export function Heading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h1 id={id} className="m-0 inline-block bg-surface px-3 py-1 text-[clamp(1.5rem,3.4vw,2.25rem)] font-extrabold leading-tight dk-win">
      {children}
    </h1>
  )
}

export function RoleTag({ role }: { role: Scene['role'] }) {
  const c = { hook: 'text-hook', body: 'text-muted', cta: 'text-cta' }[role]
  return <span className={cx('font-mono text-[12px] font-bold', c)}>[{ROLE_LABEL[role]}]</span>
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('dk-win p-1', className)}>
      <div className="border border-ink bg-black p-1">
        <Stage>{children}</Stage>
      </div>
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('dk-win appear flex flex-col gap-3 p-4 sm:flex-row sm:items-center', tone === 'error' && '!bg-danger-soft')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-6 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.65]">
          {title && <p className={cx('m-0 font-bold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행 중', done: '완료', failed: '중단' }

/** 진행 목록: 체크 칸 + 블록 막대 */
export function Tasks({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className={cx('dk-sunk grid size-6 shrink-0 place-items-center font-mono text-[14px] font-bold', item.state === 'failed' && 'text-danger')}>
                {item.state === 'done' ? '✓' : item.state === 'failed' ? '×' : item.state === 'active' ? '»' : ''}
              </span>
              <p className={cx('m-0 flex-1 text-[15px]', item.state === 'pending' ? 'text-muted' : 'font-bold')}>{item.label}</p>
              <span className={cx('font-mono text-[12px] font-bold', item.state === 'failed' ? 'text-danger-ink' : item.state === 'done' ? 'text-cta' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</span>
            </div>
            {item.state === 'active' && (
              <div className="dk-sunk ml-9 h-5 p-0.5" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('dk-blocks h-full transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이 표시: 칸 막대 */
export function Gauge({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[13px] text-muted">
        <span className="font-bold">{actual ? '실제 길이' : '예상 길이'}</span>
        <b className={cx('font-mono text-[22px] tabular-nums', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="dk-sunk relative h-5" aria-hidden="true">
        <div className="absolute inset-y-0.5 bg-accent/20" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute inset-y-0 w-1.5 -translate-x-1/2', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
