import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Head } from './ui'

/** 위쪽 머리줄: 굵은 줄 아래에 이름과 4단계가 격자 칸에 맞춰 놓인다 */
export function Masthead({ steps, wide = false }: { steps: StepItem[]; wide?: boolean }) {
  return (
    <header className="border-t-[10px] border-ink">
      <div className={cx('mx-auto px-5', wide ? 'max-w-[1480px]' : 'max-w-[1240px]')}>
        <div className="grid-12 items-end pb-3 pt-3">
          <VLink to="/" className="col-span-12 flex min-h-11 items-center text-[20px] font-black tracking-[-0.04em] text-ink no-underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent sm:col-span-3">
            blog2shorts
          </VLink>
          <nav aria-label="진행 단계" className="col-span-12 sm:col-span-9">
            <ol className="m-0 grid list-none grid-cols-4 gap-x-4 p-0 sm:gap-x-6">
              {steps.map((s) => (
                <li key={s.key}>
                  <StepCell step={s} />
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <div aria-hidden="true" className="h-px bg-ink" />
      </div>
    </header>
  )
}

function StepCell({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const inner = (
    <>
      <span aria-hidden="true" className={cx('mb-1 block h-[6px]', current ? 'bg-accent' : step.state === 'done' ? 'bg-ink' : 'bg-line')} />
      <span className="flex items-baseline gap-2">
        <span className={cx('shrink-0 whitespace-nowrap text-[15px] font-black tabular-nums', current && 'text-accent')}>{String(step.index).padStart(2, '0')}</span>
        <span className={cx('whitespace-nowrap text-[14px] font-bold leading-tight', !current && step.state === 'upcoming' && 'text-muted', !current && 'max-sm:sr-only')}>{step.label}</span>
      </span>
    </>
  )
  const box = 'flex min-h-11 flex-col justify-center no-underline text-ink'
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(box, 'hover:[&_span:last-child]:underline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={box}>
      {inner}
    </span>
  )
}

export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <main className={cx('mx-auto px-5 pb-28 pt-10 sm:pt-14', wide ? 'max-w-[1480px]' : 'max-w-[1240px]')}>{children}</main>
}

export function Shell({ id, view, wide = false, children }: { id: string; view: View; wide?: boolean; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <div className="min-h-dvh">
      <Masthead steps={steps} wide={wide} />
      <Page wide={wide}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[20px] font-bold text-muted">
            불러오는 중
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="grid-12 gap-y-6">
            <div className="col-span-12 flex flex-col gap-6 md:col-span-8 md:col-start-5">
              <Head>작업이 끝났습니다.</Head>
              <p className="m-0 max-w-xl text-[18px] leading-[1.7] text-muted">작업은 서버 메모리에만 있어서 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작하세요.</p>
              <div>
                <VLink to="/" className={btn.primary}>
                  처음으로 <span aria-hidden="true">→</span>
                </VLink>
              </div>
            </div>
          </section>
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
      </Page>
    </div>
  )
}
