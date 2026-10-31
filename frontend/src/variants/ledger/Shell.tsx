import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Note, Question } from './ui'

/** 위쪽: 이름 + 지금 몇 단계인지 한눈에. 지난 단계는 눌러서 돌아갈 수 있다 */
export function Header({ steps, width = 'max-w-[760px]' }: { steps: StepItem[]; width?: string }) {
  const current = steps.find((s) => s.state === 'current')
  return (
    <header className={cx('mx-auto px-6 pt-6 sm:pt-8', width)}>
      <div className="flex items-center justify-between gap-4">
        <VLink to="/" className="flex min-h-11 items-center gap-2.5 text-[17px] font-bold text-ink no-underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-accent text-[15px] font-black text-on-accent">
            b
          </span>
          blog2shorts
        </VLink>
        {current && (
          <p className="m-0 text-[16px] text-muted" aria-hidden="true">
            <b className="text-ink">{current.index}</b> / {steps.length} 단계
          </p>
        )}
      </div>
      <nav aria-label="진행 단계" className="mt-5">
        <ol className="m-0 grid list-none grid-cols-4 gap-2.5 p-0">
          {steps.map((s) => (
            <li key={s.key}>
              <StepBar step={s} />
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}

function StepBar({ step }: { step: StepItem }) {
  const inner = (
    <>
      <span aria-hidden="true" className={cx('block h-2 rounded-full', step.state === 'upcoming' ? 'bg-line' : 'bg-accent', step.state === 'done' && 'opacity-45')} />
      <span className={cx('mt-1 block text-[14px] leading-tight', step.state === 'current' ? 'font-bold text-ink' : 'text-muted', step.state !== 'current' && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  const box = 'flex min-h-11 flex-col justify-center'
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(box, 'rounded-[8px] no-underline hover:[&_span:last-child]:text-ink focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={step.state === 'current' ? 'step' : undefined} className={box}>
      {inner}
    </span>
  )
}

export function Shell({ id, view, width = 'max-w-[760px]', children }: { id: string; view: View; width?: string; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <div className="min-h-dvh pb-24">
      <Header steps={steps} width={width} />
      <main className={cx('mx-auto px-6 pb-16 pt-12 sm:pt-16', width)}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[20px] text-muted">
            불러오고 있어요…
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="flex flex-col gap-8">
            <Question hint="작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라져요. 처음부터 다시 시작해 주세요.">이 작업은 이미 닫혔어요.</Question>
            <div>
              <VLink to="/" className={btn.primary}>
                처음으로 가기
              </VLink>
            </div>
          </section>
        )}
        {gate.kind === 'error' && (
          <Note
            title="작업 상태를 불러오지 못했어요"
            actions={
              <button type="button" className={btn.secondary} onClick={gate.retry}>
                다시 시도하기
              </button>
            }
          >
            {gate.message}
          </Note>
        )}
        {gate.kind === 'ready' && children(gate.project)}
      </main>
    </div>
  )
}
