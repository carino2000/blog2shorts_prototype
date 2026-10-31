import { ArrowRight, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Bars, Length, Pane, RoleLabel } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Feed project={project} />}
    </Shell>
  )
}

function Feed({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)
  const box = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const total = rows.length + 2

  function go(delta: number) {
    const el = box.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ top: delta * el.clientHeight, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="flex flex-col gap-4">
      <Pane label="장면 대본 피드">
        <div
          ref={box}
          onScroll={(e) => setPage(Math.round(e.currentTarget.scrollTop / Math.max(1, e.currentTarget.clientHeight)))}
          tabIndex={0}
          aria-label="장면을 위아래로 넘겨 보세요"
          className="st-snap absolute inset-0 overflow-y-auto focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
        >
          <article className="st-page relative flex h-full flex-col justify-end gap-3 bg-[#0a0b0e] p-5 pt-14">
            <p className="m-0 text-[12px] font-bold text-accent">대본 · 장면 {v.scenes.length}개</p>
            <h1 className="m-0 text-[26px] font-black leading-[1.25]">{v.title}</h1>
            {v.analysis && (
              <>
                <p className="m-0 text-[14px] leading-[1.7] text-white">{v.analysis.summary}</p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {v.analysis.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-white/90">
                      <b className="text-accent">{i + 1}</b>
                      {p}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="m-0 mt-2 text-[12px] text-white/80">아래로 넘겨 장면을 확인하세요 ↓</p>
          </article>

          {rows.map(({ scene, start, end }) => {
            const on = v.selectedId === scene.id
            const asset = project.assets.find((a) => a.id === scene.assetId)
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <article key={scene.id} className="st-page relative h-full">
                {asset && (
                  <div className="absolute inset-0 opacity-60">
                    <SceneFrame src={assetUrl(asset)} subtitle="" />
                  </div>
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/90" />
                <div className="absolute inset-x-0 bottom-0 flex max-h-full flex-col gap-3 overflow-y-auto p-5 pr-16">
                  <div className="flex items-center gap-2">
                    <RoleLabel role={scene.role} />
                    <span className="text-[12px] tabular-nums text-white/90">
                      {tc(start)}–{tc(end)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className="min-h-11 rounded-xl py-1 text-left text-[22px] font-extrabold leading-[1.45] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {scene.text}
                  </button>
                  {on ? (
                    <div className="appear flex flex-col gap-2 rounded-2xl bg-black/70 p-3">
                      <p className="m-0 text-[12px] font-bold text-accent">근거 문단</p>
                      {sources.length > 0 ? (
                        sources.map((b) => (
                          <p key={b.id} className="m-0 text-[13px] leading-[1.65] text-white/90">
                            {b.text}
                          </p>
                        ))
                      ) : (
                        <p className="m-0 text-[13px] text-white/90">근거로 삼은 문단이 없습니다.</p>
                      )}
                    </div>
                  ) : (
                    <p className="m-0 text-[12px] text-white/80">문구를 누르면 근거 문단이 보입니다</p>
                  )}
                </div>
              </article>
            )
          })}

          <article className="st-page relative flex h-full flex-col justify-end gap-4 bg-[#0a0b0e] p-5">
            <Length seconds={v.total} actual={v.allRendered} />
            <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'w-full')}>
              장면 편집
              <ArrowRight aria-hidden="true" className="size-4" />
            </VLink>
            <button type="button" data-act="regenerate" className={cx(btn.ghost, 'w-full')} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
              <RotateCcw aria-hidden="true" className="size-4" />
              대본 다시 만들기
            </button>
          </article>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4">
          <Bars states={Array.from({ length: total }, (_, i) => (i < page ? 'done' : i === page ? 'active' : 'pending'))} />
        </div>
        <div className="absolute bottom-4 right-2 z-10 flex flex-col gap-2">
          <button type="button" aria-label="이전 장면" className={arrow} onClick={() => go(-1)} disabled={page <= 0}>
            <ChevronUp aria-hidden="true" className="size-5" />
          </button>
          <button type="button" aria-label="다음 장면" className={arrow} onClick={() => go(1)} disabled={page >= total - 1}>
            <ChevronDown aria-hidden="true" className="size-5" />
          </button>
        </div>
      </Pane>

      {(v.previousScriptError || v.confirming || v.regenerateError) && (
        <div className="st-stage mx-auto flex flex-col gap-3">
          {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}
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
      )}
    </div>
  )
}

const arrow = 'grid size-11 place-items-center rounded-full bg-black/70 text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
