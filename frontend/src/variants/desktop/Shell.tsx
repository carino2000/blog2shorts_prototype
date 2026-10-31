import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert } from './ui'

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(t)
  }, [])
  const p = (n: number) => String(n).padStart(2, '0')
  return (
    <span className="dk-sunk hidden min-h-9 items-center px-3 font-mono text-[13px] tabular-nums sm:inline-flex">
      {p(now.getHours())}:{p(now.getMinutes())}
    </span>
  )
}

/** 아래 작업 표시줄: 단계 이동이 여기 있다 */
function Taskbar({ steps }: { steps: StepItem[] }) {
  return (
    <div className="sw-inset fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-surface shadow-[inset_0_1px_0_#fffdf5]">
      <nav aria-label="진행 단계" className="mx-auto flex max-w-[1180px] items-center gap-2 px-2 py-1.5">
        <VLink to="/" className="dk-key inline-flex min-h-11 items-center px-3 font-mono text-[13px] font-bold text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          b2s
        </VLink>
        <ol className="m-0 flex min-w-0 flex-1 list-none items-center gap-1.5 p-0">
          {steps.map((s) => {
            const on = s.state === 'current'
            const cls = cx(
              'dk-key flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 text-[13px] font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              on ? 'bg-white' : s.state === 'upcoming' && 'text-muted',
            )
            const inner = (
              <>
                <span className="font-mono tabular-nums">{s.index}</span>
                <span className={cx(!on && 'max-sm:sr-only')}>{s.label}</span>
              </>
            )
            return (
              <li key={s.key} className={cx(on && 'min-w-0 flex-1 sm:flex-none')}>
                {s.href ? (
                  <VLink to={s.href.split('?')[0] ?? '/'} className={cls}>
                    {inner}
                  </VLink>
                ) : (
                  <span aria-current={on ? 'step' : undefined} aria-pressed={on || undefined} className={cx(cls, on && 'font-bold')}>
                    {inner}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <Clock />
      </nav>
    </div>
  )
}

export function Desk({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      {children}
      <Taskbar steps={steps} />
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Desk steps={steps}>
      <main className="mx-auto max-w-[1180px] px-3 pb-10 pt-6 sm:px-6">
        {gate.kind === 'loading' && (
          <p role="status" className="dk-win m-0 inline-block px-4 py-2 font-mono text-[13px]">
            불러오는 중…
          </p>
        )}
        {gate.kind === 'expired' && (
          <Alert
            title="작업이 만료되었습니다"
            actions={
              <VLink to="/" className={btn.primary}>
                처음으로
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
        {gate.kind === 'ready' && children(gate.project)}
      </main>
    </Desk>
  )
}
