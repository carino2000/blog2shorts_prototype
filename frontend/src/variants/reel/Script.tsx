import { ArrowRight, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { formatSec, sceneSec } from '../../lib/duration'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { TONE, btn } from './styles'
import { Alert, Giant, Label } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script" tone="black">
      {(project) => <Slates project={project} />}
    </Shell>
  )
}

const ROLE_TEXT = { hook: 'text-hook', body: 'text-body', cta: 'text-cta' } as const

function Slates({ project }: { project: Project }) {
  const v = useScriptView(project)
  const short = v.total < 30
  const long = v.total > 60

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-6">
        <Giant className="text-[clamp(3rem,10vw,8rem)]">대본 완성.</Giant>
        <p className="m-0 text-[19px] text-muted">
          {v.title} · 장면 {v.scenes.length}개 ·{' '}
          <b className={cx('font-display text-[24px]', short || long ? 'text-danger-ink' : 'text-accent')}>약 {formatSec(v.total)}</b>
          {(short || long) && <span className="font-semibold text-danger-ink"> {short ? '· 30초보다 짧아요' : '· 60초를 넘어요'}</span>}
        </p>
      </div>

      {v.previousScriptError && <Alert title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Alert>}

      {v.analysis && (
        <section aria-labelledby="sum-title" className="flex flex-col gap-6 border-y-[3px] border-ink py-8">
          <Label className="text-accent" >
            <span id="sum-title">핵심 요약</span>
          </Label>
          <p className="m-0 font-display text-[clamp(1.5rem,3.4vw,2.625rem)] leading-[1.35] text-ink">{v.analysis.summary}</p>
          <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
            {v.analysis.keyPoints.map((p, i) => (
              <li key={i} className="max-w-md bg-panel-2 px-4 py-3 text-[17px] leading-snug">
                <b className="mr-2 font-display text-accent">{i + 1}</b>
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="장면 대본" className="flex flex-col">
        <ol className="m-0 flex list-none flex-col p-0">
          {v.scenes.map((scene) => {
            const on = v.selectedId === scene.id
            const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
            return (
              <li key={scene.id} data-tone={on ? TONE[scene.role] : undefined} className={cx('border-b-[3px] border-line transition-colors duration-150', on && 'bg-bg text-ink')}>
                <button
                  type="button"
                  aria-pressed={on}
                  aria-expanded={on}
                  data-scene-select
                  onClick={() => v.toggle(scene.id)}
                  className="grid min-h-16 w-full grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-x-4 px-3 py-6 text-left focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-ink sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-x-8"
                >
                  <span className={cx('font-display text-[clamp(3.5rem,9vw,7rem)] leading-[0.85]', on ? 'text-ink' : ROLE_TEXT[scene.role])} aria-hidden="true">
                    {scene.order}
                  </span>
                  <span className="flex min-w-0 flex-col gap-2">
                    <span className="font-display text-[18px] leading-none">
                      {ROLE_LABEL[scene.role]} <span className="ml-2 font-sans text-[15px] font-semibold opacity-80 tabular-nums">약 {formatSec(sceneSec(scene))}</span>
                    </span>
                    <span className="text-[clamp(1.25rem,2.4vw,1.75rem)] font-semibold leading-[1.5]">{scene.text}</span>
                  </span>
                </button>
                {on && (
                  <div className="appear flex flex-col gap-3 px-3 pb-8 sm:pl-[10rem]">
                    <Label>근거가 된 글</Label>
                    {sources.length > 0 ? (
                      sources.map((b) => (
                        <p key={b.id} className="m-0 border-l-[6px] border-ink pl-4 text-[18px] font-semibold leading-[1.65]">
                          {b.text}
                        </p>
                      ))
                    ) : (
                      <p className="m-0 text-[17px] font-semibold">근거 문단이 따로 없습니다.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p className="m-0 pt-4 text-[16px] text-muted">장면을 누르면 근거가 된 글이 펼쳐집니다.</p>
      </section>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.primary, 'min-h-16 px-10 text-[28px]')}>
            편집하러 가기
            <ArrowRight aria-hidden="true" className="size-6" />
          </VLink>
          <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
            <RotateCcw aria-hidden="true" className="size-5" />
            대본 다시 만들기
          </button>
        </div>
        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-4 bg-ink p-6 text-bg">
            <p id="regen-confirm" className="m-0 text-[19px] font-semibold leading-[1.6]">
              대본과 장면을 새로 만듭니다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라집니다. 계속할까요?
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" data-act="regenerate-confirm" className={btn.onInk} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중' : '다시 만들기'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.onInk} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Alert>{v.regenerateError}</Alert>}
      </div>
    </div>
  )
}
