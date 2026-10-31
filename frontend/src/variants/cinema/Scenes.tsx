import { ChevronLeft, ChevronRight, Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useId } from 'react'
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
import { Label, Notice, Runtime } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Studio project={project} />}
    </Shell>
  )
}

function Studio({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-14 px-5 pb-6 pt-10 sm:px-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div className="flex flex-col gap-3">
          <Label>Editing suite</Label>
          <h1 className="m-0 font-display text-[clamp(2rem,4.6vw,3.5rem)] font-bold leading-tight">편집실</h1>
        </div>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Notice tone="note" icon={ImagePlus} title="이 글에는 사진이 없습니다.">
          컷마다 쓸 사진을 올려 주세요. ‘필름 캔’의 업로드로 올릴 수 있습니다.
        </Notice>
      )}
      {ed.saveError && <Notice title="저장하지 못했습니다">{ed.saveError}</Notice>}
      {ed.renderError && <Notice>{ed.renderError}</Notice>}

      {sel && selRow && (
        <section aria-label={`장면 ${sel.order}`} className="flex flex-col items-center gap-10">
          <div className="w-full">
            <div className="flex items-center justify-between border-y border-accent/50 bg-black px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-muted" aria-live="polite">
              <span>
                Scene {String(sel.order).padStart(2, '0')} / {String(ed.scenes.length).padStart(2, '0')} · {ROLE_LABEL[sel.role]}
              </span>
              <span className="tabular-nums">
                {tc(selRow.start)} – {tc(selRow.end)}
              </span>
            </div>
            <div className="flex h-[min(64dvh,34rem)] items-stretch justify-center bg-black py-3">
              <div className="aspect-[9/16] h-full shadow-[0_0_80px_-20px_rgba(232,200,114,0.35)]">
                <Stage className="h-full">
                  <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
                </Stage>
              </div>
            </div>
            <div aria-hidden="true" className="h-px bg-accent/50" />
          </div>

          <div className="flex w-full max-w-3xl flex-col items-center gap-4 text-center">
            <label htmlFor="cin-text" className={LabelClass}>
              대사
            </label>
            <textarea
              id="cin-text"
              data-scene-text
              data-selected="true"
              rows={4}
              value={sel.text}
              onChange={(e) => ed.setText(sel.id, e.target.value)}
              className="w-full resize-y border-0 border-b border-accent/50 bg-transparent px-2 py-2 text-center font-display text-[clamp(1.375rem,2.8vw,2rem)] leading-[1.7] text-ink placeholder:text-placeholder focus:border-b-2 focus:border-accent focus:outline-none"
            />
            <p className="m-0 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[14px] tabular-nums text-muted">
              <span>{countChars(sel.text)}자</span>
              <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
              {ed.voiceRedo.has(sel.id) && (
                <span className="inline-flex items-center gap-1 text-accent">
                  <Mic aria-hidden="true" className="size-3.5" />
                  녹음 다시
                </span>
              )}
              {!sel.assetId && <span className="font-semibold text-danger-ink">사진 없음</span>}
            </p>
          </div>

          <div className="grid w-full max-w-4xl gap-x-16 gap-y-10 sm:grid-cols-2">
            <Takes value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />
            <div className="flex flex-col gap-3">
              <p className={LabelClass}>필름 캔(사진)</p>
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
                        className={cx('relative block size-16 overflow-hidden border bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent shadow-[0_0_0_2px_var(--accent)]' : 'border-edge opacity-75 hover:opacity-100')}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {others.length > 0 && <span className="absolute bottom-0 right-0 bg-black px-1 text-[11px] tabular-nums text-accent">{others.join('·')}</span>}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label className="flex size-16 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-accent/60 text-center font-sans text-[10px] font-semibold uppercase tracking-wider text-accent hover:bg-accent/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
              <p className={cx('m-0 text-[14px] leading-snug', upload.error ? 'font-semibold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 컷에 바로 걸립니다.'}
              </p>
            </div>
          </div>
        </section>
      )}

      <section aria-label="필름 스트립" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label>Film strip</Label>
          <div className="flex items-center gap-1">
            <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
        <ol className="cin-film m-0 flex list-none gap-2 overflow-x-auto px-3 pb-6 pt-6 [scrollbar-width:thin]">
          {rows.map(({ scene, start }) => {
            const on = scene.id === sel?.id
            const src = ed.srcOf(scene.assetId)
            return (
              <li key={scene.id} className="shrink-0">
                <button
                  type="button"
                  data-scene-select
                  aria-current={on ? 'true' : undefined}
                  aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                  onClick={() => ed.select(scene.id)}
                  className={cx('relative block w-24 overflow-hidden border-2 bg-black transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-28', on ? 'border-accent' : 'border-transparent opacity-55 hover:opacity-90')}
                >
                  <span className="grid aspect-[9/16] place-items-center overflow-hidden bg-panel-2 text-[11px] text-muted">{src ? <img src={src} alt="" className="size-full object-cover" /> : '사진 없음'}</span>
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-1.5 py-0.5 font-sans text-[10px] font-semibold tabular-nums text-accent">
                    <span>{String(scene.order).padStart(2, '0')}</span>
                    <span>{tc(start)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-label="영상 만들기" className="mx-auto flex w-full max-w-3xl flex-col items-center gap-7 border-t border-edge pt-12 text-center">
        <Runtime seconds={ed.totalSeconds} actual={ed.allActual} />
        <p className="m-0 max-w-lg text-[16px] leading-[1.8] text-muted" aria-live="polite">
          {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 컷이 {ed.missingCount}개 있습니다. 모두 채워야 상영할 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `대사를 고친 컷 ${ed.voiceRedo.size}개만 음성을 다시 녹음합니다.` : ed.everRendered ? '고치지 않은 컷은 만들어 둔 음성을 그대로 씁니다.' : `컷 ${ed.scenes.length}개에 음성과 자막을 입혀 MP4로 만듭니다.`}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Quality ed={ed} />
          <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
            <Clapperboard aria-hidden="true" className="size-4" />
            {ed.renderPending ? '시작하는 중' : '시사회 시작'}
          </button>
        </div>
      </section>
    </main>
  )
}

const LabelClass = 'font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-accent'
const btnIcon = 'grid size-11 place-items-center border border-accent/50 text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 font-sans text-[12px] uppercase tracking-[0.18em]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-accent">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function Takes({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className={cx('mb-3 p-0', LabelClass)}>카메라 테이크</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center border px-4 font-display text-[16px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent text-on-accent' : 'border-edge text-muted hover:border-accent/70 hover:text-ink',
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-12 cursor-pointer items-center border border-accent/60 px-5 font-display text-[17px] whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            i > 0 && '-ml-px',
            ed.motionQuality === q.value ? 'bg-accent text-on-accent' : 'text-accent hover:bg-accent/10',
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
