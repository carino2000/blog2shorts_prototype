import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from './styles'


export function Mono({ children, className, ...rest }: ComponentProps<'span'>) {
  return (
    <span className={cx('font-mono tabular-nums', className)} {...rest}>
      {children}
    </span>
  )
}

/** 화면 머리말: STEP 번호는 고정폭, 설명은 일반 글꼴(고정폭 글꼴에는 한글이 없다) */
export function Eyebrow({ step, children, tone = 'accent' }: { step: number; children: ReactNode; tone?: 'accent' | 'cta' }) {
  return (
    <p className="m-0 flex items-center gap-2 text-xs">
      <Mono className={cx('font-medium tracking-[0.14em]', tone === 'cta' ? 'text-cta' : 'text-accent')}>STEP {String(step).padStart(2, '0')}</Mono>
      <span aria-hidden="true" className="text-muted">·</span>
      <span className="text-muted">{children}</span>
    </p>
  )
}

/** 장면 역할: 색 + 글자 */
export function RoleTag({ role, className }: { role: Scene['role']; className?: string }) {
  const dot = { hook: 'bg-hook', body: 'bg-body', cta: 'bg-cta' }[role]
  return (
    <span className={cx('inline-flex items-center gap-1.5 text-xs font-semibold text-ink', className)}>
      <i aria-hidden="true" className={cx('size-2 rounded-[2px]', dot)} />
      {ROLE_LABEL[role]}
    </span>
  )
}

/** 오류·주의 패널 */
export function Alert({
  title,
  children,
  actions,
  tone = 'error',
  icon,
}: {
  title?: string
  children: ReactNode
  actions?: ReactNode
  tone?: 'error' | 'warn'
  icon?: LucideIcon
}) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div
      role={tone === 'error' ? 'alert' : 'note'}
      className={cx(
        'appear flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center',
        tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-accent/40 bg-accent-soft',
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-sm">
          {title && <p className={cx('m-0 font-semibold', tone === 'error' ? 'text-danger-ink' : 'text-ink')}>{title}</p>}
          <div className="text-ink">{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행 중', done: '완료', failed: '실패' }

/** 렌더 큐처럼 보이는 단계 목록(처리 중·렌더 중 공통) */
export function Queue({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-px overflow-hidden rounded-card border border-edge bg-edge p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li
            key={item.key}
            aria-current={item.state === 'active' ? 'step' : undefined}
            className={cx('flex flex-col gap-2.5 bg-panel px-4 py-3.5', item.state === 'active' && 'bg-panel-2')}
          >
            <div className="flex items-center gap-3">
              <Mono className="w-6 text-xs text-muted">{String(i + 1).padStart(2, '0')}</Mono>
              <span className={cx('flex-1 text-[15px]', item.state === 'pending' ? 'text-muted' : 'font-medium text-ink')}>{item.label}</span>
              <span
                className={cx(
                  'font-mono text-xs tabular-nums',
                  item.state === 'failed' ? 'text-danger-ink' : item.state === 'done' ? 'text-cta' : item.state === 'active' ? 'text-accent' : 'text-muted',
                )}
              >
                {item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}
              </span>
            </div>
            {item.state === 'active' && (
              <div
                className="relative h-1 overflow-hidden rounded-full bg-edge"
                role="progressbar"
                aria-label={item.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct ?? undefined}
              >
                {pct !== null ? (
                  <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
                ) : (
                  <div className="night-sweep absolute inset-y-0 left-0 w-2/5 rounded-full bg-accent" />
                )}
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}


/** 전체 길이 눈금: 0~75초 위에 권장 구간(30~60초)을 칠하고 현재 길이에 바늘을 꽂는다 */
export function RangeBar({ seconds, actual = false, className }: { seconds: number; actual?: boolean; className?: string }) {
  const range = durationRange(seconds)
  const warn = range !== 'ok'
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className={cx('flex flex-col gap-2', className)} aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[13px] text-muted">
          {actual ? '전체 길이' : '전체 예상 길이'} <Mono className={cx('text-[15px] font-semibold', warn ? 'text-danger-ink' : 'text-ink')}>{tc(seconds)}</Mono>
        </p>
        <p className="m-0 text-[11px] tabular-nums text-muted">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </p>
      </div>
      <div className="relative h-1.5 rounded-full bg-edge" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-cta/25" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-[#4a5160]" style={{ width: at(seconds) }} />
        <div className={cx('absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full', warn ? 'bg-danger' : 'bg-accent')} style={{ left: at(seconds) }} />
      </div>
      {warn && (
        <p className="m-0 flex items-center gap-1.5 text-[13px] text-danger-ink">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧습니다. 문구를 늘려 주세요.` : `${MAX_VIDEO_SEC}초를 넘습니다. 문구를 줄여 주세요.`}
        </p>
      )}
    </div>
  )
}
