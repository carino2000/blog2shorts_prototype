import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert } from './ui'

/** 위쪽 줄: 로고와 단계 점. 단계 이동은 점을 누른다 */
export function Top({ steps }: { steps: StepItem[] }) {
  return (
    <header className="mx-auto flex min-h-14 max-w-[56rem] items-center justify-between gap-4 px-4">
      <VLink to="/" className="inline-flex min-h-11 items-center text-[16px] font-extrabold text-white no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        blog2shorts
      </VLink>
      <nav aria-label="진행 단계">
        <ol className="m-0 flex list-none items-center gap-1 p-0">
          {steps.map((s) => {
            const on = s.state === 'current'
            const cls = cx(
              'grid size-11 place-items-center rounded-full text-[14px] font-extrabold tabular-nums no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              on ? 'bg-accent text-on-accent' : s.state === 'done' ? 'bg-white/15 text-white hover:bg-white/25' : 'text-white/55',
            )
            return (
              <li key={s.key}>
                {s.href ? (
                  <VLink to={s.href.split('?')[0] ?? '/'} aria-label={`${s.index}단계 ${s.label}`} className={cls}>
                    {s.index}
                  </VLink>
                ) : (
                  <span aria-current={on ? 'step' : undefined} aria-label={`${s.index}단계 ${s.label}`} className={cls}>
                    {s.index}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </header>
  )
}

export function Page({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <Top steps={steps} />
      {children}
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Page steps={steps}>
      <main className="mx-auto max-w-[56rem] px-4 pt-2">
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[14px] text-muted">
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
