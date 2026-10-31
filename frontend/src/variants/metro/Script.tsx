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
import { Alert, Dot, Fare, RoleChip, Sign } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Line project={project} />}
    </Shell>
  )
}

function Line({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <div className="flex flex-col gap-8">
      <Sign className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13px] font-bold text-white/80">노선 안내 · 장면 {v.scenes.length}개 역</p>
          <h1 className="m-0 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal leading-[1.2]">{v.title}</h1>
          {v.analysis && <p className="m-0 max-w-2xl text-[15px] leading-[1.8] text-white/90">{v.analysis.summary}</p>}
        </div>
        <div className="rounded-card bg-white p-4 text-ink">
          <Fare seconds={v.total} actual={v.allRendered} />
        </div>
      </Sign>

      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      {v.analysis && (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {v.analysis.keyPoints.map((p, i) => (
            <li key={i} className="flex gap-3 rounded-card bg-panel p-4 text-[15px] leading-[1.65]">
              <span aria-hidden="true" className="font-display text-[22px] leading-none text-accent">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="mt-stations">
        <h2 id="mt-stations" className="sr-only">
          장면 대본
        </h2>
        <ol className="mt-rail m-0 list-none p-0">
          {rows.map(({ scene, start, end }) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-4 pb-4 last:pb-0">
                <span className="pt-2">
                  <Dot state={on ? 'on' : 'done'} size="lg">
                    {scene.order}
                  </Dot>
                </span>
                <div className="flex min-w-0 flex-col">
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className={cx('flex min-h-14 w-full flex-col gap-1.5 rounded-card border-[3px] px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-ink bg-accent-soft' : 'border-line bg-white hover:border-ink')}
                  >
                    <span className="flex flex-wrap items-center gap-3">
                      <RoleChip role={scene.role} />
                      <span className="text-[13px] font-bold tabular-nums text-muted">
                        {tc(start)} 출발 → {tc(end)} 도착
                      </span>
                    </span>
                    <span className="text-[17px] font-semibold leading-[1.65]">{scene.text}</span>
                  </button>
                  {on && (
                    <div className="appear mt-2 flex flex-col gap-2 rounded-card bg-[#0d2240] p-4 text-white">
                      <p className="m-0 text-[13px] font-bold text-white/80">역 안내 · 근거가 된 원문</p>
                      {sources.length > 0 ? (
                        sources.map((b) => (
                          <p key={b.id} className="m-0 text-[14px] leading-[1.7] text-white/95">
                            {b.text}
                          </p>
                        ))
                      ) : (
                        <p className="m-0 text-[14px] text-white/90">근거로 삼은 문단이 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t-[6px] border-ink pt-6">
        <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
          장면 편집
          <ArrowRight aria-hidden="true" className="size-5" />
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
