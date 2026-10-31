import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Huge, Notice } from './ui'

/** 위쪽: 이름과 4단계 번호만. 지금 단계만 이름이 보인다 */
export function Header({ steps, children }: { steps: StepItem[]; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-10">
        <VLink to="/" className="flex min-h-11 items-center text-[15px] font-semibold tracking-[-0.02em] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          blog2shorts
        </VLink>
        {children}
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-center gap-1 p-0">
            {steps.map((s) => (
              <li key={s.key}>
                <Pip step={s} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}

function Pip({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx('flex min-h-11 min-w-11 items-center justify-center gap-2 px-1.5 text-[13px] tabular-nums no-underline', current ? 'font-semibold text-ink' : step.state === 'done' ? 'text-ink' : 'text-muted/70')
  const inner = (
    <>
      <span className={cx(current && 'underline decoration-1 underline-offset-[6px]')}>{String(step.index).padStart(2, '0')}</span>
      <span className={cx('font-normal', !current && 'sr-only', current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'hover:underline hover:underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

export function Shell({ id, view, headerExtra, children }: { id: string; view: View; headerExtra?: ReactNode; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <div className="min-h-dvh">
      <Header steps={steps}>{headerExtra}</Header>
      {gate.kind === 'loading' && (
        <main className="mx-auto max-w-[1500px] px-5 pt-24 sm:px-10">
          <p role="status" className="m-0 text-[15px] text-muted">
            불러오는 중
          </p>
        </main>
      )}
      {gate.kind === 'expired' && (
        <main className="mx-auto flex max-w-[1500px] flex-col gap-10 px-5 pb-32 pt-24 sm:px-10">
          <Huge>끝났습니다.</Huge>
          <p className="m-0 max-w-md text-[17px] leading-[1.8] text-muted">작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.</p>
          <div>
            <VLink to="/" className={btn.primary}>
              처음으로
            </VLink>
          </div>
        </main>
      )}
      {gate.kind === 'error' && (
        <main className="mx-auto max-w-[1500px] px-5 pt-16 sm:px-10">
          <Notice
            title="작업 상태를 불러오지 못했습니다"
            actions={
              <button type="button" className={btn.link} onClick={gate.retry}>
                다시 시도
              </button>
            }
          >
            {gate.message}
          </Notice>
        </main>
      )}
      {gate.kind === 'ready' && children(gate.project)}
    </div>
  )
}
