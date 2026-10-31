import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Body, Shell, Topbar } from './Shell'
import { btn } from './styles'
import { Alert, Meter, Mono, Panel, RoleChip } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Review project={project} />}
    </Shell>
  )
}

function Review({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)

  return (
    <>
      <Topbar
        crumbs={['작업', v.title, '대본']}
        actions={
          <>
            <button type="button" data-act="regenerate" className={btn.ghost} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
              <RotateCcw aria-hidden="true" className="size-4" />
              대본 다시 만들기
            </button>
            <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
              장면 편집
              <ArrowRight aria-hidden="true" className="size-4" />
            </VLink>
          </>
        }
      />
      <Body className="max-w-[1280px]">
        {v.previousScriptError && <Alert title="대본을 다시 만들지 못했습니다. 이전 대본을 그대로 표시합니다.">{v.previousScriptError}</Alert>}
        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-2.5 rounded-card border border-danger-line bg-danger-soft p-3 sm:flex-row sm:items-center">
            <p id="regen-confirm" className="m-0 flex-1 text-[13px] leading-snug">
              대본과 장면을 새로 만듭니다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}은 사라집니다. 계속할까요?
            </p>
            <div className="flex gap-2">
              <button type="button" data-act="regenerate-confirm" className={btn.danger} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중…' : '다시 만들기'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.ghost} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Alert>{v.regenerateError}</Alert>}

        {v.analysis && (
          <Panel title="핵심 요약">
            <div className="grid gap-x-8 gap-y-3 p-3.5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <p className="m-0 text-[14px] leading-relaxed">{v.analysis.summary}</p>
              <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                {v.analysis.keyPoints.map((p, i) => (
                  <li key={i} className="grid grid-cols-[1.5rem_1fr] text-[13px] leading-snug">
                    <Mono className="text-[11px] text-accent">{String(i + 1).padStart(2, '0')}</Mono>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </Panel>
        )}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <Panel title={`장면 ${v.scenes.length}개`} aside={<Meter seconds={v.total} actual={v.allRendered} />}>
            <div role="table" aria-label="장면 목록">
              <div role="row" className="cmd-th hidden grid-cols-[2.25rem_4.5rem_5.5rem_1fr] gap-x-3 border-b border-line bg-panel-2 px-3.5 py-1.5 sm:grid">
                <span role="columnheader">#</span>
                <span role="columnheader">역할</span>
                <span role="columnheader">구간</span>
                <span role="columnheader">문구</span>
              </div>
              <ol className="m-0 list-none p-0">
                {rows.map(({ scene, start, end }) => {
                  const on = v.selectedId === scene.id
                  return (
                    <li key={scene.id} role="row" className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        aria-pressed={on}
                        data-scene-select
                        onClick={() => v.toggle(scene.id)}
                        className={cx(
                          'grid min-h-11 w-full grid-cols-[2.25rem_1fr] gap-x-3 gap-y-1 px-3.5 py-2.5 text-left transition-colors sm:grid-cols-[2.25rem_4.5rem_5.5rem_1fr] sm:gap-y-0',
                          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                          on ? 'bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]' : 'hover:bg-panel-2',
                        )}
                      >
                        <Mono role="cell" className="text-[12px] font-semibold text-muted">
                          {String(scene.order).padStart(2, '0')}
                        </Mono>
                        <span role="cell" className="sm:contents">
                          <span className="flex items-center gap-3 sm:contents">
                            <span>
                              <RoleChip role={scene.role} />
                            </span>
                            <Mono className="text-[12px] text-muted">
                              {tc(start)}–{tc(end)}
                            </Mono>
                          </span>
                        </span>
                        <span role="cell" className="col-span-full text-[14px] leading-snug sm:col-span-1">
                          {scene.text}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>
            <p className="m-0 border-t border-line px-3.5 py-2 text-[12px] text-muted">행을 선택하면 근거가 된 원문 문단이 오른쪽(좁은 화면은 아래)에 강조됩니다.</p>
          </Panel>

          <Panel title={v.selectedScene ? `원문 · 장면 ${v.selectedScene.order}(${ROLE_LABEL[v.selectedScene.role]}) 근거` : '원문'}>
            <ol className="m-0 max-h-[60dvh] list-none overflow-y-auto p-0">
              {v.source.blocks.map((block, i) => {
                const src = block.type === 'image' ? v.assetSrc(block) : null
                const on = v.highlight.has(block.id)
                const orders = v.usedBy.get(block.id) ?? []
                return (
                  <li key={block.id} className={cx('grid grid-cols-[1.75rem_1fr_auto] gap-x-2 border-b border-line px-3 py-2 text-[13px] leading-snug last:border-b-0', on && 'bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]')}>
                    <Mono className="pt-px text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</Mono>
                    {block.type === 'image' ? (
                      <span className="flex items-center gap-2 text-muted">
                        {src && <img src={src} alt="" loading="lazy" className="size-9 shrink-0 rounded-[3px] object-cover" />}
                        {block.text ?? '이미지'}
                      </span>
                    ) : (
                      <span className={cx(block.type === 'heading' && 'font-semibold')}>{block.text}</span>
                    )}
                    {orders.length > 0 ? (
                      <Mono className="text-[11px] text-muted" aria-label={`장면 ${orders.join(', ')}의 근거`}>
                        {orders.map((o) => `#${o}`).join(' ')}
                      </Mono>
                    ) : (
                      <span />
                    )}
                  </li>
                )
              })}
            </ol>
          </Panel>
        </div>
      </Body>
    </>
  )
}
