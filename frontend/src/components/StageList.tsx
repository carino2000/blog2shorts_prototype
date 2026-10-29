import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { cx } from '../lib/ui'

export type StageState = 'pending' | 'active' | 'done' | 'failed'

export interface StageItem {
  key: string
  label: string
  state: StageState
  /** active일 때 0~100 */
  percent?: number
}

/** 세로 단계 목록(처리 중·렌더 진행 공통). 현재 단계에 진행 표시, 실패 단계 강조 */
export function StageList({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) => (
        <li
          key={item.key}
          aria-current={item.state === 'active' ? 'step' : undefined}
          className={cx(
            'flex flex-col gap-2 rounded-card border p-4',
            item.state === 'active' && 'border-accent/40 bg-accent/5',
            item.state === 'failed' && 'border-danger/50 bg-danger/5',
            (item.state === 'pending' || item.state === 'done') && 'border-line bg-surface',
          )}
        >
          <div className="flex items-center gap-3">
            <StageIcon state={item.state} />
            <span className={cx('flex-1 text-sm', item.state === 'pending' ? 'text-muted' : 'font-medium text-ink')}>
              {item.label}
            </span>
            <span className="text-xs text-muted tabular-nums">
              {item.state === 'done' && '완료'}
              {item.state === 'failed' && <span className="font-medium text-danger">실패</span>}
              {item.state === 'active' && item.percent !== undefined && `${Math.round(item.percent)}%`}
            </span>
          </div>
          {item.state === 'active' && item.percent !== undefined && (
            <div
              className="h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label={item.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(item.percent)}
            >
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${item.percent}%` }} />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

function StageIcon({ state }: { state: StageState }) {
  const box = 'flex size-6 shrink-0 items-center justify-center rounded-full'
  if (state === 'done')
    return (
      <span className={cx(box, 'bg-cta/15 text-cta')}>
        <Check aria-hidden="true" className="size-3.5" />
      </span>
    )
  if (state === 'failed')
    return (
      <span className={cx(box, 'text-danger')}>
        <CircleAlert aria-hidden="true" className="size-5" />
      </span>
    )
  if (state === 'active')
    return (
      <span className={cx(box, 'text-accent')}>
        <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />
      </span>
    )
  return <span className={cx(box, 'border border-line')} aria-hidden="true" />
}
