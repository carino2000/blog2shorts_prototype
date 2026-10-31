import { ChevronLeft, ChevronRight, Clapperboard, ImageOff, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useId, type KeyboardEvent } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { countChars, formatSec, sceneSec } from '../../lib/duration'
import { MOTIONS } from '../../lib/motion'
import { MOTION_QUALITIES } from '../../lib/motionQuality'
import { ROLE_LABEL } from '../../lib/roles'
import { sceneSubtitle } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn, field, monitorClass, tc } from './styles'
import { Alert, Eyebrow, Mono, RangeBar, RoleTag } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" wide>
      {(project) => <Room project={project} />}
    </Shell>
  )
}

function Room({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const sel = ed.selected
  const textId = useId()

  const clips = withTimes(ed.scenes)
  const selClip = clips.find((c) => c.scene.id === sel?.id)

  function onTimelineKey(e: KeyboardEvent<HTMLOListElement>) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    if (e.key === 'ArrowLeft') ed.prev()
    else ed.next()
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-clip][aria-current="true"]')?.focus())
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="flex flex-col gap-2">
          <Eyebrow step={3}>편집실</Eyebrow>
          <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.01em]">장면 편집</h1>
        </div>
        <div className="flex items-center gap-5">
          <Saved state={ed.saveState} onRetry={ed.retrySave} />
          <div className="hidden lg:block">
            <RenderControls ed={ed} variant="top" />
          </div>
        </div>
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 이미지가 없습니다.">
          장면에 쓸 이미지를 올려 주세요. 오른쪽 패널의 업로드 칸에서 올릴 수 있습니다.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-label="미리보기" className="flex flex-col items-center gap-4 rounded-card border border-edge bg-panel px-4 py-5 sm:py-7">
          {sel && selClip && (
            <>
              <div className="flex w-full max-w-[520px] items-center justify-between text-xs tabular-nums text-muted" aria-live="polite">
                <span>
                  장면 <span className="font-semibold text-ink">#{sel.order}</span> / {ed.scenes.length} · {ROLE_LABEL[sel.role]}
                </span>
                <Mono>
                  {tc(selClip.start)} – {tc(selClip.end)}
                </Mono>
              </div>
              <div className={cx('overflow-hidden bg-black p-1.5', monitorClass())} style={{ width: 'calc(clamp(250px, 56dvh, 600px) * 0.5625)' }}>
                <Stage className="rounded-[3px]">
                  <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
                </Stage>
              </div>
              <div className="flex gap-2">
                <button type="button" data-act="prev" className={cx(btn.ghost, 'px-3')} onClick={ed.prev} disabled={sel.order <= 1}>
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  이전
                </button>
                <button type="button" data-act="next" className={cx(btn.ghost, 'px-3')} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                  다음
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </>
          )}
        </section>

        {sel && (
          <section aria-labelledby="insp-title" className="flex flex-col gap-5 rounded-card border border-edge bg-panel p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h2 id="insp-title" className="m-0 text-[17px] font-semibold">
                장면 #{sel.order}
              </h2>
              <RoleTag role={sel.role} />
              {ed.voiceRedo.has(sel.id) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-ink">
                  <Mic aria-hidden="true" className="size-3" />
                  음성 다시 만듦
                </span>
              )}
              <Mono className="ml-auto text-xs text-muted">{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</Mono>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={textId} className="text-[13px] font-medium text-muted">
                자막·음성 문구
              </label>
              <textarea id={textId} data-scene-text data-selected="true" rows={5} value={sel.text} onChange={(e) => ed.setText(sel.id, e.target.value)} className={cx(field, 'resize-y py-3 leading-relaxed')} />
              <p className="m-0 font-mono text-xs tabular-nums text-muted">{countChars(sel.text)}자</p>
            </div>

            <MotionPick value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="m-0 text-[13px] font-medium text-muted">이미지</p>
                {!sel.assetId && <span className="text-xs font-medium text-danger-ink">이미지를 골라 주세요</span>}
              </div>
              <ul className="m-0 grid list-none grid-cols-4 gap-1.5 p-0 sm:grid-cols-6 lg:grid-cols-4">
                {ed.assets.map((asset) => {
                  const current = asset.id === sel.assetId
                  const others = ed.scenes.filter((s) => s.assetId === asset.id && s.id !== sel.id).map((s) => s.order)
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        data-asset
                        aria-pressed={current}
                        aria-label={`${asset.origin === 'blog' ? '블로그' : '업로드'} 이미지 ${asset.width}×${asset.height}${others.length ? `, 장면 ${others.join(', ')}에서 사용 중` : ''}`}
                        onClick={() => ed.pickAsset(asset.id)}
                        className={cx(
                          'relative block aspect-square w-full overflow-hidden rounded-[4px] border-2 bg-bg transition-colors',
                          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                          current ? 'border-accent' : 'border-transparent hover:border-[#3a4150]',
                        )}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {asset.origin === 'upload' && <span className="absolute left-0.5 top-0.5 rounded-[3px] bg-black/70 px-1 text-[9px] font-medium text-white">올림</span>}
                        {others.length > 0 && (
                          <Mono className="absolute bottom-0.5 right-0.5 rounded-[3px] bg-black/75 px-1 text-[10px] text-white">{others.map((o) => `#${o}`).join(' ')}</Mono>
                        )}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label
                    className={cx(
                      'flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[4px] border-2 border-dashed text-[11px] transition-colors',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                      upload.error ? 'border-danger text-danger-ink' : 'border-edge text-muted hover:border-accent hover:text-ink',
                    )}
                  >
                    {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                    {upload.pending ? '올리는 중' : '업로드'}
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
              <p className={cx('m-0 text-xs leading-relaxed', upload.error ? 'text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                {upload.error ?? 'jpg·png·webp, 10MB 이하. 올린 이미지는 이 장면에 바로 들어갑니다.'}
              </p>
            </div>
          </section>
        )}
      </div>

      <section aria-labelledby="tl-title" className="flex flex-col gap-3 rounded-card border border-edge bg-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2 id="tl-title" className="m-0 text-[15px] font-semibold">
            타임라인
          </h2>
          <RangeBar seconds={ed.totalSeconds} actual={ed.allActual} className="w-full sm:w-96" />
        </div>
        <div className="night-ticks h-2" aria-hidden="true" />
        <ol onKeyDown={onTimelineKey} className="m-0 flex list-none gap-1.5 overflow-x-auto p-0 pb-2">
          {clips.map(({ scene, start }) => {
            const on = scene.id === sel?.id
            const src = ed.srcOf(scene.assetId)
            const missing = !scene.assetId
            return (
              <li key={scene.id} className="flex" style={{ flex: `${Math.max(1, sceneSec(scene))} 1 11.5rem`, minWidth: '11.5rem' }}>
                <button
                  type="button"
                  data-clip
                  data-scene-select
                  aria-current={on ? 'true' : undefined}
                  aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}, ${tc(start)}부터${missing ? ', 이미지 없음' : ''}`}
                  onClick={() => ed.select(scene.id)}
                  className={cx(
                    'relative flex min-h-[108px] w-full gap-3 overflow-hidden rounded-[8px] border p-2 pt-3 text-left transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    on ? 'border-accent bg-accent-soft' : missing ? 'border-danger-line bg-panel-2' : 'border-edge bg-panel-2 hover:border-[#3a4150]',
                  )}
                >
                  <span aria-hidden="true" className={cx('absolute inset-x-0 top-0 h-1', { hook: 'bg-hook', body: 'bg-body', cta: 'bg-cta' }[scene.role])} />
                  {on && <span aria-hidden="true" className="absolute left-3 top-1 h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-accent" />}
                  <span
                    className={cx(
                      'grid aspect-[9/16] w-11 shrink-0 place-items-center self-start overflow-hidden rounded-[3px] border bg-bg',
                      missing ? 'border-dashed border-danger text-danger-ink' : 'border-edge',
                    )}
                  >
                    {src ? <img src={src} alt="" className="size-full object-cover" /> : <ImageOff aria-hidden="true" className="size-4" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2 font-mono text-[11px] tabular-nums text-muted">
                      <span className={cx('font-semibold', on ? 'text-accent' : 'text-ink')}>#{scene.order}</span>
                      {tc(start)}
                      {ed.voiceRedo.has(scene.id) && <Mic aria-hidden="true" className="size-3 text-accent" />}
                    </span>
                    <span className="line-clamp-3 text-[12.5px] leading-snug text-ink/90">{scene.text}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-edge bg-bg/95 backdrop-blur lg:hidden">
        <div className="sw-inset mx-auto flex max-w-[1480px] flex-col gap-2 px-5 py-3">
          <RenderControls ed={ed} variant="bottom" />
        </div>
      </div>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-xs" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && (
        <>
          <span aria-hidden="true" className="night-blink size-2 rounded-full bg-accent" />
          <span className="text-muted">저장 중</span>
        </>
      )}
      {state === 'saved' && (
        <>
          <span aria-hidden="true" className="size-2 rounded-full bg-cta" />
          <span className="text-muted">저장됨</span>
        </>
      )}
      {state === 'error' && (
        <>
          <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 text-xs font-medium text-accent underline focus-visible:outline-2 focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionPick({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-[13px] font-medium text-muted">카메라 움직임</legend>
      <div className="flex flex-wrap gap-1.5">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 cursor-pointer items-center rounded-control border px-3 text-[13px] transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent-soft font-semibold text-ink' : 'border-edge text-muted hover:text-ink',
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

/** 움직임 품질 + 영상 만들기. 넓은 화면은 위쪽 바, 좁은 화면은 아래 고정 바에 둔다 */
function RenderControls({ ed, variant }: { ed: Editor; variant: 'top' | 'bottom' }) {
  const name = useId()
  const hint =
    ed.missingCount > 0
      ? `이미지가 없는 장면 ${ed.missingCount}개 · 모든 장면에 이미지를 넣어야 합니다.`
      : ed.voiceRedo.size > 0
        ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만듭니다.`
        : ed.everRendered
          ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.'
          : `장면 ${ed.scenes.length}개에 음성·자막을 입혀 MP4를 만듭니다.`
  const bottom = variant === 'bottom'

  return (
    <div className={cx('flex gap-1.5', bottom ? 'flex-col' : 'flex-col items-end')}>
      <div className="flex items-center gap-2">
        <div role="radiogroup" aria-label="움직임 품질" aria-describedby={`${ed.qualityHintId}-${variant}`} className="flex shrink-0 gap-0.5 rounded-control bg-panel-2 p-0.5">
          {MOTION_QUALITIES.map((q) => (
            <label
              key={q.value}
              className={cx(
                'flex min-h-11 cursor-pointer items-center rounded-[5px] px-3 text-[13px] whitespace-nowrap transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent',
                ed.motionQuality === q.value ? 'bg-bg font-semibold text-ink ring-1 ring-edge' : 'text-muted hover:text-ink',
                ed.renderPending && 'cursor-not-allowed opacity-50',
              )}
            >
              <input type="radio" name={`${name}-${variant}`} value={q.value} checked={ed.motionQuality === q.value} disabled={ed.renderPending} onChange={() => ed.changeQuality(q.value)} className="sr-only" />
              {q.label}
            </label>
          ))}
        </div>
        <button type="button" data-act="render" className={cx(btn.primary, 'min-h-11 flex-1 sm:flex-none lg:px-5')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
          <Clapperboard aria-hidden="true" className="size-4" />
          {ed.renderPending ? '시작하는 중…' : '영상 만들기'}
        </button>
      </div>
      <p className={cx('m-0 text-xs leading-snug', ed.missingCount > 0 ? 'text-danger-ink' : 'text-muted')} aria-live="polite">
        {bottom || ed.missingCount > 0 ? hint : ed.qualityDescription}
      </p>
      <p id={`${ed.qualityHintId}-${variant}`} className="sr-only">
        {ed.qualityDescription}
      </p>
    </div>
  )
}
