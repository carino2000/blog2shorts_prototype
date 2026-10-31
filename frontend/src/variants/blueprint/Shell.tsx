import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { btn } from './styles'
import { Alert, Mono, Tag } from './ui'

/** 표제란: 도면 맨 아래. 단계 이동은 여기 시트 번호 칸으로 한다 */
function TitleBlock({ steps, title }: { steps: StepItem[]; title: string }) {
  const current = steps.find((s) => s.state === 'current')
  return (
    <footer className="grid border-t-2 border-edge sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-6 border-b border-edge px-4 py-3 sm:border-b-0 sm:border-r">
        <div className="min-w-0">
          <Tag>도면명</Tag>
          <p className="m-0 text-[15px] font-semibold leading-snug">{title}</p>
        </div>
        <VLink to="/" className="min-h-11 content-center font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-ink no-underline focus-visible:outline-2 focus-visible:outline-accent">
          blog2shorts
        </VLink>
      </div>
      <nav aria-label="진행 단계" className="flex items-stretch">
        <Tag className="hidden self-center px-4 text-muted sm:block">
          시트 {current?.index ?? 1}/{steps.length}
        </Tag>
        <ol className="m-0 grid min-w-0 flex-1 list-none grid-cols-4 p-0">
          {steps.map((s) => {
            const on = s.state === 'current'
            const cls = cx(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 border-l border-edge px-3 text-center no-underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
              on ? 'bg-accent text-on-accent' : s.state === 'done' ? 'text-ink hover:bg-panel-2' : 'text-placeholder',
            )
            const inner = (
              <>
                <Mono className="text-[14px] font-semibold">{String(s.index).padStart(2, '0')}</Mono>
                <span className="text-[11px] leading-none">{s.label}</span>
              </>
            )
            return (
              <li key={s.key} className="flex">
                {s.href ? (
                  <VLink to={s.href.split('?')[0] ?? '/'} className={cx(cls, 'flex-1')}>
                    {inner}
                  </VLink>
                ) : (
                  <span aria-current={on ? 'step' : undefined} className={cx(cls, 'flex-1')}>
                    {inner}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </footer>
  )
}

/** 도면 한 장: 이중 테두리 + 아래 표제란 */
export function Sheet({ steps, title, children }: { steps: StepItem[]; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] p-3 pb-24 sm:p-6 sm:pb-24">
      <div className="bp-sheet flex min-h-[calc(100dvh-3rem)] flex-col">
        <div className="flex-1 p-4 sm:p-8">{children}</div>
        <TitleBlock steps={steps} title={title} />
      </div>
    </div>
  )
}

export function Shell({ id, view, title, children }: { id: string; view: View; title: string; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  return (
    <Sheet steps={steps} title={title}>
      {gate.kind === 'loading' && (
        <p role="status" className="m-0 font-mono text-[13px] text-muted">
          도면을 불러오는 중…
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
    </Sheet>
  )
}
