import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert } from './ui'

const DIR: Record<string, string> = { input: 'input', processing: 'read', script: 'script', scenes: 'scenes', result: 'video' }

/** 맨 위 상태줄: 현재 위치와 이동 버튼. 이동은 cd 라벨 버튼으로 한다 */
export function Bar({ steps }: { steps: StepItem[] }) {
  const current = steps.find((s) => s.state === 'current')
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[68rem] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5">
        <p className="m-0 flex min-h-11 items-center gap-1 text-[14px]">
          <VLink to="/" className="inline-flex min-h-11 items-center font-bold text-accent no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            blog2shorts
          </VLink>
          <span className="text-muted">:~/{DIR[current?.key ?? 'input'] ?? current?.key}</span>
        </p>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-center gap-1 p-0">
            {steps.map((s) => {
              const on = s.state === 'current'
              const cls = cx(
                'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control border px-2.5 text-[13px] font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3',
                on ? 'border-accent bg-accent text-on-accent' : s.state === 'done' ? 'border-edge text-ink hover:border-ink' : 'border-line text-muted',
              )
              const inner = (
                <>
                  <span className="tabular-nums">{s.index}</span>
                  <span className={cx(!on && 'max-sm:sr-only')}>{DIR[s.key] ?? s.label}</span>
                </>
              )
              return (
                <li key={s.key}>
                  {s.href ? (
                    <VLink to={s.href.split('?')[0] ?? '/'} aria-label={`${s.index}단계 ${s.label}`} className={cls}>
                      {inner}
                    </VLink>
                  ) : (
                    <span aria-current={on ? 'step' : undefined} aria-label={`${s.index}단계 ${s.label}`} className={cls}>
                      {inner}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </header>
  )
}

export function Term({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <Bar steps={steps} />
      {children}
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Term steps={steps}>
      <main className="mx-auto flex max-w-[68rem] flex-col gap-8 px-4 pb-10 pt-6">
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[14px] text-muted">
            loading<span className="tm-caret ml-1" aria-hidden="true" />
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
    </Term>
  )
}
