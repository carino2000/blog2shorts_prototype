import { ChevronDown, Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useId } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { countChars, formatSec, sceneSec } from '../../lib/duration'
import { MOTIONS } from '../../lib/motion'
import { MOTION_QUALITIES } from '../../lib/motionQuality'
import { sceneSubtitle } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn, field } from './styles'
import { Alert, Dot, Hl, Ruler, Shout, Tag } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" wide>
      {(project) => <Layout project={project} />}
    </Shell>
  )
}

function Layout({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const sel = ed.selected

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <Shout>
          장면을 <Hl>갈아 끼워라!</Hl>
        </Shout>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글엔 사진이 없다!">
          장면에 쓸 사진을 올려라. 펼친 장면의 ‘내 사진 올리기’로 올린다.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장 실패">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="장면 목록" className="flex min-w-0 flex-col gap-8">
          <div className="max-w-xl">
            <Ruler seconds={ed.totalSeconds} actual={ed.allActual} />
          </div>

          <ol className="m-0 flex list-none flex-col gap-6 p-0">
            {ed.scenes.map((scene) => {
              const on = scene.id === sel?.id
              const missing = !scene.assetId
              return (
                <li key={scene.id} className={cx('border-[3px] border-ink shadow-[7px_7px_0_#0a0a0a] transition-colors', on ? 'bg-surface' : 'bg-panel-2')}>
                  <button
                    type="button"
                    data-scene-select
                    aria-expanded={on}
                    onClick={() => ed.select(scene.id)}
                    className={cx('flex min-h-16 w-full items-center gap-3 p-4 text-left sm:gap-4 focus-visible:outline-[4px] focus-visible:outline-offset-4 focus-visible:outline-ink', on && 'bg-hi')}
                  >
                    <Dot n={scene.order} on={on} />
                    <Tag role={scene.role} />
                    <span className="min-w-0 flex-1 font-sans text-[16px] font-bold leading-snug">{on ? '편집 중' : scene.text}</span>
                    {missing && <span className="shrink-0 border-[3px] border-ink bg-danger-soft px-2 py-0.5 font-display text-[15px] leading-tight text-danger-ink">사진 없음</span>}
                    <ChevronDown aria-hidden="true" className={cx('size-6 shrink-0 transition-transform', on && 'rotate-180')} />
                  </button>

                  {on && (
                    <div className="appear flex flex-col gap-8 border-t-[3px] border-ink p-5 sm:p-7">
                      <div className="flex flex-col gap-3">
                        <label htmlFor="zine-text" className="font-display text-[24px] leading-none">
                          장면 {scene.order} 문구
                        </label>
                        <textarea id="zine-text" data-scene-text data-selected="true" rows={4} value={scene.text} onChange={(e) => ed.setText(scene.id, e.target.value)} className={cx(field, 'resize-y py-3 text-[19px] leading-[1.6]')} />
                        <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-[16px] font-bold tabular-nums">
                          <span>{countChars(scene.text)}자</span>
                          <span>{scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}</span>
                          {ed.voiceRedo.has(scene.id) && (
                            <span className="inline-flex items-center gap-1.5 border-[3px] border-ink bg-hi px-2 py-0.5 font-display text-[16px] font-normal leading-tight">
                              <Mic aria-hidden="true" className="size-4" />
                              음성 다시!
                            </span>
                          )}
                        </p>
                      </div>

                      <MotionToggles value={scene.motion} onChange={(m) => ed.setMotion(scene.id, m)} />

                      <div className="flex flex-col gap-3">
                        <p className="m-0 font-display text-[24px] leading-none">사진</p>
                        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
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
                                  className={cx(
                                    'relative block size-20 overflow-hidden border-[3px] border-ink bg-surface focus-visible:outline-[4px] focus-visible:outline-offset-4 focus-visible:outline-ink',
                                    current ? 'shadow-[5px_5px_0_var(--accent)]' : 'opacity-85 hover:opacity-100',
                                  )}
                                >
                                  <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                                  {current && <span className="absolute left-0 top-0 bg-accent px-1.5 font-display text-[14px] leading-tight">쓰는 중</span>}
                                  {others.length > 0 && <span className="absolute bottom-0 right-0 bg-ink px-1.5 font-display text-[13px] leading-tight text-bg">{others.join('·')}</span>}
                                </button>
                              </li>
                            )
                          })}
                          <li>
                            <label
                              className={cx(
                                'flex size-20 cursor-pointer flex-col items-center justify-center gap-1 border-[3px] border-dashed border-ink text-center font-display text-[15px] leading-tight hover:bg-hi',
                                'has-[:focus-visible]:outline-[4px] has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink',
                              )}
                            >
                              {upload.pending ? <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-5" />}
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
                        <p className={cx('m-0 text-[16px] font-bold leading-snug', upload.error ? 'text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                          {upload.error ? `▲ ${upload.error}` : missing ? '▲ 이 장면에 사진이 없다! 하나 골라라.' : 'jpg·png·webp, 10MB까지. 올리면 이 장면에 바로 붙는다.'}
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          <section aria-label="영상 만들기" className="flex flex-col gap-5 border-[3px] border-ink bg-hi p-6 shadow-[8px_8px_0_#0a0a0a] sm:p-8">
            <p className="m-0 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-tight">다 됐으면 뽑아라!</p>
            <p className="m-0 text-[17px] font-bold leading-[1.6]" aria-live="polite">
              {ed.missingCount > 0 ? `▲ 사진 없는 장면이 ${ed.missingCount}개다. 모두 채워야 뽑는다.` : ed.voiceRedo.size > 0 ? `문구 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만든다.` : ed.everRendered ? '안 고친 장면은 만들어 둔 음성을 그대로 쓴다.' : `장면 ${ed.scenes.length}개에 음성과 자막을 입혀 MP4로 뽑는다.`}
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <QualityToggles ed={ed} />
              <button type="button" data-act="render" className={cx(btn.primary, 'min-h-14 text-[26px]')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
                <Clapperboard aria-hidden="true" className="size-6" />
                {ed.renderPending ? '시작하는 중' : '영상 뽑기!'}
              </button>
            </div>
          </section>
        </section>

        <aside aria-label="미리보기" className="mx-auto w-full max-w-[280px] lg:sticky lg:top-6 lg:max-w-none">
          {sel && (
            <>
              <div className="border-[3px] border-ink bg-ink shadow-[9px_9px_0_var(--accent)]">
                <Stage>
                  <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
                </Stage>
              </div>
              <p className="m-0 mt-6 font-display text-[22px] leading-none">
                <Hl>
                  장면 {sel.order} / {ed.scenes.length}
                </Hl>
              </p>
              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" data-act="prev" className={cx(btn.ghost, 'px-4 text-[20px]')} onClick={ed.prev} disabled={sel.order <= 1}>
                  ← 앞
                </button>
                <button type="button" data-act="next" className={cx(btn.ghost, 'px-4 text-[20px]')} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                  뒤 →
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-3 font-display text-[22px] leading-none" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중…</span>}
      {state === 'saved' && <span className="bg-hi px-2">저장됨!</span>}
      {state === 'error' && (
        <>
          <span className="bg-danger-soft px-2 text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-[4px] focus-visible:outline-ink">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionToggles({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-3 p-0 font-display text-[24px] leading-none">카메라</legend>
      <div className="flex flex-wrap gap-3">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-12 min-w-12 cursor-pointer items-center justify-center border-[3px] border-ink px-4 font-display text-[20px] leading-none transition-[transform,box-shadow]',
              'has-[:focus-visible]:outline-[4px] has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink',
              value === m.value ? 'bg-accent shadow-[4px_4px_0_#0a0a0a]' : 'bg-surface hover:bg-hi',
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

function QualityToggles({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 gap-3">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-14 cursor-pointer items-center border-[3px] border-ink px-5 font-display text-[22px] leading-none whitespace-nowrap has-[:focus-visible]:outline-[4px] has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink',
            ed.motionQuality === q.value ? 'bg-ink text-bg shadow-[4px_4px_0_var(--accent)]' : 'bg-surface hover:bg-panel-2',
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
