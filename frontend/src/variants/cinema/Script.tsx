import { ArrowRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { withTimes } from '../shared/timeline'
import { useScriptView } from '../shared/useScriptView'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Label, Notice, Poster, Runtime } from './ui'

export function Script() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="script">
      {(project) => <Screenplay project={project} />}
    </Shell>
  )
}

function Screenplay({ project }: { project: Project }) {
  const v = useScriptView(project)
  const rows = withTimes(v.scenes)
  const [rolling, setRolling] = useState(false)
  const box = useRef<HTMLOListElement>(null)

  // 크레딧 재생: 천천히 올라가고, 사용자가 만지면 멈춘다
  useEffect(() => {
    if (!rolling) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const el = box.current
      if (!el) return
      el.scrollTop += ((now - last) / 1000) * 38
      last = now
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setRolling(false)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rolling])

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col items-center gap-14 px-5 pt-14 sm:px-10 sm:pt-20">
      <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
        <Label>Screenplay · {v.scenes.length} scenes</Label>
        <Poster className="text-[clamp(2.25rem,6.5vw,5rem)]">{v.title}</Poster>
        {v.analysis && <p className="m-0 font-display text-[clamp(1.25rem,2.4vw,1.75rem)] leading-[1.7] text-ink/90">“{v.analysis.summary}”</p>}
      </div>

      {v.previousScriptError && (
        <div className="w-full max-w-2xl">
          <Notice title="대본을 다시 만들지 못해 이전 대본을 보여 줍니다">{v.previousScriptError}</Notice>
        </div>
      )}

      {v.analysis && (
        <ol className="m-0 grid w-full max-w-4xl list-none gap-x-10 gap-y-5 p-0 text-center sm:grid-cols-3">
          {v.analysis.keyPoints.map((p, i) => (
            <li key={i} className="border-t border-accent/40 pt-4 text-[16px] leading-[1.75] text-muted">
              <span className="mb-1 block font-display text-[22px] font-bold text-accent">{['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][i] ?? i + 1}</span>
              {p}
            </li>
          ))}
        </ol>
      )}

      <section aria-labelledby="credits-title" className="flex w-full max-w-3xl flex-col items-center gap-8">
        <h2 id="credits-title" className="sr-only">
          장면 대본
        </h2>
        <div className="flex w-full flex-wrap items-end justify-between gap-6">
          <Runtime seconds={v.total} actual={v.allRendered} />
          <button type="button" className={btn.ghost} onClick={() => setRolling((r) => !r && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)} aria-pressed={rolling}>
            {rolling ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            {rolling ? '크레딧 정지' : '크레딧 재생'}
          </button>
        </div>

        <div className="relative w-full">
          <ol ref={box} onWheel={() => setRolling(false)} onTouchStart={() => setRolling(false)} className="m-0 flex max-h-[68dvh] list-none flex-col items-stretch overflow-y-auto p-0 [scrollbar-width:thin]">
            {rows.map(({ scene, start, end }) => {
              const on = v.selectedId === scene.id
              const sources = v.source.blocks.filter((b) => scene.sourceBlockIds.includes(b.id) && b.type !== 'image')
              return (
                <li key={scene.id} className="border-b border-edge/70 last:border-b-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    data-scene-select
                    onClick={() => {
                      setRolling(false)
                      v.toggle(scene.id)
                    }}
                    className={cx('flex min-h-16 w-full flex-col items-center gap-3 px-4 py-10 text-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent', on ? 'bg-accent-soft' : 'hover:bg-panel-2')}
                  >
                    <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                      Scene {String(scene.order).padStart(2, '0')} · {ROLE_LABEL[scene.role]} · <span className="tabular-nums">{tc(start)}–{tc(end)}</span>
                    </span>
                    <span className="max-w-xl font-display text-[clamp(1.375rem,2.8vw,2rem)] leading-[1.6]">{scene.text}</span>
                  </button>
                  {on && (
                    <div className="appear flex flex-col items-center gap-3 bg-accent-soft px-6 pb-9 text-center">
                      <Label className="text-muted">원작의 한 대목</Label>
                      {sources.length > 0 ? (
                        sources.map((b) => (
                          <p key={b.id} className="m-0 max-w-xl border-x border-accent/50 px-5 text-[16px] italic leading-[1.8] text-muted">
                            {b.text}
                          </p>
                        ))
                      ) : (
                        <p className="m-0 text-[15px] text-muted">따로 근거로 삼은 대목이 없습니다.</p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-bg to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg to-transparent" />
        </div>
        <p className="m-0 text-[14px] text-muted">장면을 누르면 원작의 대목이 펼쳐집니다.</p>
      </section>

      <div className="flex flex-col items-center gap-6 border-t border-edge pt-12">
        <VLink to={`/projects/${project.id}/scenes`} className={btn.primary}>
          편집실로
          <ArrowRight aria-hidden="true" className="size-4" />
        </VLink>

        {v.confirming && (
          <div role="group" aria-labelledby="regen-confirm" className="appear flex max-w-xl flex-col items-center gap-5 border border-danger-line bg-danger-soft p-6 text-center">
            <p id="regen-confirm" className="m-0 text-[17px] leading-[1.8]">
              대본과 장면을 처음부터 다시 씁니다. 고친 문구·사진·움직임{v.edited ? '과 만들어 둔 영상' : ''}이 사라집니다. 계속할까요?
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              <button type="button" data-act="regenerate-confirm" className={btn.primary} disabled={v.regeneratePending} onClick={v.regenerate}>
                {v.regeneratePending ? '요청 중' : '다시 쓰기'}
              </button>
              <button type="button" data-act="regenerate-cancel" className={btn.link} disabled={v.regeneratePending} onClick={() => v.setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        )}
        {v.regenerateError && <Notice>{v.regenerateError}</Notice>}
        <button type="button" data-act="regenerate" className={btn.link} disabled={v.confirming} onClick={() => v.setConfirming(true)}>
          <RotateCcw aria-hidden="true" className="size-4" />
          대본 다시 만들기
        </button>
      </div>
    </main>
  )
}
