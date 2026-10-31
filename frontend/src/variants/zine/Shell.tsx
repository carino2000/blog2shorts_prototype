import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Hl, Shout } from './ui'

/** 위쪽: 검은 띠에 붙인 스티커 */
export function Top({ steps, wide = false }: { steps: StepItem[]; wide?: boolean }) {
  return (
    <header className="border-b-[3px] border-ink bg-ink">
      <div className={cx('mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3', wide ? 'max-w-[1440px]' : 'max-w-[1240px]')}>
        <VLink
          to="/"
          className="inline-flex min-h-11 -rotate-2 items-center border-[3px] border-ink bg-hi px-3 font-display text-[26px] leading-none text-ink no-underline shadow-[4px_4px_0_var(--accent)] focus-visible:outline-[4px] focus-visible:outline-offset-4 focus-visible:outline-bg motion-reduce:rotate-0"
        >
          blog2shorts!
        </VLink>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-center gap-2 p-0">
            {steps.map((s) => (
              <li key={s.key}>
                <Sticker step={s} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}

function Sticker({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 min-w-11 items-center justify-center gap-2 border-[3px] px-2.5 font-display text-[20px] leading-none no-underline',
    current ? 'border-bg bg-accent text-ink shadow-[3px_3px_0_var(--hi)]' : step.state === 'done' ? 'border-bg bg-bg text-ink hover:bg-hi' : 'border-bg/40 text-bg/70',
  )
  const inner = (
    <>
      {step.index}
      <span className={cx(!current && 'sr-only', current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'focus-visible:outline-[4px] focus-visible:outline-offset-2 focus-visible:outline-bg')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={cx('mx-auto px-5 pb-28 pt-10 sm:pt-14', wide ? 'max-w-[1440px]' : 'max-w-[1240px]')}>{children}</main>
}

export function Shell({ id, view, wide = false, children }: { id: string; view: View; wide?: boolean; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <div className="min-h-dvh">
      <Top steps={steps} wide={wide} />
      <Page wide={wide}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 font-display text-[30px]">
            <Hl>불러오는 중!</Hl>
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="flex max-w-2xl flex-col gap-7">
            <Shout>
              <Hl>끝났다!</Hl>
            </Shout>
            <p className="m-0 text-[19px] font-semibold leading-[1.7]">이 작업은 서버 메모리에서 사라졌다. 서버가 다시 켜지면 작업이 비워진다. 처음부터 다시 하자.</p>
            <div>
              <VLink to="/" className={btn.primary}>
                처음으로
              </VLink>
            </div>
          </section>
        )}
        {gate.kind === 'error' && (
          <Alert
            title="작업 상태를 못 불러왔다"
            actions={
              <button type="button" className={btn.onInk} onClick={gate.retry}>
                다시 시도
              </button>
            }
          >
            {gate.message}
          </Alert>
        )}
        {gate.kind === 'ready' && children(gate.project)}
      </Page>
    </div>
  )
}
