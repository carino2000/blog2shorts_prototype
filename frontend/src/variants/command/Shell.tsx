import { Command, Film, Keyboard, X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import type { Project } from '../../api/types'
import type { View } from '../../lib/projectView'
import { cx } from '../../lib/ui'
import { useProjectGate, type StepItem } from '../shared/useProjectGate'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { btn } from './styles'
import { Alert, Kbd, Mono } from './ui'

const KEY_OF: Record<string, string> = { input: 'I', script: 'S', scenes: 'E', result: 'V' }

const SHORTCUTS: { scope: string; items: [string[], string][] }[] = [
  { scope: '어디서나', items: [[['?'], '단축키 도움말'], [['G', 'I'], '입력으로'], [['G', 'S'], '대본으로'], [['G', 'E'], '장면 편집으로'], [['G', 'V'], '영상으로']] },
  { scope: '장면 편집', items: [[['J'], '다음 장면 선택'], [['K'], '이전 장면 선택'], [['E'], '선택한 장면의 문구 편집'], [['Ctrl', 'Enter'], '영상 만들기']] },
]

/** 왼쪽 내비게이션 + 본문. 글쓰는 중이 아닐 때만 단축키가 동작한다 */
export function Frame({ steps, project, children }: { steps: StepItem[]; project?: Project; children: ReactNode }) {
  const navigate = useVariantNavigate()
  const dialog = useRef<HTMLDialogElement>(null)
  const chord = useRef<number | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (dialog.current?.open) return
      if (e.key === '?') {
        e.preventDefault()
        dialog.current?.showModal()
        return
      }
      if (chord.current !== null) {
        window.clearTimeout(chord.current)
        chord.current = null
        const hit = steps.find((s) => KEY_OF[s.key]?.toLowerCase() === e.key.toLowerCase())
        if (hit?.href) {
          e.preventDefault()
          navigate(hit.href.split('?')[0] ?? '/')
        }
        return
      }
      if (e.key.toLowerCase() === 'g') chord.current = window.setTimeout(() => (chord.current = null), 1200)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps, navigate])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[13.75rem_minmax(0,1fr)]">
      <aside className="border-b border-edge bg-panel lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex flex-wrap items-center justify-between gap-x-3 px-3 lg:flex-col lg:flex-nowrap lg:items-stretch lg:gap-5 lg:px-3 lg:py-4">
          <VLink to="/" className="flex min-h-11 items-center gap-2 rounded-control px-1.5 text-[14px] font-bold text-ink no-underline focus-visible:outline-2 focus-visible:outline-accent">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-[5px] bg-ink text-bg">
              <Film className="size-3.5" />
            </span>
            blog2shorts
          </VLink>

          <nav aria-label="작업 단계" className="order-last w-full min-w-0 pb-1.5 lg:order-none lg:block lg:w-auto lg:pb-0">
            <ol className="m-0 grid list-none grid-cols-4 gap-1 p-0 lg:flex lg:flex-col">
              {steps.map((s) => (
                <li key={s.key}>
                  <NavItem step={s} />
                </li>
              ))}
            </ol>
          </nav>

          {project && (
            <dl className="m-0 hidden flex-col gap-2 border-t border-line pt-4 text-[12px] lg:flex">
              <dt className="cmd-th">작업</dt>
              <dd className="m-0 line-clamp-3 font-semibold leading-snug">{project.source.title ?? '직접 입력한 본문'}</dd>
              <dt className="cmd-th mt-1">장면</dt>
              <dd className="m-0">
                <Mono>{project.scenes.length}</Mono>개
              </dd>
            </dl>
          )}

          <div className="hidden md:block lg:mt-auto">
            <button type="button" onClick={() => dialog.current?.showModal()} className={cx(btn.quiet, 'justify-start px-1.5')} aria-label="단축키 도움말 열기">
              <Keyboard aria-hidden="true" className="size-4" />
              단축키
              <Kbd className="ml-auto">?</Kbd>
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>

      <dialog ref={dialog} aria-label="단축키" className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-card border border-edge bg-panel p-0 text-ink shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop:bg-black/40">
        <div className="flex items-center justify-between border-b border-line px-4 py-1">
          <h2 className="m-0 flex items-center gap-2 text-[14px] font-semibold">
            <Command aria-hidden="true" className="size-4" />
            단축키
          </h2>
          <button type="button" aria-label="닫기" onClick={() => dialog.current?.close()} className="grid size-11 place-items-center rounded-control text-muted hover:bg-segment focus-visible:outline-2 focus-visible:outline-accent">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4">
          {SHORTCUTS.map((g) => (
            <section key={g.scope}>
              <h3 className="cmd-th m-0 mb-1.5">{g.scope}</h3>
              <ul className="m-0 list-none p-0">
                {g.items.map(([keys, label]) => (
                  <li key={label} className="flex items-center justify-between gap-3 border-b border-line py-1.5 text-[13px] last:border-b-0">
                    {label}
                    <span className="flex gap-1">
                      {keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="m-0 text-[12px] text-muted">입력칸에 글을 쓰는 중에는 단축키가 꺼집니다.</p>
        </div>
      </dialog>
    </div>
  )
}

function NavItem({ step }: { step: StepItem }) {
  const current = step.state === 'current'
  const cls = cx(
    'flex min-h-11 items-center justify-center gap-1.5 rounded-control px-1.5 text-[13px] no-underline whitespace-nowrap lg:w-full lg:justify-start lg:gap-2.5 lg:px-2.5',
    current ? 'bg-segment font-semibold text-ink shadow-[inset_2px_0_0_var(--accent)]' : step.href ? 'text-ink hover:bg-segment' : 'text-muted',
  )
  const inner = (
    <>
      <Mono className={cx('text-[11px]', current ? 'text-accent' : 'text-muted')}>{String(step.index).padStart(2, '0')}</Mono>
      <span>{step.label}</span>
      <span className="ml-auto hidden lg:block">
        <Kbd>G {KEY_OF[step.key]}</Kbd>
      </span>
    </>
  )
  return step.href ? (
    <VLink to={step.href.split('?')[0] ?? '/'} className={cx(cls, 'focus-visible:outline-2 focus-visible:outline-accent')}>
      {inner}
    </VLink>
  ) : (
    <span aria-current={current ? 'step' : undefined} aria-disabled={current ? undefined : true} className={cls}>
      {inner}
    </span>
  )
}

/** 본문 위쪽 줄: 경로와 작업 버튼. 스크롤해도 위에 붙어 있다 */
export function Topbar({ crumbs, actions }: { crumbs: ReactNode[]; actions?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-edge bg-bg/95 px-4 py-1.5 backdrop-blur sm:px-6">
      <nav aria-label="현재 위치" className="min-w-0">
        <ol className="m-0 flex list-none items-center gap-1.5 p-0 text-[13px] text-muted">
          {crumbs.map((c, i) => (
            <li key={i} className={cx('flex min-w-0 items-center gap-1.5', i === crumbs.length - 1 && 'font-semibold text-ink')}>
              {i > 0 && (
                <span aria-hidden="true" className="text-edge">
                  /
                </span>
              )}
              <span className="truncate">{c}</span>
            </li>
          ))}
        </ol>
      </nav>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx('mx-auto flex max-w-[1180px] flex-col gap-4 px-4 pb-24 pt-5 sm:px-6', className)}>{children}</main>
}

export function Shell({ id, view, children }: { id: string; view: View; children: (project: Project) => ReactNode }) {
  const { gate, steps } = useProjectGate(id, view)
  if (gate.kind === 'redirect') return <Navigate to={gate.to} replace />
  const project = gate.kind === 'ready' ? gate.project : undefined
  return (
    <Frame steps={steps} project={project}>
      {gate.kind === 'loading' && (
        <>
          <Topbar crumbs={['작업']} />
          <Body>
            <p role="status" className="m-0 font-mono text-[13px] text-muted">
              작업을 불러오는 중…
            </p>
          </Body>
        </>
      )}
      {gate.kind === 'expired' && (
        <>
          <Topbar crumbs={['작업', '없음']} />
          <Body>
            <Alert
              title="작업이 만료되었습니다"
              actions={
                <VLink to="/" className={btn.primary}>
                  입력 화면으로
                </VLink>
              }
            >
              작업은 서버 메모리에만 있어서 서버가 다시 시작되면 사라집니다. 처음부터 다시 시작해 주세요.
            </Alert>
          </Body>
        </>
      )}
      {gate.kind === 'error' && (
        <>
          <Topbar crumbs={['작업', '오류']} />
          <Body>
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
          </Body>
        </>
      )}
      {project && children(project)}
    </Frame>
  )
}
