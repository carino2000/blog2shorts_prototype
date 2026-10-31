import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Duration, Mono, Role } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <CueSheet project={project} />}
    </Shell>
  )
}

function CueSheet({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-2">
          <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Rundown · {v.scenes.length} cues</Mono>
          <h1 className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.02] tracking-[0.01em]">{v.title}</h1>
          {v.analysis && <p className="m-0 mt-1 max-w-3xl text-[16px] leading-[1.75] text-ink/90">{v.analysis.summary}</p>}
        </div>
        <div className="rounded-card border border-edge bg-panel p-4">
          <Duration seconds={v.total} actual={v.allRendered} />
        </div>
      </div>

      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      {v.analysis && (
        <ul className="m-0 grid list-none gap-px overflow-hidden rounded-card border border-edge bg-edge p-0 sm:grid-cols-3">
          {v.analysis.keyPoints.map((p, i) => (
            <li key={i} className="bg-panel p-4 text-[14px] leading-[1.65]">
              <Mono className="mb-1 block text-[12px] font-semibold text-hi">POINT {String(i + 1).padStart(2, '0')}</Mono>
              {p}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="bc-cues" className="overflow-hidden rounded-card border border-edge bg-panel">
        <h2 id="bc-cues" className="sr-only">
          장면 대본
        </h2>
        <div className="hidden grid-cols-[3rem_6.5rem_6.5rem_5.5rem_1fr] gap-x-4 border-b border-edge bg-panel-2 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-muted md:grid" aria-hidden="true">
          <span>CUE</span>
          <span>IN</span>
          <span>OUT</span>
          <span>ROLE</span>
          <span>TEXT</span>
        </div>
        <ol className="m-0 list-none p-0">
          {rows.map(({ scene, start, end }) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className={cx(
                    'grid min-h-14 w-full grid-cols-[2.5rem_1fr] items-start gap-x-3 gap-y-1 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-hi md:grid-cols-[3rem_6.5rem_6.5rem_5.5rem_1fr] md:gap-x-4',
                    on ? 'bg-panel-2' : 'hover:bg-panel-2/60',
                  )}
                >
                  <Mono className={cx('text-[15px] font-semibold', on ? 'text-hi' : 'text-muted')}>{String(scene.order).padStart(2, '0')}</Mono>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0 md:contents">
                    <Mono className="text-[13px] text-muted">{tc(start)}</Mono>
                    <Mono className="hidden text-[13px] text-muted md:inline">{tc(end)}</Mono>
                    <Role role={scene.role} />
                  </span>
                  <span className="col-span-2 text-[16px] leading-[1.65] md:col-span-1 md:col-start-5 md:row-start-1">{scene.text}</span>
                </button>
                {on && (
                  <div className="appear border-t border-line bg-bg px-4 py-4 md:pl-[4.5rem]">
                    <Mono className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Source · 근거 문단</Mono>
                    {sources.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {sources.map((b) => (
                          <p key={b.id} className="m-0 border-l-2 border-hi pl-3 text-[14px] leading-[1.7] text-muted">
                            {b.text}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 text-[14px] text-muted">근거로 삼은 문단이 없습니다.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-edge pt-5">
        <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
          장면 편집
          <ArrowRight aria-hidden="true" className="size-4" />
        </VLink>
        <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
          <RotateCcw aria-hidden="true" className="size-4" />
          대본 다시 만들기
        </button>
      </div>

      {v.confirming && (
        <Alert
          tone="warn"
          title="대본을 다시 만들까요?"
          actions={
            <>
              <button type="button" data-act="regenerate-confirm" className={btn.primary} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중' : '다시 만들기'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.ghost} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                취소
              </button>
            </>
          }
        >
          장면을 처음부터 다시 씁니다. 고친 문구·이미지·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라집니다.
        </Alert>
      )}
      {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
    </div>
  )
}
