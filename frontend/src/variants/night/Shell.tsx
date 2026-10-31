import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Mono } from './ui'

/** 위쪽 바: 이름표 + 장(章) 표시처럼 이어진 4단계. 현재 단계에 앰버 재생 바 */
export function Header({ steps, wide = false }: { steps: StepItem[]; wide?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-bg/90 backdrop-blur">
      <div className={cx('mx-auto flex min-h-14 items-center justify-between gap-4 px-5', wide ? 'max-w-[1480px]' : 'max-w-[1200px]')}>
        <VLink to="/" className="flex min-h-11 min-w-11 items-center gap-2.5 text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <span aria-hidden="true" className="grid size-6 place-items-center rounded-[5px] bg-accent">
            <span className="size-2 rounded-[2px] bg-on-accent" />
          </span>
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight max-[479px]:sr-only">blog2shorts</span>
          <span className="hidden font-mono text-[11px] text-muted sm:inline">편집실</span>
        </VLink>
        <nav aria-label="진행 단계">
          <ol className="m-0 flex list-none items-stretch gap-1 p-0">
            {steps.map((s) => (
              <li key={s.key} className="flex">
                <StepMark step={s} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}

function StepMark({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const inner = (
    <>
      <span className="flex items-center gap-1.5">
        <Mono className={cx('text-[11px]', current ? 'text-accent' : 'text-muted')}>{String(step.index).padStart(2, '0')}</Mono>
        <span className={cx('text-[13px]', current ? 'font-semibold text-ink' : 'text-muted', !current && 'max-sm:sr-only')}>{step.label}</span>
        {step.state === 'done' && <Check aria-hidden="true" className="size-3.5 text-muted" />}
      </span>
      <span aria-hidden="true" className={cx('mt-1.5 h-0.5 w-full rounded-full', current ? 'bg-accent' : step.state === 'done' ? 'bg-[#4a5160]' : 'bg-edge')} />
    </>
  )
  const box = 'flex min-h-11 min-w-11 flex-col justify-center whitespace-nowrap px-2 sm:px-3'
  return step.href ? (
    <VLink to={stepPathOnly(step.href)} className={cx(box, 'rounded-control no-underline hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} className={box}>
      {inner}
    </span>
  )
}

// StepItem.href에는 이미 ?v=가 붙어 있다. VLink가 다시 붙이므로 경로만 넘긴다
function stepPathOnly(href: string): string {
  return href.split('?')[0] ?? '/'
}

/** 프로젝트 화면 공통 틀: 헤더, 로딩, 만료, 조회 실패, 화면 이동 */
export function Shell({
  id,
  view,
  wide = false,
  children,
}: {
  id: string
  view: View
  wide?: boolean
  children: (project: Project) => ReactNode
}) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  const width = wide ? 'max-w-[1480px]' : 'max-w-[1200px]'

  return (
    <div className="min-h-dvh">
      <Header steps={steps} wide={wide} />
      <main className={cx('mx-auto px-5 pb-40 pt-8 sm:pb-28 sm:pt-10', width)}>
        {gate.kind === 'loading' && (
          <p role="status" className="flex items-center gap-2.5 font-mono text-sm text-muted">
            <span aria-hidden="true" className="night-blink size-2 rounded-full bg-accent" />
            작업을 불러오는 중…
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="mx-auto mt-10 flex max-w-md flex-col gap-4 rounded-card border border-edge bg-panel p-7">
            <p className="m-0 text-xs text-muted">작업 없음</p>
            <h1 className="m-0 text-xl font-semibold leading-snug">이 작업은 이미 닫혔습니다.</h1>
            <p className="m-0 text-sm text-muted">작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.</p>
            <div>
              <VLink to="/" className={btn.primary}>
                입력 화면으로
              </VLink>
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
      </main>
    </div>
  )
}
