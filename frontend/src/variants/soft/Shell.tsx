import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert } from './ui'

/** 아래에 떠 있는 알약 독: 단계 이동 */
function Dock({ steps }: { steps: StepItem[] }) {
  return (
    <nav aria-label="진행 단계" className="pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-30 flex justify-center px-3 sm:bottom-5">
      <ol className="sf-glass pointer-events-auto m-0 flex max-w-full list-none items-center gap-1 rounded-full p-1.5">
        {steps.map((s) => {
          const on = s.state === 'current'
          const cls = cx(
            'flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[14px] font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-5',
            on ? 'bg-accent text-on-accent' : s.state === 'done' ? 'text-ink hover:bg-white' : 'text-ink/45',
          )
          const inner = (
            <>
              <span className="tabular-nums">{s.index}</span>
              <span className={cx(!on && 'max-sm:sr-only')}>{s.label}</span>
            </>
          )
          return (
            <li key={s.key}>
              {s.href ? (
                <VLink to={s.href.split('?')[0] ?? '/'} className={cls}>
                  {inner}
                </VLink>
              ) : (
                <span aria-current={on ? 'step' : undefined} className={cls}>
                  {inner}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function Page({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-[1180px] items-center justify-between px-5 pt-5 sm:px-8">
        <VLink to="/" className="inline-flex min-h-11 items-center gap-2 text-[19px] font-bold text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <span aria-hidden="true" className="size-4 rounded-full bg-accent" />
          blog2shorts
        </VLink>
      </header>
      {children}
      <Dock steps={steps} />
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Page steps={steps}>
      <main className="mx-auto max-w-[1180px] px-5 pb-44 pt-8 sm:px-8">
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[15px] text-muted">
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
    </Page>
  )
}
