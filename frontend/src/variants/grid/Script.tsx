import { RotateCcw } from 'lucide-react'
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
import { Alert, Cap, Head, Mark, Num, Scale } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Index project={project} />}
    </Shell>
  )
}

function Index({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)
  const sources = v.selectedScene ? v.source.blocks.filter((b) => v.selectedScene?.sourceBlockIds.includes(b.id) && b.type !== 'image') : []

  return (
    <div className="grid-12 gap-y-10">
      <div className="col-span-12 flex items-end justify-between gap-6 md:col-span-12">
        <div className="flex items-end gap-6 sm:gap-10">
          <Num n={2} className="text-[clamp(4.5rem,11vw,8.5rem)] text-accent" />
          <Head className="pb-1">대본</Head>
        </div>
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'min-h-14 shrink-0 px-6')}>
          장면 편집 <span aria-hidden="true">→</span>
        </VLink>
      </div>

      {v.previousScriptError && (
        <div className="col-span-12">
          <Alert title="대본을 다시 만들지 못해 이전 대본을 표시합니다">{v.previousScriptError}</Alert>
        </div>
      )}

      <aside aria-label="요약과 근거" className="col-span-12 flex min-w-0 flex-col gap-8 lg:sticky lg:top-6 lg:col-span-4 lg:self-start">
        {v.analysis && (
          <section aria-labelledby="sum-title" className="flex flex-col gap-4 border-t-4 border-ink pt-3">
            <Cap>
              <span id="sum-title">핵심 요약</span>
            </Cap>
            <p className="m-0 text-[19px] font-bold leading-[1.6] tracking-[-0.01em]">{v.analysis.summary}</p>
            <ol className="m-0 list-none p-0">
              {v.analysis.keyPoints.map((p, i) => (
                <li key={i} className="grid grid-cols-[2rem_1fr] gap-x-2 border-t border-ink py-2.5 text-[15px] leading-[1.6]">
                  <b className="text-accent tabular-nums">{String(i + 1).padStart(2, '0')}</b>
                  {p}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-label="선택한 장면의 근거" className="flex flex-col gap-3 border-t-4 border-accent pt-3" aria-live="polite">
          <Cap className="text-accent">{v.selectedScene ? `근거 — 장면 ${String(v.selectedScene.order).padStart(2, '0')} (${ROLE_LABEL[v.selectedScene.role]})` : '근거'}</Cap>
          {v.selectedScene ? (
            sources.length > 0 ? (
              sources.map((b) => (
                <p key={b.id} className="m-0 border-l-[6px] border-accent pl-3 text-[15px] leading-[1.65]">
                  {b.text}
                </p>
              ))
            ) : (
              <p className="m-0 text-[15px] text-muted">근거로 삼은 문단이 없다.</p>
            )
          ) : (
            <p className="m-0 text-[15px] text-muted">오른쪽에서 장면을 고르면 근거가 된 원문이 여기에 나온다.</p>
          )}
        </section>
      </aside>

      <section aria-labelledby="script-title" className="col-span-12 flex min-w-0 flex-col gap-6 lg:col-span-8">
        <div className="flex flex-col gap-4">
          <h2 id="script-title" className="sr-only">
            장면 {v.scenes.length}개
          </h2>
          <Scale seconds={v.total} actual={v.allRendered} />
        </div>

        <ol className="m-0 list-none border-t-4 border-ink p-0">
          {rows.map(({ scene, start, end }) => {
            const on = v.selectedId === scene.id
            return (
              <li key={scene.id} className="border-b border-ink">
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className={cx(
                    'grid min-h-16 w-full grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5 py-5 text-left transition-colors duration-100 sm:grid-cols-[6rem_minmax(0,1fr)]',
                    'focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent',
                    on ? 'bg-accent-soft' : 'hover:bg-panel-2',
                  )}
                >
                  <Num n={scene.order} className={cx('pl-1 text-[clamp(2.75rem,7vw,4.5rem)]', on && 'text-accent')} />
                  <span className="flex min-w-0 flex-col gap-2 pr-2">
                    <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
                      <Mark role={scene.role} />
                      <span className="text-[13px] font-medium tabular-nums text-muted">
                        {tc(start)} – {tc(end)}
                      </span>
                    </span>
                    <span className="text-[clamp(1.125rem,2.2vw,1.5rem)] font-bold leading-[1.45] tracking-[-0.02em]">{scene.text}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="flex flex-col gap-4">
          {v.confirming && (
            <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-4 border-l-[10px] border-accent bg-accent-soft p-5">
              <p id="regen-confirm" className="m-0 text-[16px] leading-[1.65]">
                대본과 장면을 새로 만든다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라진다. 계속하겠는가?
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" data-act="regenerate-confirm" className={btn.primary} disabled={v.regeneratePending} onClick={v.regenerate}>
                  {v.regeneratePending ? '요청 중' : '다시 만들기'}
                </button>
                <button type="button" data-act="regenerate-cancel" className={btn.ghost} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                  취소
                </button>
              </div>
            </div>
          )}
          {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
          <div>
            <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
              <RotateCcw aria-hidden="true" className="size-4" />
              대본 다시 만들기
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
