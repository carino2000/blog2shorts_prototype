import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Notice, Span, Wall } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Wallpaper project={project} />}
    </Shell>
  )
}

function Wallpaper({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-28 px-5 pb-32 pt-16 sm:px-10 sm:pt-28">
      <section aria-labelledby="sum-title" className="flex flex-col gap-10">
        <Wall>
          <span id="sum-title">{v.title}</span>
        </Wall>
        {v.analysis ? (
          <p className="m-0 max-w-[60rem] text-[clamp(1.75rem,4.4vw,3.75rem)] font-extralight leading-[1.3] tracking-[-0.035em]">{v.analysis.summary}</p>
        ) : (
          <p className="m-0 text-[18px] text-muted">요약이 없습니다.</p>
        )}
        {v.analysis && (
          <ol className="m-0 grid list-none gap-x-12 gap-y-4 p-0 text-[16px] font-light leading-[1.7] text-muted sm:grid-cols-3">
            {v.analysis.keyPoints.map((p, i) => (
              <li key={i}>
                <span className="mb-1 block text-[11px] tabular-nums text-ink">{String(i + 1).padStart(2, '0')}</span>
                {p}
              </li>
            ))}
          </ol>
        )}
      </section>

      {v.previousScriptError && <Notice title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Notice>}

      <section aria-labelledby="script-title" className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <h2 id="script-title" className="sr-only">
            대본
          </h2>
          <Span seconds={v.total} actual={v.allRendered} />
          <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
            장면 편집
            <ArrowRight aria-hidden="true" className="size-4" />
          </VLink>
        </div>

        <ol className="m-0 flex list-none flex-col p-0">
          {rows.map(({ scene, start, end }) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} className="border-t border-line">
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className="grid min-h-16 w-full grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-8 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-10 sm:py-10"
                >
                  <span className="flex flex-col gap-1 pt-2">
                    <span className="text-[13px] tabular-nums">{String(scene.order).padStart(2, '0')}</span>
                    <span className="hidden text-[11px] tabular-nums text-muted sm:block">
                      {tc(start)}–{tc(end)}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col gap-3">
                    <Wall className="text-muted">{ROLE_LABEL[scene.role]}</Wall>
                    <span className={cx('text-[clamp(1.375rem,3vw,2.5rem)] leading-[1.4] tracking-[-0.03em]', on ? 'font-normal' : 'font-extralight')}>{scene.text}</span>
                  </span>
                </button>
                {on && (
                  <div className="appear flex flex-col gap-3 pb-10 sm:pl-[10.5rem]">
                    <Wall>근거가 된 글</Wall>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 max-w-2xl text-[16px] font-light leading-[1.8] text-muted">
                          {b.text}
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[15px] text-muted">따로 근거로 삼은 문단이 없습니다.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="m-0 text-[13px] text-muted">장면을 누르면 근거가 된 글이 아래에 놓입니다.</p>
      </section>

      <div className="flex flex-col gap-6 border-t border-ink pt-10">
        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex max-w-xl flex-col gap-5">
            <p id="regen-confirm" className="m-0 text-[17px] leading-[1.8]">
              대본과 장면을 새로 만듭니다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라집니다. 계속할까요?
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <button type="button" data-act="regenerate-confirm" className={btn.link} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중' : '다시 만들기'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.quiet} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Notice>{v.regenerateError}</Notice>}
        <div>
          <button type="button" data-act="regenerate" className={btn.quiet} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
            <RotateCcw aria-hidden="true" className="size-4" />
            대본 다시 만들기
          </button>
        </div>
      </div>
    </main>
  )
}
