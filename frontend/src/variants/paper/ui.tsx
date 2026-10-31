import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'

/** 손글씨 제목 */
export function Hand({ children, className, id, as: Tag = 'h1' }: { children: ReactNode; className?: string; id?: string; as?: 'h1' | 'h2' | 'p' }) {
  return (
    <Tag id={id} className={cx('m-0 font-display font-bold leading-[1.15] tracking-[-0.01em]', className)}>
      {children}
    </Tag>
  )
}

/** 역할 도장: 색 메모지 위에 글자로도 적는다 */
export function Stamp({ role, className }: { role: Scene['role']; className?: string }) {
  return <span className={cx('inline-block -rotate-2 rounded-[4px] border-2 border-ink/70 px-2 py-0.5 font-display text-[18px] font-bold leading-none text-ink', className)}>{ROLE_LABEL[role]}</span>
}

/** 안내 쪽지: 오른쪽 위가 접힌 종이 */
export function Memo({
  title,
  children,
  actions,
  tone = 'error',
  icon,
}: {
  title?: string
  children: ReactNode
  actions?: ReactNode
  tone?: 'error' | 'note'
  icon?: LucideIcon
}) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={cx('appear paper-note relative flex flex-col gap-3 rounded-[4px] border-l-[6px] p-5 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger bg-danger-soft' : 'border-accent bg-[#fff3c4]')}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-1 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-[17px] leading-[1.65]">
          {title && <p className={cx('m-0 font-display text-[24px] font-bold leading-tight', tone === 'error' && 'text-danger-ink')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '아직이에요', active: '하는 중이에요', done: '다 했어요', failed: '막혔어요' }

/** 할 일 목록: 손으로 체크하는 상자 + 연필로 긋는 진행 선 */
export function Todo({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-5 p-0">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-[8px] border-[3px] border-ink/70 font-display text-[26px] font-bold leading-none',
                  item.state === 'done' && 'bg-accent-soft text-accent',
                  item.state === 'failed' && 'border-danger bg-danger-soft text-danger',
                )}
              >
                {item.state === 'done' ? '✓' : item.state === 'failed' ? '!' : ''}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cx('m-0 font-display text-[26px] font-bold leading-tight', item.state === 'pending' && 'text-muted', item.state === 'done' && 'line-through decoration-2')}>{item.label}</p>
                <p className={cx('m-0 text-[15px]', item.state === 'failed' ? 'font-bold text-danger-ink' : 'text-muted')}>
                  {STATE_TEXT[item.state]}
                  {item.state === 'active' && pct !== null && ` · ${pct}%`}
                </p>
              </div>
            </div>
            {item.state === 'active' && (
              <div className="ml-[3.25rem] h-3 rounded-full border-2 border-dashed border-ink/40" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <div className={cx('h-full rounded-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 길이 한 줄 + 눈금 */
export function Length({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[16px] text-muted">
        <span>{actual ? '전체 길이' : '전체 예상 길이'}</span>
        <b className={cx('font-display text-[26px] leading-none', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span>
          알맞은 길이 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
      </p>
      <div className="relative h-3 rounded-full border-2 border-dashed border-ink/40" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-cta/30" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -top-1.5 size-5 -translate-x-1/2 rounded-full border-2 border-surface', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
      {range !== 'ok' && <p className="m-0 text-[16px] font-bold text-danger-ink">{range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧아요. 문구를 조금 늘려 주세요.` : `${MAX_VIDEO_SEC}초를 넘어요. 문구를 조금 줄여 주세요.`}</p>}
    </div>
  )
}

/** 폴라로이드: 영상 화면을 사진처럼 붙인다 */
export function Polaroid({ children, caption, className, tilt = '-rotate-2' }: { children: ReactNode; caption?: ReactNode; className?: string; tilt?: string }) {
  return (
    <figure className={cx('paper-note paper-tape relative m-0 flex flex-col gap-3 bg-surface px-3 pb-4 pt-5 motion-reduce:rotate-0', tilt, className)} style={{ ['--note' as string]: '#fffdf7' }}>
      <div className="overflow-hidden bg-black">{children}</div>
      {caption && <figcaption className="px-1 text-center font-display text-[20px] font-bold leading-tight">{caption}</figcaption>}
    </figure>
  )
}
