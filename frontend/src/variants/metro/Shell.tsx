import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert } from './ui'

/** 위쪽 노선도: 가로 굵은 선 위에 단계 역 네 개. 역을 누르면 이동 */
export function LineMap({ steps }: { steps: StepItem[] }) {
  return (
    <header className="border-b-[6px] border-ink bg-white">
      <div className="mx-auto flex max-w-[64rem] flex-col gap-1 px-4 pb-3 pt-2">
        <VLink to="/" className="inline-flex min-h-11 items-center self-start font-display text-[22px] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          blog2shorts
        </VLink>
        <nav aria-label="진행 단계">
          <ol className="relative m-0 grid list-none grid-cols-4 p-0">
            <i aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-[1.375rem] h-3 -translate-y-1/2 bg-line" />
            {steps.map((s, i) => {
              const on = s.state === 'current'
              const done = s.state === 'done'
              const dot = (
                <>
                  <span
                    aria-hidden="true"
                    className={cx('relative z-10 grid size-11 place-items-center rounded-full border-[5px] font-display text-[18px] leading-none', on ? 'border-ink bg-accent text-white' : done ? 'border-accent bg-white text-accent' : 'border-line bg-white text-muted')}
                  >
                    {s.index}
                  </span>
                  <span className={cx('text-[13px] font-extrabold leading-tight', on ? 'text-ink' : done ? 'text-accent' : 'text-muted')}>{s.label}</span>
                </>
              )
              const cls = 'flex min-h-14 flex-col items-center gap-1 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
              return (
                <li key={s.key} className="relative flex justify-center">
                  {i < steps.length - 1 && done && <i aria-hidden="true" className="absolute left-1/2 top-[1.375rem] z-0 h-3 w-full -translate-y-1/2 bg-accent" />}
                  {s.href ? (
                    <VLink to={s.href.split('?')[0] ?? '/'} className={cls}>
                      {dot}
                    </VLink>
                  ) : (
                    <span aria-current={on ? 'step' : undefined} className={cls}>
                      {dot}
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

export function Station({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-24">
      <LineMap steps={steps} />
      {children}
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Station steps={steps}>
      <main className="mx-auto flex max-w-[64rem] flex-col gap-8 px-4 pb-10 pt-8">
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 text-[15px] text-muted">
            노선 정보를 불러오는 중…
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
    </Station>
  )
}
