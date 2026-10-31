import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Sheet } from './ui'

/** 양식 아래의 쪽 번호 칸: 단계 이동 */
function Pages({ steps }: { steps: StepItem[] }) {
  return (
    <nav aria-label="진행 단계" className="border-t-2 border-ink">
      <ol className="m-0 grid list-none grid-cols-4 p-0">
        {steps.map((s, i) => {
          const on = s.state === 'current'
          const cls = cx(
            'flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 text-center no-underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
            i > 0 && 'border-l border-ink',
            on ? 'bg-ink text-white' : s.state === 'done' ? 'text-ink hover:bg-panel-2' : 'text-muted',
          )
          const inner = (
            <>
              <span className="text-[11px] font-bold">{s.index} / {steps.length}</span>
              <span className="text-[13px] font-extrabold">{s.label}</span>
            </>
          )
          return (
            <li key={s.key} className="flex">
              {s.href ? (
                <VLink to={s.href.split('?')[0] ?? '/'} className={cx(cls, 'flex-1')}>
                  {inner}
                </VLink>
              ) : (
                <span aria-current={on ? 'step' : undefined} className={cx(cls, 'flex-1')}>
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

export function Paper({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh px-3 pb-28 pt-4 sm:px-6 sm:pt-8">
      <Sheet>
        {children}
        <Pages steps={steps} />
      </Sheet>
      <p className="m-0 mt-4 text-center text-[12px] text-muted">
        <VLink to="/" className="inline-flex min-h-11 items-center px-3 font-bold text-muted underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">
          blog2shorts 처음으로
        </VLink>
      </p>
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Paper steps={steps}>
      {gate.kind === 'loading' && (
        <p role="status" className="m-0 p-6 text-[14px] text-muted">
          불러오는 중…
        </p>
      )}
      {gate.kind === 'expired' && (
        <div className="p-4">
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
        </div>
      )}
      {gate.kind === 'error' && (
        <div className="p-4">
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
        </div>
      )}
      {gate.kind === 'ready' && children(gate.project)}
    </Paper>
  )
}
