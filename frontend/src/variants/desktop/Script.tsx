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
import { Alert, Gauge, Heading, RoleTag, Win } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Explorer project={project} />}
    </Shell>
  )
}

function Explorer({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <div className="flex flex-col gap-5">
      <Heading>{v.title}</Heading>

      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Win title={`장면 목록 (${v.scenes.length})`} bodyClassName="!p-0">
          <ol className="dk-sunk m-3 list-none p-0">
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
                    className={cx('grid min-h-12 w-full grid-cols-[2rem_1fr] items-start gap-x-3 gap-y-0.5 px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent', on ? 'bg-accent text-on-accent' : 'hover:bg-panel-2')}
                  >
                    <span className="font-mono text-[14px] font-bold">{String(scene.order).padStart(2, '0')}</span>
                    <span className="flex flex-col gap-0.5">
                      <span className={cx('flex flex-wrap gap-x-3 font-mono text-[12px]', on ? 'text-on-accent' : 'text-muted')}>
                        <span className={on ? 'font-bold text-on-accent' : undefined}>{on ? `[${scene.role === 'hook' ? 'Hook' : scene.role === 'cta' ? 'CTA' : '본문'}]` : <RoleTag role={scene.role} />}</span>
                        <span>
                          {tc(start)}–{tc(end)}
                        </span>
                      </span>
                      <span className="text-[15px] leading-[1.65]">{scene.text}</span>
                    </span>
                  </button>
                  {on && (
                    <div className="appear border-t border-ink bg-panel-2 px-4 py-3">
                      <p className="m-0 mb-2 font-mono text-[12px] font-bold">속성 · 근거 문단</p>
                      {sources.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {sources.map((b) => (
                            <p key={b.id} className="m-0 border-l-4 border-accent pl-3 text-[14px] leading-[1.7] text-muted">
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
        </Win>

        <div className="flex min-w-0 flex-col gap-5">
          <Win title="요약.txt" bodyClassName="flex flex-col gap-4">
            <Gauge seconds={v.total} actual={v.allRendered} />
            {v.analysis && (
              <>
                <p className="m-0 text-[14px] leading-[1.75]">{v.analysis.summary}</p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {v.analysis.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-[1.65] text-muted">
                      <span aria-hidden="true" className="font-mono font-bold text-ink">
                        ■
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Win>

          <div className="flex flex-wrap items-center gap-3">
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
      </div>
    </div>
  )
}
