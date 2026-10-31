import { Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { countChars, formatSec, sceneSec } from '../../lib/duration'
import { MOTIONS } from '../../lib/motion'
import { MOTION_QUALITIES } from '../../lib/motionQuality'
import { sceneSubtitle } from '../../lib/render'
import { ROLE_LABEL } from '../../lib/roles'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn } from './styles'
import { Huge, Notice, Span, Wall } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Rooms project={project} />}
    </Shell>
  )
}

function Rooms({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const rooms = useRef(new Map<string, HTMLElement>())
  const n = ed.scenes.length

  // 스크롤로 방이 바뀌면 그 장면이 선택된다
  useEffect(() => {
    const seen = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set((e.target as HTMLElement).dataset.room ?? '', e.intersectionRatio)
        const best = [...seen].sort((a, b) => b[1] - a[1])[0]
        if (best && best[1] > 0.55) ed.select(best[0])
      },
      { threshold: [0.25, 0.55, 0.8] },
    )
    for (const el of rooms.current.values()) io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  function go(delta: -1 | 1) {
    if (!sel) return
    const target = ed.scenes[sel.order - 1 + delta]
    if (!target) return
    ed.select(target.id)
    rooms.current.get(target.id)?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }

  return (
    <div>
      <div className="sticky top-14 z-10 bg-bg/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1500px] items-center justify-between gap-6 px-5 sm:px-10">
          <p className="m-0 flex items-baseline gap-3 text-[13px] tabular-nums" aria-live="polite">
            <span className="text-[20px] font-extralight tracking-[-0.03em]">{sel ? String(sel.order).padStart(2, '0') : '--'}</span>
            <span className="text-muted">/ {String(n).padStart(2, '0')}</span>
          </p>
          <div className="flex items-center gap-4">
            <Saved state={ed.saveState} onRetry={ed.retrySave} />
            <button type="button" data-act="prev" className={btn.quiet} onClick={() => go(-1)} disabled={!sel || sel.order <= 1}>
              ← 이전
            </button>
            <button type="button" data-act="next" className={btn.quiet} onClick={() => go(1)} disabled={!sel || sel.order >= n}>
              다음 →
            </button>
          </div>
        </div>
        <div aria-hidden="true" className="h-px bg-line" />
      </div>

      <main className="gallery-rooms mx-auto max-w-[1500px] px-5 pb-32 sm:px-10">
        {(ed.uploadNotice || ed.saveError || ed.renderError) && (
          <div className="flex flex-col gap-4 pt-8">
            {ed.uploadNotice && (
              <Notice tone="note" title="이 글에는 이미지가 없습니다.">
                <ImagePlus aria-hidden="true" className="mr-2 inline size-4" />
                장면마다 ‘사진’에서 이미지를 올려 주세요.
              </Notice>
            )}
            {ed.saveError && <Notice title="저장하지 못했습니다">{ed.saveError}</Notice>}
            {ed.renderError && <Notice>{ed.renderError}</Notice>}
          </div>
        )}

        {rows.map(({ scene, start, end }) => {
          const on = scene.id === sel?.id
          const missing = !scene.assetId
          return (
            <section
              key={scene.id}
              ref={(el) => {
                if (el) rooms.current.set(scene.id, el)
                else rooms.current.delete(scene.id)
              }}
              data-room={scene.id}
              data-scene-select
              aria-current={on ? 'true' : undefined}
              aria-label={`장면 ${scene.order}`}
              onClick={() => ed.select(scene.id)}
              onFocusCapture={() => ed.select(scene.id)}
              className="gallery-room grid min-h-[calc(100dvh-6.5rem)] items-center gap-x-20 gap-y-10 border-b border-line py-12 lg:grid-cols-[minmax(0,min(24rem,calc((100dvh-12rem)*0.5625)))_minmax(0,1fr)]"
            >
              <div className={cx('mx-auto w-full max-w-[22rem] transition-opacity duration-300 lg:mx-0', on ? 'opacity-100' : 'opacity-50')}>
                <Stage>
                  <SceneFrame key={`${scene.id}-${scene.motion}-${scene.assetId}-${on}`} src={ed.srcOf(scene.assetId)} subtitle={sceneSubtitle(scene)} motion={scene.motion} animate={on} />
                </Stage>
              </div>

              <div className="flex min-w-0 flex-col gap-10">
                <Wall className="text-muted">
                  {String(scene.order).padStart(2, '0')} · {ROLE_LABEL[scene.role]} · <span className="tabular-nums">{tc(start)}–{tc(end)}</span>
                </Wall>
                <div className="flex flex-col gap-3">
                  <label className="sr-only" htmlFor={`${scene.id}-text`}>
                    장면 {scene.order} 문구
                  </label>
                  <textarea
                    id={`${scene.id}-text`}
                    data-scene-text
                    data-selected={on ? 'true' : undefined}
                    rows={4}
                    value={scene.text}
                    onChange={(e) => ed.setText(scene.id, e.target.value)}
                    className="w-full resize-y border-0 border-b border-transparent bg-transparent px-0 py-1 text-[clamp(1.5rem,3.2vw,2.75rem)] font-extralight leading-[1.35] tracking-[-0.035em] text-ink placeholder:text-placeholder hover:border-line focus:border-ink focus:outline-none"
                  />
                  <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] tabular-nums text-muted">
                    <span>{countChars(scene.text)}자</span>
                    <span>{scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}</span>
                    {ed.voiceRedo.has(scene.id) && (
                      <span className="inline-flex items-center gap-1 text-ink">
                        <Mic aria-hidden="true" className="size-3.5" />
                        음성 다시 만듦
                      </span>
                    )}
                    {missing && <span className="font-semibold text-ink">△ 사진 없음</span>}
                  </p>
                </div>

                {on && (
                  <div className="appear flex flex-col gap-9">
                    <Motions value={scene.motion} onChange={(m) => ed.setMotion(scene.id, m)} />
                    <div className="flex flex-col gap-3">
                      <Wall>사진</Wall>
                      <ul className="m-0 flex list-none flex-wrap items-end gap-3 p-0">
                        {ed.assets.map((asset) => {
                          const current = asset.id === scene.assetId
                          const others = ed.scenes.filter((s) => s.assetId === asset.id && s.id !== scene.id).map((s) => s.order)
                          return (
                            <li key={asset.id}>
                              <button
                                type="button"
                                data-asset
                                aria-pressed={current}
                                aria-label={`${asset.origin === 'blog' ? '블로그' : '업로드'} 이미지 ${asset.width}×${asset.height}${others.length ? `, 장면 ${others.join(', ')}에서 사용 중` : ''}`}
                                onClick={() => ed.pickAsset(asset.id)}
                                className={cx('relative block size-16 overflow-hidden bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:size-20', current ? 'outline outline-2 outline-offset-4 outline-ink' : 'hover:opacity-100')}
                              >
                                <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className={cx('size-full object-cover transition-[filter]', current ? '' : 'opacity-80 grayscale hover:grayscale-0')} />
                                {others.length > 0 && <span className="absolute bottom-0 right-0 bg-bg px-1 text-[11px] tabular-nums text-ink">{others.join('·')}</span>}
                              </button>
                            </li>
                          )
                        })}
                        <li>
                          <label className="flex min-h-11 cursor-pointer items-center gap-2 px-1 text-[14px] text-muted underline underline-offset-[6px] hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink">
                            {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                            {upload.pending ? '올리는 중' : '내 사진 올리기'}
                            <input
                              type="file"
                              data-upload
                              accept={upload.accept}
                              className="sr-only"
                              disabled={upload.pending}
                              onChange={(e) => {
                                upload.pickFile(e.target.files?.[0])
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </li>
                      </ul>
                      <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-semibold text-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                        {upload.error ? `△ ${upload.error}` : 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 놓입니다.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )
        })}

        <section aria-label="영상 만들기" className="gallery-room flex min-h-[calc(100dvh-6.5rem)] flex-col justify-center gap-12 py-16">
          <Huge>만들까요?</Huge>
          <Span seconds={ed.totalSeconds} actual={ed.allActual} />
          <p className="m-0 max-w-lg text-[17px] font-light leading-[1.8] text-muted" aria-live="polite">
            {ed.missingCount > 0 ? `△ 사진이 없는 장면이 ${ed.missingCount}개 있습니다. 모두 채워야 만들 수 있습니다.` : ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `장면 ${n}개에 음성과 자막을 입혀 MP4로 만듭니다.`}
          </p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <Quality ed={ed} />
            <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              <Clapperboard aria-hidden="true" className="size-4" />
              {ed.renderPending ? '시작하는 중' : '영상 만들기'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[13px]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-muted">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="font-semibold">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ink">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function Motions({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0">
        <Wall>카메라</Wall>
      </legend>
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-3 text-[15px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
              value === m.value ? 'font-semibold text-ink underline decoration-1 underline-offset-[8px]' : 'text-muted hover:text-ink',
            )}
          >
            <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
            {m.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Quality({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 gap-2">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center px-3 text-[15px] whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
            ed.motionQuality === q.value ? 'font-semibold text-ink underline decoration-1 underline-offset-[8px]' : 'text-muted hover:text-ink',
            ed.renderPending && 'cursor-not-allowed opacity-50',
          )}
        >
          <input type="radio" name={name} value={q.value} checked={ed.motionQuality === q.value} disabled={ed.renderPending} onChange={() => ed.changeQuality(q.value)} className="sr-only" />
          {q.label}
        </label>
      ))}
      <span id={ed.qualityHintId} className="sr-only">
        {ed.qualityDescription}
      </span>
    </div>
  )
}
