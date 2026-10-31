import { ArrowRight, RotateCcw } from 'lucide-react'
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
import { Alert, Cell, Frame, FormHead, RoleMark, Total } from './ui'

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
  const picked = rows.find((r) => r.scene.id === v.selectedId)
  const sources = picked ? v.source.blocks.filter((b) => picked.scene.sourceBlockIds.includes(b.id) && b.type !== 'image') : []

  return (
    <>
      <FormHead title="영상 콘티 (대본 확인)" no="B2S-03">
        <Cell label="제목">{v.title}</Cell>
        <Cell label="컷 수">{v.scenes.length}컷</Cell>
        <Cell label="총 길이">
          <Total seconds={v.total} actual={v.allRendered} />
        </Cell>
      </FormHead>

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

        {v.analysis && (
          <section aria-label="기획 의도" className="grid gap-4 border-2 border-ink p-4 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="m-0 mb-1 text-[13px] font-extrabold text-muted">기획 의도</h2>
              <p className="m-0 text-[15px] leading-[1.75]">{v.analysis.summary}</p>
            </div>
            <div>
              <h2 className="m-0 mb-1 text-[13px] font-extrabold text-muted">핵심 포인트</h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {v.analysis.keyPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 text-[14px] leading-[1.6]">
                    <span className="sb-pencil shrink-0 whitespace-nowrap text-[20px]">{i + 1}.</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section aria-label="장면 칸">
          <ol className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map(({ scene, start, end }) => {
              const on = v.selectedId === scene.id
              const asset = project.assets.find((a) => a.id === scene.assetId)
              return (
                <li key={scene.id} className={cx('flex flex-col border-2', on ? 'border-accent bg-accent-soft' : 'border-ink bg-surface')}>
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => v.toggle(scene.id)}
                    className="flex min-h-11 flex-1 flex-col gap-2 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span className="flex items-center justify-between gap-1">
                      <b className="text-[14px] tabular-nums">CUT {String(scene.order).padStart(2, '0')}</b>
                      <RoleMark role={scene.role} />
                    </span>
                    <Frame>{asset ? <SceneFrame src={assetUrl(asset)} subtitle="" /> : <SceneFrame src={null} subtitle="" />}</Frame>
                    <span className="text-[11px] tabular-nums text-muted">
                      {tc(start)}–{tc(end)}
                    </span>
                    <span className="text-[14px] leading-[1.6]">{scene.text}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        {picked && (
          <section aria-label="근거 문단" className="appear flex flex-col gap-2 border-l-4 border-accent pl-4">
            <h2 className="m-0 text-[13px] font-extrabold text-muted">CUT {String(picked.scene.order).padStart(2, '0')} · 근거가 된 원고</h2>
            {sources.length > 0 ? (
              sources.map((b) => (
                <p key={b.id} className="m-0 text-[14px] leading-[1.7] text-muted">
                  {b.text}
                </p>
              ))
            ) : (
              <p className="m-0 text-[14px] text-muted">근거로 삼은 문단이 없습니다.</p>
            )}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink pt-4">
          <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
            콘티 수정하기
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
    </>
  )
}
