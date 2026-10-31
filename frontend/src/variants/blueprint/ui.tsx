import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono tabular-nums', className)}>{children}</span>
}

/** 도면 안의 작은 제목 (예: DETAIL A) */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-hi', className)}>{children}</span>
}

/** 번호 풍선 */
export function Balloon({ n, on = false, className }: { n: number | string; on?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cx('inline-grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[12px] font-semibold', on ? 'border-accent bg-accent text-on-accent' : 'border-edge text-ink', className)}>
      {n}
    </span>
  )
}

export function Role({ role }: { role: Scene['role'] }) {
  const c = { hook: 'text-accent', body: 'text-muted', cta: 'text-cta' }[role]
  return <span className={cx('font-mono text-[12px] font-semibold uppercase tracking-[0.1em]', c)}>{ROLE_LABEL[role]}</span>
}

/** 9:16 화면 + 가로·세로 치수선 */
export function Dimensioned({ children, width = '1080', height = '1920', className }: { children: ReactNode; width?: string; height?: string; className?: string }) {
  return (
    <figure className={cx('m-0 grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] gap-x-2 gap-y-1', className)}>
      <span aria-hidden="true" />
      <p className="m-0 flex items-center gap-2 font-mono text-[11px] text-muted" aria-hidden="true">
        <i className="h-px flex-1 bg-edge" />
        {width}
        <i className="h-px flex-1 bg-edge" />
      </p>
      <p className="m-0 flex flex-col items-center gap-2 font-mono text-[11px] text-muted [writing-mode:vertical-rl]" aria-hidden="true">
        <i className="w-px flex-1 bg-edge" />
        {height}
        <i className="w-px flex-1 bg-edge" />
      </p>
      <div className="border border-edge bg-black p-1.5">
        <Stage>{children}</Stage>
      </div>
    </figure>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 border border-dashed p-4 sm:flex-row sm:items-center', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-accent bg-panel-2')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-accent')} />
        <div className="min-w-0 text-[14px] leading-[1.65]">
          {title && <p className={cx('m-0 font-mono text-[13px] font-semibold uppercase tracking-[0.06em]', tone === 'error' ? 'text-danger-ink' : 'text-accent')}>{title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const STATE_TEXT: Record<StageItem['state'], string> = { pending: '대기', active: '진행', done: '완료', failed: '중단' }

/** 공정도: 단계 상자를 선으로 잇는다 */
export function Flow({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {items.map((item, i) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        const last = i === items.length - 1
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4">
            <div className="flex flex-col items-center">
              <Balloon n={i + 1} on={item.state === 'active'} className={cx(item.state === 'done' && 'border-cta text-cta', item.state === 'failed' && 'border-danger text-danger-ink', item.state === 'active' && 'size-9')} />
              {!last && <i aria-hidden="true" className={cx('w-px flex-1', item.state === 'done' ? 'bg-cta' : 'bg-edge')} />}
            </div>
            <div className={cx('mb-4 border p-4', item.state === 'active' ? 'border-accent bg-panel-2' : item.state === 'failed' ? 'border-danger-line bg-danger-soft' : 'border-line bg-panel')}>
              <div className="flex items-center justify-between gap-3">
                <p className={cx('m-0 text-[16px]', item.state === 'pending' ? 'text-muted' : 'font-semibold')}>{item.label}</p>
                <Mono className={cx('text-[12px] font-semibold', item.state === 'failed' ? 'text-danger-ink' : item.state === 'done' ? 'text-cta' : item.state === 'active' ? 'text-accent' : 'text-muted')}>{item.state === 'active' && pct !== null ? `${pct}%` : STATE_TEXT[item.state]}</Mono>
              </div>
              {item.state === 'active' && (
                <div className="mt-3 h-2 border border-edge" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                  <div className={cx('h-full bg-accent transition-[width] duration-500', pct === null && 'w-1/3 motion-safe:animate-pulse')} style={pct !== null ? { width: `${pct}%` } : undefined} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** 길이 눈금자 */
export function Ruler({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const max = 75
  const at = (s: number) => `${(Math.min(s, max) / max) * 100}%`
  return (
    <div className="flex min-w-0 flex-col gap-2" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[12px] text-muted">
        <Tag>{actual ? '실제 길이' : '예상 길이'}</Tag>
        <Mono className={cx('text-[22px] font-semibold', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</Mono>
        <span>
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <div className="relative h-5 border-b border-edge" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} className={cx('absolute bottom-0 w-px bg-edge', i % 5 === 0 ? 'h-3' : 'h-1.5')} style={{ left: `${(i * 5 * 100) / max}%` }} />
        ))}
        <div className="absolute inset-y-0 bg-accent/20" style={{ left: at(MIN_VIDEO_SEC), width: `calc(${at(MAX_VIDEO_SEC)} - ${at(MIN_VIDEO_SEC)})` }} />
        <div className={cx('absolute -top-1 bottom-0 w-[3px] -translate-x-1/2', range === 'ok' ? 'bg-accent' : 'bg-danger')} style={{ left: at(seconds) }} />
      </div>
    </div>
  )
}
