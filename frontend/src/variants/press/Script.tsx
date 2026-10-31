import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Block, Project } from '../../api/types'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Kicker, Notice, RoleMark, Ruler } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Spread project={project} />}
    </Shell>
  )
}

function Spread({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  const sourceBody = (
    <ol className="m-0 flex list-none flex-col p-0">
      {v.source.blocks.map((block: Block, i: number) => {
        const src = block.type === 'image' ? v.assetSrc(block) : null
        const on = v.highlight.has(block.id)
        const orders = v.usedBy.get(block.id) ?? []
        return (
          <li key={block.id} className={cx('grid grid-cols-[2rem_1fr] gap-x-3 border-l-[5px] py-2.5 pl-3 transition-colors', on ? 'border-ink bg-panel-2' : 'border-transparent')}>
            <span className="pt-1.5 font-sans text-[11px] tabular-nums text-muted">{i + 1}</span>
            <div className="min-w-0">
              {block.type === 'image' ? (
                <figure className="m-0 flex items-center gap-3">
                  {src && <img src={src} alt="" loading="lazy" className="press-photo size-16 shrink-0 border border-ink object-cover" />}
                  <figcaption className="font-sans text-xs italic text-muted">도판 · {block.text ?? '사진'}</figcaption>
                </figure>
              ) : (
                <p className={cx('m-0 font-serif text-[16px] leading-[1.9]', block.type === 'heading' && 'font-black')}>{block.text}</p>
              )}
              {orders.length > 0 && (
                <p className="m-0 mt-0.5 font-sans text-[11px] text-muted" aria-label={`장면 ${orders.join(', ')}의 근거`}>
                  → 장면 {orders.join('·')}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-ink pb-8">
        <div className="flex min-w-0 max-w-3xl flex-col gap-3">
          <Kicker>대본 · 교정 전</Kicker>
          <h1 className="m-0 font-serif text-[40px] font-black leading-[1.1] tracking-[-0.03em] sm:text-[56px]">{v.title}</h1>
          <p className="m-0 font-sans text-sm text-muted">
            장면 <b className="text-ink tabular-nums">{v.scenes.length}</b>개. 문구는 다음 단계에서 고칩니다.
          </p>
        </div>
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'min-h-12 px-7 text-base')}>
          장면 교정으로
          <ArrowRight aria-hidden="true" className="size-4" />
        </VLink>
      </div>

      {v.previousScriptError && <Notice title="대본을 다시 쓰지 못했습니다. 이전 대본을 그대로 싣습니다.">{v.previousScriptError}</Notice>}

      {v.analysis && (
        <section aria-labelledby="lede" className="grid gap-x-14 gap-y-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            <h2 id="lede" className="m-0 font-sans text-xs font-bold tracking-[0.12em]">
              핵심 요약
            </h2>
            <p className="m-0 font-serif text-[22px] font-semibold leading-[1.7] tracking-[-0.01em] sm:text-[25px]">{v.analysis.summary}</p>
          </div>
          <ol className="m-0 flex list-none flex-col p-0 md:border-l md:border-ink md:pl-10">
            {v.analysis.keyPoints.map((point, i) => (
              <li key={i} className={cx('grid grid-cols-[1.6rem_1fr] gap-x-2 py-2.5 font-serif text-[16px] leading-[1.75]', i > 0 && 'border-t border-line')}>
                <b className="font-sans text-xs leading-[2.2]">{i + 1}</b>
                {point}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-x-14 gap-y-8 border-t-2 border-ink pt-8 lg:grid-cols-2">
        <section aria-labelledby="script-title" className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 id="script-title" className="m-0 font-serif text-[26px] font-black tracking-[-0.02em]">
              대본
            </h2>
            <Ruler seconds={v.total} actual={v.allRendered} />
          </div>

          <ol className="m-0 list-none border-t-2 border-ink p-0">
            {rows.map(({ scene, start, end }) => {
              const on = v.selectedId === scene.id
              return (
                <li key={scene.id} className="border-b border-line">
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className={cx(
                      'grid min-h-11 w-full grid-cols-[3rem_1fr] gap-x-4 border-l-[6px] py-4 pl-3 pr-2 text-left transition-colors duration-150',
                      'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink',
                      on ? 'border-ink bg-panel-2' : 'border-transparent hover:bg-panel-2',
                    )}
                  >
                    <span className="font-serif text-[40px] font-black leading-[0.95]">{scene.order}</span>
                    <span className="flex min-w-0 flex-col gap-2">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-xs text-muted">
                        <RoleMark role={scene.role} />
                        <span className="tabular-nums">
                          {tc(start)}–{tc(end)}
                        </span>
                      </span>
                      <span className="font-serif text-[18px] leading-[1.75]">{scene.text}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="m-0 font-sans text-xs text-muted">장면을 누르면 근거가 된 원문 문단에 굵은 줄이 그어집니다.</p>

          <div className="flex flex-col gap-3 border-t border-ink pt-5">
            {v.confirming && (
              <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-3 bg-ink p-4 text-bg">
                <p id="regen-confirm" className="m-0 font-serif text-[16px] leading-[1.75]">
                  대본과 장면을 새로 씁니다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}은 사라집니다. 계속할까요?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" data-act="regenerate-confirm" className={btn.onInk} disabled={v.regeneratePending} onClick={v.regenerate}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {v.regeneratePending ? '요청 중…' : '네, 다시 쓰기'}
                  </button>
                  <button type="button" data-act="regenerate-cancel" className={btn.onInk} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                    취소
                  </button>
                </div>
              </div>
            )}
            {v.regenerateError && <Notice>{v.regenerateError}</Notice>}
            <div>
              <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
                <RotateCcw aria-hidden="true" className="size-4" />
                대본 다시 쓰기
              </button>
            </div>
          </div>
        </section>

        <aside aria-label="원문" className="hidden min-w-0 flex-col gap-4 lg:order-first lg:flex lg:border-r lg:border-ink lg:pr-14">
          <h2 className="m-0 font-serif text-[26px] font-black tracking-[-0.02em]">
            원문
            {v.selectedScene && <span className="ml-3 font-sans text-xs font-normal text-muted">장면 {v.selectedScene.order}({ROLE_LABEL[v.selectedScene.role]})의 근거</span>}
          </h2>
          <div className="max-h-[70dvh] overflow-y-auto border-t-2 border-ink">{sourceBody}</div>
        </aside>
        <details className="group border-y border-ink lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            <span className="font-serif text-[20px] font-black">원문 보기</span>
            <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4">{sourceBody}</div>
        </details>
      </div>
    </div>
  )
}
