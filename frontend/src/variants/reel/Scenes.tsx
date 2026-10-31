import { ArrowLeft, ArrowRight, Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
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
import { Stage } from '../shared/Stage'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { TONE, btn } from './styles'
import { Alert, Giant, Label } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" tone="black" wide>
      {(project) => <Reel project={project} />}
    </Shell>
  )
}

function Reel({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const sel = ed.selected
  const cards = useRef(new Map<string, HTMLElement>())

  // 고른 카드가 가운데로 오게 넘긴다
  useEffect(() => {
    const el = cards.current.get(ed.selectedId)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
  }, [ed.selectedId])

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <Giant className="text-[clamp(3rem,9vw,7rem)]">넘기며 고치기.</Giant>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다.">
          장면에 쓸 사진을 올려 주세요. 아래 편집 칸의 업로드로 올릴 수 있습니다.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <section aria-label="장면 카드" className="-mx-5">
        <ol className="m-0 flex list-none snap-x snap-mandatory items-center gap-5 overflow-x-auto px-[max(1.25rem,calc(50%-9.5rem))] py-6 sm:gap-8">
          {ed.scenes.map((scene) => {
            const on = scene.id === sel?.id
            const src = ed.srcOf(scene.assetId)
            return (
              <li key={scene.id} className="shrink-0 snap-center">
                <button
                  ref={(el) => {
                    if (el) cards.current.set(scene.id, el)
                    else cards.current.delete(scene.id)
                  }}
                  type="button"
                  data-scene-select
                  aria-current={on ? 'true' : undefined}
                  aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                  onClick={() => ed.select(scene.id)}
                  className={cx(
                    'relative block w-[min(64vw,19rem)] origin-center border-[6px] bg-ink transition-[transform,opacity] duration-200 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-ink',
                    on ? 'border-accent shadow-[10px_10px_0_var(--accent)]' : 'scale-[0.86] border-ink opacity-60 hover:opacity-90',
                  )}
                >
                  <Stage>
                    <SceneFrame key={`${scene.id}-${scene.motion}-${scene.assetId}-${on}`} src={src} subtitle={sceneSubtitle(scene)} motion={scene.motion} animate={on} />
                    <span aria-hidden="true" className="absolute left-3 top-2 font-display text-[44px] leading-none text-white [text-shadow:0_2px_0_rgba(0,0,0,0.7)]">
                      {String(scene.order).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true" className={cx('absolute right-3 top-3 px-2 py-1 font-display text-[14px] leading-none text-on-accent', { hook: 'bg-hook', body: 'bg-body', cta: 'bg-cta' }[scene.role])}>
                      {ROLE_LABEL[scene.role]}
                    </span>
                  </Stage>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="flex items-center justify-center gap-4 px-5">
          <button type="button" data-act="prev" aria-label="이전 장면" className={cx(btn.ghost, 'size-16 px-0')} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
            <ArrowLeft aria-hidden="true" className="size-7" />
          </button>
          <p className="m-0 min-w-24 text-center font-display text-[28px] leading-none tabular-nums" aria-live="polite">
            {sel ? String(sel.order).padStart(2, '0') : '--'} / {String(ed.scenes.length).padStart(2, '0')}
          </p>
          <button type="button" data-act="next" aria-label="다음 장면" className={cx(btn.ghost, 'size-16 px-0')} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
            <ArrowRight aria-hidden="true" className="size-7" />
          </button>
        </div>
      </section>

      {sel && (
        <section aria-label={`장면 ${sel.order} 편집`} data-tone={TONE[sel.role]} className="grid gap-x-12 gap-y-10 bg-bg p-6 text-ink sm:p-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <label htmlFor="reel-text" className="font-display text-[26px] leading-none">
              장면 {sel.order} · {ROLE_LABEL[sel.role]}
            </label>
            <textarea
              id="reel-text"
              data-scene-text
              data-selected="true"
              rows={5}
              value={sel.text}
              onChange={(e) => ed.setText(sel.id, e.target.value)}
              className="w-full resize-y border-0 border-b-[5px] border-ink bg-transparent px-0 py-2 text-[clamp(1.375rem,2.6vw,2rem)] font-bold leading-[1.45] text-ink placeholder:text-placeholder focus:border-b-[10px] focus:outline-none"
            />
            <p className="m-0 flex flex-wrap items-center gap-x-5 gap-y-1 text-[17px] font-semibold tabular-nums">
              <span>{countChars(sel.text)}자</span>
              <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
              {ed.voiceRedo.has(sel.id) && (
                <span className="inline-flex items-center gap-1.5 bg-ink px-2 py-0.5 text-bg">
                  <Mic aria-hidden="true" className="size-4" />
                  음성 다시 만듦
                </span>
              )}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-8">
            <MotionChips value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

            <div className="flex flex-col gap-3">
              <Label>사진</Label>
              <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
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
                        className={cx('relative block size-[4.5rem] overflow-hidden border-[4px] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink', current ? 'border-ink' : 'border-transparent opacity-80 hover:opacity-100')}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {others.length > 0 && <span className="absolute bottom-0 right-0 bg-ink px-1 font-display text-[12px] leading-tight text-bg">{others.join('·')}</span>}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label
                    className={cx(
                      'flex size-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 border-[3px] border-dashed border-ink text-center font-display text-[13px] leading-tight hover:bg-ink hover:text-bg',
                      'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                    )}
                  >
                    {upload.pending ? <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-5" />}
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
              <p className={cx('m-0 text-[16px] font-semibold leading-snug', !upload.error && 'opacity-80')} role={upload.error ? 'alert' : undefined}>
                {upload.error ? `▲ ${upload.error}` : sel.assetId ? 'jpg·png·webp, 10MB 이하. 올린 사진은 이 장면에 바로 들어갑니다.' : '▲ 이 장면에 사진이 없습니다. 하나 고르거나 올려 주세요.'}
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-label="영상 만들기" data-tone="lime" className="flex flex-col gap-6 bg-bg p-6 text-ink sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="flex flex-col gap-2">
            <p className="m-0 font-display text-[clamp(2rem,6vw,4.5rem)] leading-[0.95]">다 됐으면, 뽑자.</p>
            <p className="m-0 max-w-lg text-[18px] font-semibold leading-snug" aria-live="polite">
              {ed.missingCount > 0 ? `▲ 사진이 없는 장면 ${ed.missingCount}개 · 모두 채워야 합니다.` : ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `장면 ${ed.scenes.length}개 · 약 ${formatSec(ed.totalSeconds)} · 음성과 자막을 입혀 MP4로 뽑습니다.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <QualityToggle ed={ed} />
            <button type="button" data-act="render" className={cx(btn.primary, 'min-h-16 px-10 text-[28px]')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              <Clapperboard aria-hidden="true" className="size-6" />
              {ed.renderPending ? '시작하는 중' : '영상 만들기'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-3 font-display text-[20px] leading-none" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중…</span>}
      {state === 'saved' && <span className="text-accent">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-[3px] focus-visible:outline-ink">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionChips({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-3 p-0 font-display text-[18px] leading-none tracking-wide">카메라</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-12 cursor-pointer items-center px-4 font-display text-[19px] leading-none',
              'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
              value === m.value ? 'bg-ink text-bg' : 'border-[3px] border-ink hover:bg-panel-2',
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

function QualityToggle({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 border-[3px] border-ink">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-14 cursor-pointer items-center px-5 font-display text-[20px] leading-none whitespace-nowrap has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
            i > 0 && 'border-l-[3px] border-ink',
            ed.motionQuality === q.value ? 'bg-ink text-bg' : 'hover:bg-panel-2',
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
