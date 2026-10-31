import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'

/** 장면 역할은 색 대신 모양과 글자: Hook=검은 바탕, 본문=테두리, CTA=겹테두리 */
export function RoleMark({ role, className }: { role: Scene['role']; className?: string }) {
  return (
    <span
      className={cx(
        'inline-block px-1.5 py-px font-sans text-[11px] font-bold leading-[1.5] tracking-wide whitespace-nowrap',
        role === 'hook' && 'border border-ink bg-ink text-bg',
        role === 'body' && 'border border-ink text-ink',
        role === 'cta' && 'border-[3px] border-double border-ink text-ink',
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  )
}

/** 지면의 작은 머리말 */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0 font-sans text-xs font-bold tracking-[0.12em] text-ink', className)}>{children}</p>
}

/** 정정·주의 박스. 오류는 검은 바탕으로 눈에 띄게, 주의는 굵은 왼쪽 줄 */
export function Notice({
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
      className={cx(
        'appear flex flex-col gap-3 p-4 sm:flex-row sm:items-center',
        tone === 'error' ? 'bg-ink text-bg' : 'border border-l-[6px] border-ink bg-panel-2 text-ink',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 text-[15px] leading-relaxed">
          {title && <p className="m-0 font-sans font-bold">{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '조판 중', done: '완료', failed: '중단' }
const NUMERALS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ']

/** 번호 매긴 공정표(처리 중·렌더 중 공통) */
export function Process({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 list-none border-y-2 border-ink p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className={cx('grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-3 gap-y-2 py-4', i > 0 && 'border-t border-line')}>
            <span aria-hidden="true" className={cx('font-serif text-[28px] font-black leading-none', item.state === 'pending' && 'text-muted')}>
              {NUMERALS[i] ?? i + 1}
            </span>
            <span className={cx('font-serif text-[18px]', item.state === 'pending' ? 'text-muted' : 'font-bold')}>{item.label}</span>
            <span className={cx('font-sans text-[13px] tabular-nums', item.state === 'failed' ? 'bg-ink px-1.5 font-bold text-bg' : item.state === 'active' ? 'font-bold' : 'text-muted')}>
              {item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}
            </span>
            {item.state === 'active' && (
              <div
                className="relative col-span-full col-start-2 h-[5px] overflow-hidden border-y border-ink"
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct ?? undefined}
              >
                {pct !== null ? <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} /> : <div className="press-sweep absolute inset-y-0 left-0 w-2/5 bg-ink" />}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/** 전체 길이 눈금자: 권장 구간(30~60초)은 빗금으로 */
export function Ruler({ seconds, actual = false, className }: { seconds: number; actual?: boolean; className?: string }) {
  const range = durationRange(seconds)
  const warn = range !== 'ok'
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className={cx('flex flex-col gap-2', className)} aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 font-sans text-[13px]">
        <p className="m-0">
          {actual ? '전체 길이' : '전체 예상 길이'} <b className="tabular-nums">{tc(seconds)}</b>
        </p>
        <p className="m-0 tabular-nums text-muted">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </p>
      </div>
      <div className="relative h-3 border-y border-ink" aria-hidden="true">
        <div
          className="absolute inset-y-0 border-x border-ink"
          style={{
            left: at(MIN_VIDEO_SEC),
            width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})`,
            backgroundImage: 'repeating-linear-gradient(135deg, #111 0 1px, transparent 1px 5px)',
          }}
        />
        <div className="absolute -bottom-1 -top-1 w-[3px] -translate-x-1/2 bg-ink" style={{ left: at(seconds) }} />
      </div>
      {warn && (
        <p className="m-0 font-sans text-[13px] font-bold">
          ▲ {range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧습니다. 문구를 늘려 주세요.` : `${MAX_VIDEO_SEC}초를 넘습니다. 문구를 줄여 주세요.`}
        </p>
      )}
    </div>
  )
}

/** 도판 겉틀: 얇은 테두리 + 아래 설명 */
export function Plate({ children, caption, className }: { children: ReactNode; caption?: ReactNode; className?: string }) {
  return (
    <figure className={cx('m-0 flex flex-col gap-2', className)}>
      <div className="border border-ink bg-bg p-1.5">{children}</div>
      {caption && <figcaption className="font-sans text-xs leading-snug text-muted">{caption}</figcaption>}
    </figure>
  )
}
