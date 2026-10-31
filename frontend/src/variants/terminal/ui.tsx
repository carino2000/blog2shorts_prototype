import { CircleAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Scene } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'

/** 명령 줄: 앞에 $ 표시. 설명 문장이 아니라 "이 화면이 실행한 명령"을 보여 준다 */
export function Cmd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('m-0 flex min-w-0 items-baseline gap-2 text-[14px]', className)}>
      <span aria-hidden="true" className="shrink-0 font-bold text-accent">
        $
      </span>
      <span className="min-w-0 break-words font-semibold text-ink">{children}</span>
    </p>
  )
}

/** 출력 줄: 약간 들여쓴 회색 글 */
export function Out({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('min-w-0 pl-4 text-[14px] leading-[1.75] text-muted sm:pl-5', className)}>{children}</div>
}

/** 한 덩어리 기록(명령 + 출력) */
export function Block({ cmd, children, className, label }: { cmd: ReactNode; children?: ReactNode; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <Cmd>{cmd}</Cmd>
      {children}
    </section>
  )
}

export function Role({ role }: { role: Scene['role'] }) {
  const c = { hook: 'text-hook', body: 'text-muted', cta: 'text-accent' }[role]
  return <span className={cx('text-[12px] font-bold uppercase', c)}>{ROLE_LABEL[role]}</span>
}

/** 9:16 화면 틀 */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-card border border-edge bg-black p-1', className)}>
      <Stage>{children}</Stage>
    </div>
  )
}

export function Alert({ title, children, actions, tone = 'error', icon }: { title?: string; children: ReactNode; actions?: ReactNode; tone?: 'error' | 'warn'; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === 'error' ? CircleAlert : TriangleAlert)
  return (
    <div role={tone === 'error' ? 'alert' : 'note'} className={cx('appear flex flex-col gap-3 rounded-card border p-4', tone === 'error' ? 'border-danger-line bg-danger-soft' : 'border-hook/60 bg-panel-2')}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon aria-hidden="true" className={cx('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-danger' : 'text-hook')} />
        <div className="min-w-0 text-[14px] leading-[1.65]">
          {title && <p className={cx('m-0 font-bold', tone === 'error' ? 'text-danger-ink' : 'text-hook')}>{tone === 'error' ? 'ERROR' : 'WARN'}: {title}</p>}
          <div>{children}</div>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 pl-8">{actions}</div>}
    </div>
  )
}

const TAG: Record<StageItem['state'], string> = { pending: '  ..  ', active: ' RUN  ', done: '  OK  ', failed: 'FAIL  ' }

/** 문자로 그린 진행 막대 [#####-----] */
export function Meter({ percent, width = 20 }: { percent: number | null; width?: number }) {
  const n = percent === null ? Math.round(width / 3) : Math.round((percent / 100) * width)
  return (
    <span aria-hidden="true" className="whitespace-pre font-bold text-accent">
      [{'#'.repeat(n)}
      <span className="text-edge">{'-'.repeat(Math.max(0, width - n))}</span>]
    </span>
  )
}

/** 작업 로그: 단계마다 [ OK ] 줄 */
export function Log({ items }: { items: StageItem[] }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1.5 p-0 pl-0 sm:pl-1">
      {items.map((item) => {
        const pct = item.percent !== undefined ? Math.round(item.percent) : null
        return (
          <li key={item.key} aria-current={item.state === 'active' ? 'step' : undefined} className="flex flex-col gap-1 text-[14px]">
            <p className="m-0 flex flex-wrap items-baseline gap-x-3">
              <span aria-hidden="true" className={cx('whitespace-pre font-bold', item.state === 'done' ? 'text-accent' : item.state === 'failed' ? 'text-danger' : item.state === 'active' ? 'text-hook' : 'text-placeholder')}>
                [{TAG[item.state]}]
              </span>
              <span className={cx(item.state === 'pending' ? 'text-muted' : 'font-semibold text-ink')}>{item.label}</span>
              {item.state === 'failed' && <b className="text-danger-ink">중단</b>}
              {item.state === 'done' && <span className="sr-only">완료</span>}
            </p>
            {item.state === 'active' && (
              <p className="m-0 flex flex-wrap items-center gap-2 pl-4 text-[13px] sm:pl-[4.5rem]" role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
                <Meter percent={pct} />
                <span className="tabular-nums text-hook">{pct !== null ? `${pct}%` : '…'}</span>
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function Total({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const width = 30
  const max = 75
  const pos = Math.min(width - 1, Math.round((Math.min(seconds, max) / max) * width))
  const lo = Math.round((MIN_VIDEO_SEC / max) * width)
  const hi = Math.round((MAX_VIDEO_SEC / max) * width)
  return (
    <div className="flex min-w-0 flex-col gap-1" aria-live="polite">
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-[14px]">
        <span className="text-muted">{actual ? 'duration(actual)' : 'duration(est)'}</span>
        <b className={cx('text-[20px] tabular-nums', range === 'ok' ? 'text-ink' : 'text-danger-ink')}>{tc(seconds)}</b>
        <span className="text-muted">권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초</span>
        {range !== 'ok' && <b className="text-danger-ink">{range === 'short' ? '짧음' : '김'}</b>}
      </p>
      <p aria-hidden="true" className="m-0 whitespace-pre text-[13px] leading-none text-edge">
        {Array.from({ length: width }, (_, i) => (
          <span key={i} className={i === pos ? (range === 'ok' ? 'font-black text-accent' : 'font-black text-danger') : i >= lo && i <= hi ? 'text-muted' : undefined}>
            {i === pos ? '|' : i >= lo && i <= hi ? '=' : '.'}
          </span>
        ))}
      </p>
    </div>
  )
}
