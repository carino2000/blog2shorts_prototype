import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Notice, Poster } from './ui'

const ACT = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ']

/** 위쪽 검은 띠: 제작사 이름과 막 번호(단계). 극장 전구 띠가 아래를 두른다 */
export function Letterbox({ steps }: { steps: StepItem[] }) {
  return (
    <header className="bg-black">
      <div className="mx-auto flex min-h-14 max-w-[1400px] items-center justify-between gap-6 px-5 sm:px-10">
        <VLink to="/" className="flex min-h-11 items-center font-display text-[20px] font-bold tracking-[0.08em] text-accent no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          blog2shorts
          <span className="ml-3 hidden font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-muted sm:inline">presents</span>
        </VLink>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-center gap-1 p-0">
            {steps.map((s, i) => (
              <li key={s.key}>
                <Act step={s} numeral={ACT[i] ?? String(s.index)} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div aria-hidden="true" className="cin-bulbs h-3 opacity-70" />
    </header>
  )
}

function Act({ step, numeral }: { step: StepItem; numeral: string }) {
  const current = step.state === 'current'
  const cls = cx('flex min-h-11 min-w-11 items-center justify-center gap-2 px-2.5 font-display text-[17px] font-bold no-underline', current ? 'text-accent' : step.state === 'done' ? 'text-ink' : 'text-muted/60')
  const inner = (
    <>
      <span className={cx(current && 'border-b border-accent')}>{numeral}</span>
      <span className={cx('font-sans text-[12px] font-medium', !current && 'sr-only', current && 'max-sm:sr-only')}>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={cls}>
      {inner}
    </span>
  )
}

/** 아래쪽 검은 띠 */
function Foot() {
  return (
    <footer aria-hidden="true" className="mt-24 bg-black py-6">
      <div className="mx-auto max-w-[1400px] px-5 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.4em] text-muted sm:px-10">A blog2shorts production</div>
    </footer>
  )
}

export function Page({ steps, children }: { steps: StepItem[]; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Letterbox steps={steps} />
      {children}
      <Foot />
    </div>
  )
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Page steps={steps}>
      {gate.kind === 'loading' && (
        <main className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-10">
          <p role="status" className="m-0 font-display text-[22px] text-muted">
            필름을 거는 중…
          </p>
        </main>
      )}
      {gate.kind === 'expired' && (
        <main className="mx-auto flex max-w-[1400px] flex-col items-center gap-9 px-5 pt-24 text-center sm:px-10">
          <Poster>상영이 끝났습니다.</Poster>
          <p className="m-0 max-w-md text-[17px] leading-[1.8] text-muted">작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.</p>
          <VLink to="/" className={btn.primary}>
            처음으로
          </VLink>
        </main>
      )}
      {gate.kind === 'error' && (
        <main className="mx-auto max-w-[1400px] px-5 pt-16 sm:px-10">
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
    </Page>
  )
}
