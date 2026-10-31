import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Giant } from './ui'

export type Tone = 'black' | 'coral' | 'cobalt' | 'lime'

/** 화면 하나 = 색면 하나 */
export function Field({ tone, steps, actions, wide = false, children }: { tone: Tone; steps: StepItem[]; actions?: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <div data-tone={tone} className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
        <div className={cx('mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2', wide ? 'max-w-[1500px]' : 'max-w-[1280px]')}>
          <VLink to="/" className="flex min-h-11 items-center font-display text-[24px] leading-none text-ink no-underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink">
            blog2shorts
          </VLink>
          <nav aria-label="진행 단계">
            <ol className="m-0 flex list-none items-center gap-1.5 p-0">
              {steps.map((s) => (
                <li key={s.key}>
                  <Pip step={s} />
                </li>
              ))}
            </ol>
          </nav>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        <div aria-hidden="true" className="h-[3px] bg-ink" />
      </header>
      {children}
    </div>
  )
}

function Pip({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 min-w-11 items-center justify-center gap-2 px-2.5 font-display text-[18px] leading-none no-underline',
    current ? 'bg-ink text-bg' : step.state === 'done' ? 'text-ink underline decoration-[3px] underline-offset-[6px]' : 'text-ink opacity-50',
  )
  const inner = (
    <>
      {String(step.index).padStart(2, '0')}
      <span className={cx(!current && 'sr-only', current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'hover:no-underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

export function Shell({
  id,
  view,
  tone,
  wide,
  actions,
  children,
}: {
  id: string
  view: View
  tone: Tone | ((project: Project) => Tone)
  wide?: boolean
  actions?: (project: Project) => ReactNode
  children: (project: Project) => ReactNode
}) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  const project = gate.kind === 'ready' ? gate.project : undefined
  return (
    <Field tone={project ? (typeof tone === 'function' ? tone(project) : tone) : 'black'} steps={steps} wide={wide} actions={project ? actions?.(project) : undefined}>
      <main className={cx('mx-auto px-5 pb-28 pt-8 sm:pt-12', wide ? 'max-w-[1500px]' : 'max-w-[1280px]')}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 font-display text-[28px]">
            불러오는 중…
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="flex flex-col gap-8">
            <Giant>끝났습니다.</Giant>
            <p className="m-0 max-w-xl text-[19px] leading-[1.7] text-muted">이 작업은 서버 메모리에서 사라졌습니다. 서버가 다시 시작되면 작업이 비워집니다. 처음부터 다시 시작해 주세요.</p>
            <div>
              <VLink to="/" className={btn.primary}>
                처음으로
              </VLink>
            </div>
          </section>
        )}
        {gate.kind === 'error' && (
          <Alert
            title="작업 상태를 불러오지 못했습니다"
            actions={
              <button type="button" className={btn.onInk} onClick={gate.retry}>
                다시 시도
              </button>
            }
          >
            {gate.message}
          </Alert>
        )}
        {project && children(project)}
      </main>
    </Field>
  )
}
