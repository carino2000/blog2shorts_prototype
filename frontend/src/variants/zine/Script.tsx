import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { formatSec, sceneSec } from '../../lib/duration'
import { cx } from '../../lib/ui'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Dot, Hl, Ruler, Shout, Tag } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Cutout project={project} />}
    </Shell>
  )
}

function Cutout({ project }: { project: Project }) {
  const v = useScriptView(project)

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div className="flex min-w-0 max-w-3xl flex-col gap-4">
          <Shout>
            대본 <Hl>나왔다!</Hl>
          </Shout>
          <p className="m-0 text-[18px] font-semibold leading-[1.6]">
            {v.title} · 장면 {v.scenes.length}개. 문구는 다음 단계에서 마음껏 고친다.
          </p>
        </div>
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'min-h-14 text-[26px]')}>
          편집하러 가자
          <ArrowRight aria-hidden="true" className="size-6" />
        </VLink>
      </div>

      {v.previousScriptError && <Alert title="대본을 다시 못 만들어서 이전 대본을 보여 준다">{v.previousScriptError}</Alert>}

      {v.analysis && (
        <section aria-labelledby="sum-title" className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="border-[3px] border-ink bg-hi p-6 shadow-[7px_7px_0_#0a0a0a] sm:p-8">
            <h2 id="sum-title" className="m-0 mb-3 font-display text-[22px] font-normal leading-none">
              한 줄 요약
            </h2>
            <p className="m-0 font-display text-[clamp(1.375rem,2.8vw,2rem)] leading-[1.5]">“{v.analysis.summary}”</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {v.analysis.keyPoints.map((p, i) => (
              <li key={i} className={cx('flex items-start gap-4 border-[3px] border-ink bg-surface p-4 text-[17px] font-semibold leading-[1.55] shadow-[5px_5px_0_#0a0a0a] motion-reduce:rotate-0', i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]')}>
                <Dot n={i + 1} />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="script-title" className="flex flex-col gap-7">
        <div className="flex flex-col gap-4">
          <h2 id="script-title" className="m-0 font-display text-[34px] font-normal leading-none">
            <Hl>장면 오려 붙이기</Hl>
          </h2>
          <div className="max-w-xl">
            <Ruler seconds={v.total} actual={v.allRendered} />
          </div>
        </div>

        <ol className="m-0 flex list-none flex-col gap-7 p-0">
          {v.scenes.map((scene, i) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} className={cx('border-[3px] border-ink shadow-[7px_7px_0_#0a0a0a] transition-colors', on ? 'bg-hi' : 'bg-surface', i % 2 ? 'sm:ml-10' : 'sm:mr-10')}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className="flex min-h-16 w-full items-start gap-4 p-5 text-left focus-visible:outline-[4px] focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  <Dot n={scene.order} on={on} />
                  <span className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-3">
                      <Tag role={scene.role} />
                      <span className="font-sans text-[14px] font-extrabold tabular-nums">약 {formatSec(sceneSec(scene))}</span>
                    </span>
                    <span className="text-[clamp(1.1875rem,2.4vw,1.5rem)] font-bold leading-[1.55]">{scene.text}</span>
                  </span>
                </button>
                {on && (
                  <div className="appear flex flex-col gap-3 border-t-[3px] border-ink bg-surface p-5">
                    <p className="m-0 font-display text-[20px] leading-none">원문 근거</p>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 text-[17px] font-semibold leading-[1.7]">
                          <Hl>{b.text}</Hl>
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[16px] font-semibold">따로 근거 문단이 없다.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="m-0 text-[16px] font-bold text-muted">장면을 누르면 근거가 된 원문에 형광펜이 칠해진다.</p>
      </section>

      <div className="flex flex-col gap-5 border-t-[3px] border-ink pt-8">
        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-4 border-[3px] border-ink bg-ink p-5 text-bg shadow-[6px_6px_0_var(--accent)]">
            <p id="regen-confirm" className="m-0 text-[18px] font-semibold leading-[1.65]">
              대본과 장면을 갈아엎는다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라진다. 진짜 할까?
            </p>
            <div className="flex flex-wrap gap-4">
              <button type="button" data-act="regenerate-confirm" className={btn.onInk} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중' : '갈아엎자'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.onInk} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                아니, 그대로
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
        <div>
          <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
            <RotateCcw aria-hidden="true" className="size-5" />
            대본 다시 쓰기
          </button>
        </div>
      </div>
    </div>
  )
}
