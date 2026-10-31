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
import { Alert, Block, Out, Role, Total } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Cat project={project} />}
    </Shell>
  )
}

function Cat({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <>
      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      <Block cmd="cat summary.md" label="요약">
        <Out>
          <h1 className="m-0 mb-2 text-[clamp(1.25rem,3vw,1.75rem)] font-bold leading-snug text-ink"># {v.title}</h1>
          {v.analysis && (
            <>
              <p className="m-0 max-w-3xl text-[14px] leading-[1.8] text-ink/90">{v.analysis.summary}</p>
              <ul className="m-0 mt-2 flex list-none flex-col gap-0.5 p-0 text-[14px]">
                {v.analysis.keyPoints.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span aria-hidden="true" className="shrink-0 text-accent">
                      -
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Out>
      </Block>

      <Block cmd="cat script.log" label="장면 대본">
        <Out>
          <ol className="m-0 list-none overflow-hidden rounded-card border border-edge p-0">
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
                    className={cx('grid min-h-11 w-full grid-cols-[2rem_1fr] items-start gap-x-3 gap-y-0.5 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:grid-cols-[2rem_6.5rem_3.5rem_1fr]', on ? 'bg-accent-soft' : 'hover:bg-panel-2')}
                  >
                    <b className={cx('text-[14px] tabular-nums', on ? 'text-accent' : 'text-muted')}>{String(scene.order).padStart(2, '0')}</b>
                    <span className="text-[12px] tabular-nums text-muted">
                      {tc(start)}-{tc(end)}
                    </span>
                    <Role role={scene.role} />
                    <span className="col-span-2 text-[14px] leading-[1.7] text-ink md:col-span-1">{scene.text}</span>
                  </button>
                  {on && (
                    <div className="appear border-t border-line bg-bg px-4 py-3 md:pl-[11.5rem]">
                      <p className="m-0 mb-1 text-[12px] font-bold text-hi">└─ source</p>
                      {sources.length > 0 ? (
                        sources.map((b) => (
                          <p key={b.id} className="m-0 text-[13px] leading-[1.7] text-muted">
                            &gt; {b.text}
                          </p>
                        ))
                      ) : (
                        <p className="m-0 text-[13px] text-muted"># 근거로 삼은 문단이 없습니다.</p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <p className="m-0 mt-2 text-[12px]"># 줄을 누르면 근거 문단이 열립니다.</p>
        </Out>
      </Block>

      <Block cmd="b2s stat">
        <Out>
          <Total seconds={v.total} actual={v.allRendered} />
        </Out>
      </Block>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pl-5">
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
    </>
  )
}
