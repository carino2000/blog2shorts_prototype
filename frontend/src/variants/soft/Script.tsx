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
import { Alert, Glass, Length, RoleChip } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Talk project={project} />}
    </Shell>
  )
}

function Talk({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="sf-bubbles" className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="m-0 font-display text-[clamp(2rem,4.6vw,3.25rem)] font-normal leading-[1.2]">{v.title}</h1>
          <p className="m-0 text-[15px] text-muted">영상에서 이렇게 말해요 · 장면 {v.scenes.length}개</p>
        </header>

        {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 드려요">{v.previousScriptError}</Alert>}

        <h2 id="sf-bubbles" className="sr-only">
          장면 대본
        </h2>
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {rows.map(({ scene, start, end }, i) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            const right = i % 2 === 1
            return (
              <li key={scene.id} className={cx('flex flex-col gap-2', right ? 'items-end' : 'items-start')}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className={cx(
                    'flex min-h-14 max-w-[min(100%,34rem)] flex-col gap-2 px-6 py-4 text-left transition-[box-shadow,background-color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    right ? 'rounded-[28px] rounded-br-lg' : 'rounded-[28px] rounded-bl-lg',
                    on ? 'bg-accent-soft shadow-[0_0_0_2px_var(--accent)]' : 'sf-glass hover:bg-white',
                  )}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <RoleChip role={scene.role} />
                    <span className="text-[13px] tabular-nums text-muted">
                      {tc(start)} – {tc(end)}
                    </span>
                  </span>
                  <span className="text-[17px] leading-[1.75]">{scene.text}</span>
                </button>
                {on && (
                  <div className={cx('appear flex max-w-[min(100%,34rem)] flex-col gap-2 rounded-[22px] border border-dashed border-edge px-5 py-4', right && 'self-end')}>
                    <p className="m-0 text-[13px] font-semibold text-muted">이 장면의 근거가 된 글</p>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 text-[14px] leading-[1.75] text-muted">
                          “{b.text}”
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[14px] text-muted">따로 근거로 삼은 문단은 없어요.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <aside className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-6">
        <Glass className="flex flex-col gap-5 p-6">
          <Length seconds={v.total} actual={v.allRendered} />
          {v.analysis && (
            <>
              <p className="m-0 text-[15px] leading-[1.8]">{v.analysis.summary}</p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {v.analysis.keyPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 text-[14px] leading-[1.7] text-muted">
                    <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Glass>

        <div className="flex flex-wrap items-center gap-3">
          <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
            장면 편집하기
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
            장면을 처음부터 다시 써요. 고친 문구·이미지·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라져요.
          </Alert>
        )}
        {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
      </aside>
    </div>
  )
}
