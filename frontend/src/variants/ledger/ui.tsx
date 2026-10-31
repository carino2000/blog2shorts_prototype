import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { cx } from '../../lib/ui'

/** 화면마다 하나뿐인 질문 */
export function Question({ children, hint, id }: { children: ReactNode; hint?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 id={id} className="m-0 text-[32px] font-bold leading-[1.3] tracking-[-0.02em] sm:text-[40px]">
        {children}
      </h1>
      {hint && <p className="m-0 max-w-[34rem] text-[18px] leading-[1.75] text-muted">{hint}</p>}
    </div>
  )
}

/** 친근한 안내 상자 */
export function Note({
  title,
  children,
  actions,
  tone = 'error',
  icon,
}: {
  title?: string
  children: ReactNode
  actions?: ReactNode
  tone?: 'error' | 'info'
  icon?: LucideIcon
}) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={cx('appear flex flex-col gap-4 rounded-[18px] border-2 p-5 sm:p-6', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-accent/30 bg-accent-soft')}
    >
      <div className="flex items-start gap-4">
        <Icon aria-hidden="true" className={cx('mt-1 size-6 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-[17px] leading-[1.7]">
          {title && <p className={cx('m-0 text-[19px] font-bold', tone === 'error' ? 'text-danger-ink' : 'text-ink')}>{title}</p>}
          <div className="text-ink">{children}</div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-3 sm:pl-10">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '기다리는 중', active: '하는 중이에요', done: '끝났어요', failed: '여기서 멈췄어요' }

/** 하나씩 체크되는 진행 목록(처리 중·렌더 중 공통) */
export function Checklist({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-5 p-0">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-full text-[17px] font-bold',
                  item.state === 'done' && 'bg-accent text-on-accent',
                  item.state === 'active' && 'border-[3px] border-accent text-accent',
                  item.state === 'failed' && 'bg-danger text-white',
                  item.state === 'pending' && 'border-2 border-edge text-muted',
                )}
              >
                {item.state === 'done' ? '✓' : item.state === 'failed' ? '!' : item.state === 'active' ? '…' : ''}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('m-0 text-[20px] font-semibold leading-snug', item.state === 'pending' && 'text-muted')}>{item.label}</p>
                <p className={cx('m-0 text-[15px]', item.state === 'failed' ? 'font-semibold text-danger-ink' : 'text-muted')}>
                  {STATE_TEXT[item.state]}
                  {item.state === 'active' && pct !== null && ` · ${pct}%`}
                </p>
              </div>
            </div>
            {item.state === 'active' && (
              <div className="ml-[3.25rem] h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full rounded-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이를 말로: 막대 하나와 한 문장 */
export function Length({ seconds, text }: { seconds: number; text: string }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <p className={cx('m-0 text-[18px] leading-snug', range !== 'ok' && 'font-semibold text-danger-ink')}>
        {text}
        {range === 'short' && ` ${MIN_VIDEO_SEC}초보다 짧아요. 문구를 조금 늘려 주세요.`}
        {range === 'long' && ` ${MAX_VIDEO_SEC}초를 넘어요. 문구를 조금 줄여 주세요.`}
      </p>
      <div className="relative h-3 rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-accent/25" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -top-1 size-5 -translate-x-1/2 rounded-full border-[3px] border-surface', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
      <p className="m-0 text-[14px] text-muted">알맞은 길이는 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초예요.</p>
    </div>
  )
}
