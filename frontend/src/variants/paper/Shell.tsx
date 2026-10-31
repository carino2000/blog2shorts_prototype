import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Hand, Memo } from './ui'

/** 위쪽: 간판 + 책갈피처럼 매달린 4단계 */
export function Header({ steps, wide = false }: { steps: StepItem[]; wide?: boolean }) {
  return (
    <header className="border-b-2 border-dashed border-ink/30">
      <div className={cx('mx-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pt-4', wide ? 'max-w-[1400px]' : 'max-w-[1120px]')}>
        <VLink to="/" className="flex min-h-11 items-center pb-1 font-display text-[30px] font-bold leading-none text-ink no-underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent">
          blog2shorts <span className="ml-2 text-[20px] font-normal text-muted">작업실</span>
        </VLink>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-end gap-1.5 p-0">
            {steps.map((s) => (
              <li key={s.key}>
                <Mark step={s} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}

function Mark({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-t-[10px] border-2 border-b-0 px-3 font-display text-[20px] font-bold leading-none no-underline',
    current ? 'min-h-[3.25rem] border-ink/70 bg-surface text-ink' : step.state === 'done' ? 'border-ink/30 bg-panel-2 text-ink hover:bg-surface' : 'border-ink/15 bg-transparent text-muted',
  )
  const inner = (
    <>
      <span aria-hidden="true">{step.index}</span>
      <span className={cx(!current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

export function Shell({ id, view, wide = false, children }: { id: string; view: View; wide?: boolean; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <div className="min-h-dvh">
      <Header steps={steps} wide={wide} />
      <main className={cx('mx-auto px-5 pb-28 pt-10', wide ? 'max-w-[1400px]' : 'max-w-[1120px]')}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 font-display text-[26px] text-muted">
            작업실을 정리하는 중이에요…
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="flex max-w-lg flex-col gap-5">
            <Hand className="text-[44px]">작업이 사라졌어요.</Hand>
            <p className="m-0 text-[18px] leading-[1.75] text-muted">작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 비워져요. 처음부터 다시 시작해 주세요.</p>
            <div>
              <VLink to="/" className={btn.primary}>
                처음으로 돌아가기
              </VLink>
            </div>
          </section>
        )}
        {gate.kind === 'error' && (
          <Memo
            title="작업 상태를 불러오지 못했어요"
            actions={
              <button type="button" className={btn.ghost} onClick={gate.retry}>
                다시 시도하기
              </button>
            }
          >
            {gate.message}
          </Memo>
        )}
        {gate.kind === 'ready' && children(gate.project)}
      </main>
    </div>
  )
}
