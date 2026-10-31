import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { formatSec, sceneSec } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Length, Note, Question } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Read project={project} />}
    </Shell>
  )
}

const ROLE_TEXT = { hook: '시작', body: '이야기', cta: '마무리' } as const

function Read({ project }: { project: Project }) {
  const v = useScriptView(project)

  return (
    <div className="flex flex-col gap-12">
      <Question hint={`${v.title} · 장면 ${v.scenes.length}개로 나눴어요. 문구는 다음 단계에서 마음껏 고칠 수 있어요.`}>대본을 이렇게 썼어요.</Question>

      {v.previousScriptError && <Note title="대본을 다시 쓰지 못해서 이전 대본을 보여 드려요">{v.previousScriptError}</Note>}

      {v.analysis && (
        <section aria-labelledby="sum-title" className="flex flex-col gap-4 rounded-[18px] bg-panel-2 p-6 sm:p-8">
          <h2 id="sum-title" className="m-0 text-[17px] font-semibold text-muted">
            글을 한마디로 하면
          </h2>
          <p className="m-0 text-[22px] font-semibold leading-[1.65]">{v.analysis.summary}</p>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[18px] leading-[1.7]">
            {v.analysis.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 size-2 shrink-0 rounded-full bg-accent" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="script-title" className="flex flex-col gap-6">
        <h2 id="script-title" className="m-0 text-[26px] font-bold tracking-[-0.01em]">
          장면 순서
        </h2>
        <Length seconds={v.total} text={`다 합치면 약 ${formatSec(v.total)}예요.`} />

        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {v.scenes.map((scene) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} className={cx('rounded-[18px] border-2 transition-colors duration-150', on ? 'border-accent bg-accent-soft' : 'border-line bg-surface')}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-expanded={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className="flex min-h-16 w-full items-start gap-4 rounded-[16px] p-5 text-left focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-[18px] font-bold text-bg">
                    {scene.order}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-[15px] font-semibold text-muted">
                      {ROLE_TEXT[scene.role]}({ROLE_LABEL[scene.role]}) · 약 {formatSec(sceneSec(scene))}
                    </span>
                    <span className="text-[20px] leading-[1.7]">{scene.text}</span>
                  </span>
                  <ChevronDown aria-hidden="true" className={cx('mt-2 size-5 shrink-0 text-muted transition-transform', on && 'rotate-180')} />
                </button>
                {on && (
                  <div className="appear flex flex-col gap-2 border-t-2 border-accent/20 px-5 pb-5 pl-[4.25rem] pt-4">
                    <p className="m-0 text-[15px] font-semibold text-muted">이 장면은 글의 이 부분을 바탕으로 했어요</p>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 border-l-4 border-accent pl-4 text-[17px] leading-[1.75]">
                          {b.text}
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[17px] text-muted">근거로 삼은 문단이 따로 없어요.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="m-0 text-[16px] text-muted">장면을 누르면 근거가 된 글을 보여 드려요.</p>
      </section>

      <div className="flex flex-col gap-5 border-t-2 border-line pt-10">
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'w-full sm:w-auto sm:self-start')}>
          좋아요, 장면을 고쳐 볼게요
          <ArrowRight aria-hidden="true" className="size-5" />
        </VLink>

        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-4 rounded-[18px] border-2 border-danger-line bg-danger-soft p-6">
            <p id="regen-confirm" className="m-0 text-[18px] leading-[1.75]">
              대본을 처음부터 다시 쓸게요. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라져요. 그래도 괜찮을까요?
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" data-act="regenerate-confirm" className={btn.secondary} disabled={v.regeneratePending} onClick={v.regenerate}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.regeneratePending ? '요청 중…' : '네, 다시 써 주세요'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.quiet} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                아니요, 그대로 둘게요
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Note>{v.regenerateError}</Note>}
        <div>
          <button type="button" data-act="regenerate" className={btn.quiet} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
            <RotateCcw aria-hidden="true" className="size-5" />
            대본을 다시 써 볼래요
          </button>
        </div>
      </div>
    </div>
  )
}
