import { ArrowRight, BookOpen, ChevronDown, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Block, Project } from '../../api/types'
import { cx } from '../../lib/ui'
import { ROLE_LABEL } from '../../lib/roles'
import { withTimes } from '../shared/timeline'
import { VLink } from '../shared/VLink'
import { useScriptView } from '../shared/useScriptView'
import { Shell } from './Shell'
import { btn, tc } from './styles'
import { Alert, Eyebrow, Mono, RangeBar, RoleTag } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Board project={project} />}
    </Shell>
  )
}

function Board({ project }: { project: Project }) {
  const v = useScriptView(project)

  const rows = withTimes(v.scenes)

  const sourceBody = (
    <ol className="m-0 flex list-none flex-col gap-1 p-0">
      {v.source.blocks.map((block: Block, i: number) => {
        const src = block.type === 'image' ? v.assetSrc(block) : null
        const on = v.highlight.has(block.id)
        const orders = v.usedBy.get(block.id) ?? []
        return (
          <li
            key={block.id}
            className={cx('flex gap-3 rounded-[6px] border-l-2 px-3 py-2.5 text-[14px] leading-relaxed transition-colors', on ? 'border-accent bg-accent-soft' : 'border-transparent')}
          >
            <Mono className="w-5 shrink-0 pt-0.5 text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</Mono>
            <div className="min-w-0 flex-1">
              {block.type === 'image' ? (
                <figure className="m-0 flex items-center gap-3">
                  {src && <img src={src} alt="" loading="lazy" className="size-14 shrink-0 rounded-[4px] object-cover" />}
                  <figcaption className="text-muted">{block.text ?? '이미지'}</figcaption>
                </figure>
              ) : (
                <p className={cx('m-0', block.type === 'heading' ? 'font-semibold text-ink' : 'text-ink/90')}>{block.text}</p>
              )}
            </div>
            {orders.length > 0 && (
              <Mono className="shrink-0 pt-0.5 text-[11px] text-muted" aria-label={`장면 ${orders.join(', ')}의 근거`}>
                {orders.map((o) => `#${o}`).join(' ')}
              </Mono>
            )}
          </li>
        )
      })}
    </ol>
  )

  const sourceTitle = (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[15px] font-semibold">
      <BookOpen aria-hidden="true" className="size-4 text-muted" />
      원문
      {v.selectedScene && (
        <span className="text-[12px] font-normal text-accent">
          장면 #{v.selectedScene.order}({ROLE_LABEL[v.selectedScene.role]})의 근거
        </span>
      )}
    </span>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 max-w-2xl flex-col gap-2.5">
          <Eyebrow step={2}>대본</Eyebrow>
          <h1 className="m-0 text-[30px] font-bold leading-tight tracking-[-0.01em]">대본을 읽어 보세요.</h1>
          <p className="m-0 text-sm leading-relaxed text-muted">
            {v.title} · 장면 <Mono>{v.scenes.length}</Mono>개. 문구는 다음 단계, 편집실에서 고칩니다.
          </p>
        </div>
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'min-h-12 px-6')}>
          편집실로
          <ArrowRight aria-hidden="true" className="size-4" />
        </VLink>
      </div>

      {v.previousScriptError && (
        <Alert title="대본을 다시 만들지 못했습니다. 이전 대본을 그대로 보여 드립니다.">{v.previousScriptError}</Alert>
      )}

      {v.analysis && (
        <section aria-labelledby="sum-title" className="grid gap-6 rounded-card border border-edge bg-panel p-5 sm:p-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-10">
          <div className="flex flex-col gap-2.5">
            <h2 id="sum-title" className="m-0 text-xs font-semibold text-muted">
              핵심 요약
            </h2>
            <p className="m-0 text-[17px] leading-[1.7] text-ink">{v.analysis.summary}</p>
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0 md:border-l md:border-edge md:pl-8">
            {v.analysis.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink/90">
                <Mono className="w-5 shrink-0 pt-px text-xs text-accent">{String(i + 1).padStart(2, '0')}</Mono>
                {point}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <section aria-labelledby="script-title" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-card border border-edge bg-panel p-5">
            <h2 id="script-title" className="m-0 text-[17px] font-semibold">
              장면 순서
            </h2>
            <RangeBar seconds={v.total} actual={v.allRendered} />
          </div>

          <ol className="relative m-0 flex list-none flex-col gap-1 p-0">
            {rows.map(({ scene, start, end }) => {
              const on = v.selectedId === scene.id
              return (
                <li key={scene.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className={cx(
                      'grid min-h-11 w-full grid-cols-[3.6rem_minmax(0,1fr)] gap-4 rounded-card border p-4 text-left transition-colors duration-150',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      on ? 'border-accent/60 bg-panel-2' : 'border-edge bg-panel hover:bg-panel-2',
                    )}
                  >
                    <span className="flex flex-col gap-1 pt-0.5">
                      <Mono className="text-[13px] font-medium text-ink">{tc(start)}</Mono>
                      <Mono className="text-[11px] text-muted">~{tc(end)}</Mono>
                    </span>
                    <span className="flex min-w-0 flex-col gap-2">
                      <span className="flex items-center gap-3">
                        <Mono className="text-[11px] text-muted">#{scene.order}</Mono>
                        <RoleTag role={scene.role} />
                      </span>
                      <span className="text-[16px] leading-[1.65] text-ink">{scene.text}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="m-0 text-[13px] text-muted">장면을 누르면 원문에서 근거가 된 문단이 켜집니다.</p>

          <div className="flex flex-col gap-3 border-t border-edge pt-5">
            {v.confirming && (
              <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-3 rounded-card border border-danger-line bg-danger-soft p-4">
                <p id="regen-confirm" className="m-0 text-sm leading-relaxed">
                  대본과 장면을 새로 만듭니다. 편집실에서 고친 문구·이미지·모션{v.edited ? '과 만들어 둔 영상' : ''}은 사라집니다. 계속할까요?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" data-act="regenerate-confirm" className={btn.danger} disabled={v.regeneratePending} onClick={v.regenerate}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {v.regeneratePending ? '요청 중…' : '네, 다시 만들기'}
                  </button>
                  <button type="button" data-act="regenerate-cancel" className={btn.ghost} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                    취소
                  </button>
                </div>
              </div>
            )}
            {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
            <div>
              <button type="button" data-act="regenerate" className={btn.ghost} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
                <RotateCcw aria-hidden="true" className="size-4" />
                대본 다시 만들기
              </button>
            </div>
          </div>
        </section>

        <aside aria-label="원문" className="sticky top-20 hidden max-h-[calc(100dvh-6.5rem)] flex-col gap-3 overflow-y-auto rounded-card border border-edge bg-panel p-4 lg:flex">
          {sourceTitle}
          {sourceBody}
        </aside>
        <details className="group rounded-card border border-edge bg-panel lg:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent">
            {sourceTitle}
            <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-3 pb-4">{sourceBody}</div>
        </details>
      </div>
    </div>
  )
}
