import type { ReactNode } from 'react'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { WALL } from './styles'

/** 전시 설명판처럼 작은 글자 */
export function Wall({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0', WALL, className)}>{children}</p>
}

/** 화면마다 하나뿐인 큰 글자. 얇은 굵기 */
export function Huge({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h1 id={id} className={cx('m-0 text-[clamp(2.75rem,10vw,9rem)] font-extralight leading-[1.02] tracking-[-0.045em] [word-break:keep-all]', className)}>
      {children}
    </h1>
  )
}

/** 오류·안내: 상자 대신 위아래 가는 줄 */
export function Notice({ title, children, actions, tone = 'error' }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'note' }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className="appear flex flex-col gap-4 border-y border-ink py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 max-w-xl text-[16px] leading-[1.7]">
        {title && (
          <p className="m-0 mb-1 text-[18px] font-semibold">
            <span aria-hidden="true">{tone === 'error' ? '× ' : '△ '}</span>
            {title}
          </p>
        )}
        <div className="text-muted">{children}</div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행', done: '완료', failed: '실패' }

/** 단계는 가는 줄 사이의 한 줄 글자 */
export function Lines({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 list-none border-t border-ink p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="border-b border-line py-4">
            <div className="grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-x-3">
              <span className="text-[12px] tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span className={cx('text-[clamp(1.125rem,2.2vw,1.5rem)] font-light', item.state === 'pending' && 'text-muted', item.state === 'done' && 'line-through decoration-1')}>{item.label}</span>
              <span className={cx('text-[13px] tabular-nums', item.state === 'failed' ? 'font-semibold underline underline-offset-4' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</span>
            </div>
            {item.state === 'active' && (
              <div className="ml-[2.25rem] mt-3 h-px bg-line" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('-mt-px h-[3px] bg-ink transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이: 숫자 하나와 가는 눈금 */
export function Span({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <p className="m-0 flex items-baseline gap-4">
        <span className="text-[clamp(2rem,4vw,3rem)] font-extralight leading-none tracking-[-0.04em] tabular-nums">{tc(seconds)}</span>
        <span className="text-[13px] text-muted">
          {actual ? '전체 길이' : '예상 길이'} · 권장 {MIN_VIDEO_SEC}–{MAX_VIDEO_SEC}초
        </span>
      </p>
      <div className="relative h-3" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <div className="absolute top-1/2 h-px bg-ink" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className="absolute inset-y-0 w-[2px] bg-ink" style={{ left: at(seconds) }} />
      </div>
      {range !== 'ok' && <p className="m-0 text-[14px] font-semibold">△ {range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧습니다. 문구를 늘려 주세요.` : `${MAX_VIDEO_SEC}초를 넘습니다. 문구를 줄여 주세요.`}</p>}
    </div>
  )
}
