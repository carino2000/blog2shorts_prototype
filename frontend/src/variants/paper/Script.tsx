import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { formatSec, sceneSec } from '../../lib/duration'
import { cx } from '../../lib/ui'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { NOTE, btn } from './styles'
import { Hand, Length, Memo, Stamp } from './ui'

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

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="flex min-w-0 max-w-2xl flex-col gap-2">
          <Hand className="text-[clamp(2.25rem,5vw,3.5rem)]">대본을 이렇게 써 봤어요.</Hand>
          <p className="m-0 text-[18px] leading-[1.7] text-muted">
            {v.title} · 장면 {v.scenes.length}개. 마음에 안 드는 곳은 다음 단계에서 고칠 수 있어요.
          </p>
        </div>
        <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
          장면 고치러 가기
          <ArrowRight aria-hidden="true" className="size-5" />
        </VLink>
      </div>

      {v.previousScriptError && <Memo title="대본을 다시 쓰지 못해서 이전 대본을 보여 드려요">{v.previousScriptError}</Memo>}

      {v.analysis && (
        <section aria-labelledby="sum-title" className="grid gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className={cx(NOTE, 'paper-tape bg-surface p-6 sm:p-8')} style={{ ['--note' as string]: '#fffdf7' }}>
            <Hand as="h2" id="sum-title" className="mb-2 text-[28px]">
              글을 한마디로 하면
            </Hand>
            <p className="paper-lined m-0 text-[19px]">{v.analysis.summary}</p>
          </div>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {v.analysis.keyPoints.map((p, i) => (
              <li key={i} data-note="hook" className={cx(NOTE, 'flex gap-3 p-4 text-[17px] leading-[1.6] motion-reduce:rotate-0', i % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.8deg]')}>
                <b className="font-display text-[26px] leading-none">{i + 1}</b>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="script-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Hand as="h2" id="script-title" className="text-[34px]">
            장면 메모
          </Hand>
          <div className="max-w-xl">
            <Length seconds={v.total} actual={v.allRendered} />
          </div>
        </div>

        <ol className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
          {v.scenes.map((scene) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} data-note={scene.role} className={cx(NOTE, 'paper-tape flex flex-col', on && 'outline-[3px] outline-dashed outline-offset-4 outline-accent')}>
                <button
                  type="button"
                  aria-pressed={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className="flex min-h-16 flex-1 flex-col gap-3 p-5 pt-6 text-left focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent"
                >
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border-2 border-ink/70 font-display text-[22px] font-bold leading-none">
                      {scene.order}
                    </span>
                    <Stamp role={scene.role} />
                    <span className="ml-auto text-[15px] text-ink/70">약 {formatSec(sceneSec(scene))}</span>
                  </span>
                  <span className="text-[19px] font-medium leading-[1.7]">{scene.text}</span>
                </button>
                {on && (
                  <div className="appear flex flex-col gap-2 border-t-2 border-dashed border-ink/40 p-5 pt-4">
                    <p className="m-0 text-[15px] font-bold text-ink/70">이 장면은 글의 이 부분에서 왔어요</p>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 text-[17px] leading-[1.75]">
                          <span className="paper-mark">{b.text}</span>
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[16px]">따로 근거로 삼은 문단이 없어요.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="m-0 text-[16px] text-muted">메모를 누르면 근거가 된 글에 형광펜이 칠해져요.</p>
      </section>

      <div className="flex flex-col gap-4 border-t-2 border-dashed border-ink/30 pt-8">
        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear paper-note flex flex-col gap-4 rounded-[4px] border-l-[6px] border-danger bg-danger-soft p-5">
            <p id="regen-confirm" className="m-0 text-[18px] leading-[1.7]">
              대본과 장면을 처음부터 다시 써요. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라져요. 그래도 괜찮을까요?
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" data-act="regenerate-confirm" className={btn.ghost} disabled={v.regeneratePending} onClick={v.regenerate}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.regeneratePending ? '요청 중…' : '네, 다시 써 주세요'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.quiet} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                아니에요, 그대로 둘게요
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Memo>{v.regenerateError}</Memo>}
        <div>
          <button type="button" data-act="regenerate" className={btn.quiet} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
            <RotateCcw aria-hidden="true" className="size-4" />
            대본을 다시 써 볼래요
          </button>
        </div>
      </div>
    </div>
  )
}
