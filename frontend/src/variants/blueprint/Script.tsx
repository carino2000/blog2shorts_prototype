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
import { Alert, Balloon, Mono, Role, Ruler, Tag } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script" title="장면 구성도 · 대본">
      {(project) => <Layout project={project} />}
    </Shell>
  )
}

function Layout({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <div className="flex flex-col gap-8">
      <header className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-3">
          <Tag>장면 구성도 · {v.scenes.length}개 장면</Tag>
          <h1 className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.1]">{v.title}</h1>
          {v.analysis && <p className="m-0 max-w-3xl text-[16px] leading-[1.75] text-ink/90">{v.analysis.summary}</p>}
        </div>
        <div className="bp-dash self-start border p-4">
          <Ruler seconds={v.total} actual={v.allRendered} />
        </div>
      </header>

      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      {v.analysis && (
        <ul className="m-0 grid list-none gap-x-8 gap-y-4 p-0 sm:grid-cols-3">
          {v.analysis.keyPoints.map((p, i) => (
            <li key={i} className="bp-dash border-t pt-3 text-[14px] leading-[1.7]">
              <Tag className="mb-1 block">요점 {i + 1}</Tag>
              {p}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="bp-parts" className="flex flex-col">
        <h2 id="bp-parts" className="sr-only">
          장면 대본
        </h2>
        <ol className="m-0 list-none p-0">
          {rows.map(({ scene, start, end }, i) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            const last = i === rows.length - 1
            return (
              <li key={scene.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4">
                <div className="flex flex-col items-center">
                  <Balloon n={scene.order} on={on} className="mt-3" />
                  {!last && <i aria-hidden="true" className="bp-dash w-0 flex-1 border-l" />}
                </div>
                <div className="pb-2">
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className={cx('flex min-h-14 w-full flex-col gap-1 border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-accent bg-panel-2' : 'border-line bg-panel hover:border-edge')}
                  >
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                      <Role role={scene.role} />
                      <Mono className="text-[12px] text-muted">
                        {tc(start)} – {tc(end)}
                      </Mono>
                    </span>
                    <span className="text-[16px] leading-[1.7]">{scene.text}</span>
                  </button>
                  {on && (
                    <div className="appear bp-dash mt-1 border border-t-0 bg-bg px-4 py-3">
                      <Tag className="mb-2 block">상세 · 근거 문단</Tag>
                      {sources.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {sources.map((b) => (
                            <p key={b.id} className="m-0 border-l-2 border-accent pl-3 text-[14px] leading-[1.7] text-muted">
                              {b.text}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="m-0 text-[14px] text-muted">근거로 삼은 문단이 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="bp-dash flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-5">
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
