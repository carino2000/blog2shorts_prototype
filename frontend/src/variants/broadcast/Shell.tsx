import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Mono } from './ui'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    <Mono className="text-[13px] text-muted" >
      {p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}
    </Mono>
  )
}

/** 위쪽 송출 표시줄: ON AIR 램프, 입력 선택 버튼(CH), 시계 */
export function Bar({ steps, live }: { steps: StepItem[]; live: boolean }) {
  return (
    <header className="border-b-2 border-black bg-panel">
      <div className="mx-auto flex min-h-14 max-w-[1500px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <VLink to="/" className="flex min-h-11 items-center font-display text-[24px] font-bold uppercase tracking-[0.08em] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi">
            blog2shorts
          </VLink>
          <span
            role="status"
            className={cx('inline-flex items-center gap-2 rounded-[3px] border px-2.5 py-1 font-display text-[15px] font-bold uppercase leading-none tracking-[0.14em]', live ? 'border-accent-bright bg-accent text-white' : 'border-edge bg-bg text-muted')}
          >
            <i aria-hidden="true" className={cx('size-2.5 rounded-full', live ? 'bc-live bg-white' : 'bg-edge')} />
            {live ? 'ON AIR' : 'STANDBY'}
          </span>
        </div>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-center gap-1.5 p-0">
            {steps.map((s) => (
              <li key={s.key}>
                <Bus step={s} />
              </li>
            ))}
          </ol>
        </nav>
        <Clock />
      </div>
    </header>
  )
}

function Bus({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[3px] border px-2.5 font-display text-[17px] font-semibold uppercase leading-none tracking-[0.06em] no-underline',
    current ? 'border-hi bg-hi text-on-hi' : step.state === 'done' ? 'border-edge bg-panel-2 text-ink hover:border-muted' : 'border-line text-muted/70',
  )
  const inner = (
    <>
      <Mono className="text-[13px]">{String(step.index).padStart(2, '0')}</Mono>
      <span className={cx('font-sans text-[12px] normal-case tracking-normal', !current && 'sr-only', current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

export function Room({ steps, live = false, children }: { steps: StepItem[]; live?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Bar steps={steps} live={live} />
      {children}
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project, live: boolean) => ReactNode }) {
  const { gate, steps, busy } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Room steps={steps} live={busy}>
      <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-6 sm:px-6">
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 font-mono text-[13px] text-muted">
            신호를 기다리는 중…
          </p>
        )}
        {gate.kind === 'expired' && (
          <Alert
            title="SIGNAL LOST · 작업이 만료되었습니다"
            actions={
              <VLink to="/" className={btn.primary}>
                입력으로
              </VLink>
            }
          >
            작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.
          </Alert>
        )}
        {gate.kind === 'error' && (
          <Alert
            title="작업 상태를 불러오지 못했습니다"
            actions={
              <button type="button" className={btn.ghost} onClick={gate.retry}>
                다시 시도
              </button>
            }
          >
            {gate.message}
          </Alert>
        )}
        {gate.kind === 'ready' && children(gate.project, busy)}
      </main>
    </Room>
  )
}
