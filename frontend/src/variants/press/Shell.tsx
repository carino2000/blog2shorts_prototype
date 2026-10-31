import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Kicker, Notice } from './ui'

const NUMERALS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ']

/** 제호(題號): 굵은 윗줄 + 가운데 이름 + 겹줄 아래 구역 탭처럼 이어진 4단계 */
export function Masthead({ steps, wide = false }: { steps: StepItem[]; wide?: boolean }) {
  return (
    <header className="border-t-[6px] border-ink">
      <div className={cx('mx-auto px-5', wide ? 'max-w-[1280px]' : 'max-w-[1180px]')}>
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <p className="m-0 hidden w-48 font-sans text-xs leading-snug text-muted sm:block">블로그 글을 세로 영상으로 조판하는 작업실</p>
          <VLink to="/" className="mx-auto flex min-h-11 items-center px-2 font-serif text-[28px] font-black tracking-[-0.04em] text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:text-[32px]">
            blog2shorts
          </VLink>
          <span aria-hidden="true" className="hidden w-48 sm:block" />
        </div>
        <nav aria-label="진행 단계" className="press-double border-b border-ink">
          <ol className="m-0 grid list-none grid-cols-4 p-0">
            {steps.map((s, i) => (
              <li key={s.key} className={cx('flex', i > 0 && 'border-l border-ink')}>
                <Step step={s} numeral={NUMERALS[i] ?? String(s.index)} />
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  )
}

function Step({ step, numeral }: { step: StepItem; numeral: string }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 w-full items-center justify-center gap-1.5 px-1 py-1 font-sans text-[13px] no-underline sm:gap-2 sm:text-sm',
    current ? 'bg-ink font-bold text-bg' : step.state === 'done' ? 'font-semibold text-ink' : 'text-muted',
  )
  const inner = (
    <>
      <span aria-hidden="true" className="font-serif text-[15px] font-black">
        {numeral}
      </span>
      <span>{step.label}</span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ink')}>
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
      <Masthead steps={steps} wide={wide} />
      <main className={cx('mx-auto px-5 pb-40 pt-10 sm:pb-28 sm:pt-12', wide ? 'max-w-[1280px]' : 'max-w-[1180px]')}>
        {gate.kind === 'loading' && (
          <p role="status" className="m-0 font-serif text-lg italic text-muted">
            원고를 불러오는 중…
          </p>
        )}
        {gate.kind === 'expired' && (
          <section className="flex max-w-xl flex-col gap-4 border-y-2 border-ink py-8">
            <Kicker>정정</Kicker>
            <h1 className="m-0 font-serif text-[30px] font-black leading-tight tracking-[-0.02em]">이 원고는 이미 마감되었습니다.</h1>
            <p className="m-0 font-serif text-[17px] leading-relaxed text-muted">작업은 서버 메모리에만 있어서, 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.</p>
            <div>
              <VLink to="/" className={btn.primary}>
                새 원고 쓰기
              </VLink>
            </div>
          </section>
        )}
        {gate.kind === 'error' && (
          <Notice
            title="작업 상태를 불러오지 못했습니다"
            actions={
              <button type="button" className={btn.onInk} onClick={gate.retry}>
                다시 시도
              </button>
            }
          >
            {gate.message}
          </Notice>
        )}
        {gate.kind === 'ready' && children(gate.project)}
      </main>
    </div>
  )
}
