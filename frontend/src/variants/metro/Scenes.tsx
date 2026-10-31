import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
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
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Fare, RoleChip, Screen, Sign } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Platform project={project} />}
    </Shell>
  )
}

function Platform({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 font-display text-[clamp(2rem,4.6vw,3rem)] font-normal leading-[1.15]">장면 역 편집</h1>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          역마다 쓸 사진을 ‘사진’에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <nav aria-label="장면 노선도" className="flex items-start gap-2">
        <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <ol className="relative m-0 flex min-w-0 flex-1 list-none justify-between p-0">
          <i aria-hidden="true" className="absolute inset-x-5 top-[1.375rem] h-3 -translate-y-1/2 bg-accent" />
          {rows.map(({ scene, start }) => {
            const on = scene.id === sel?.id
            return (
              <li key={scene.id} className="relative flex flex-col items-center gap-1">
                <button
                  type="button"
                  data-scene-select
                  aria-current={on ? 'true' : undefined}
                  aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                  onClick={() => ed.select(scene.id)}
                  className={cx('relative grid size-11 place-items-center rounded-full border-[5px] font-display text-[18px] leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-ink bg-accent text-white' : 'border-accent bg-white text-accent hover:bg-accent-soft')}
                >
                  {scene.order}
                  {!scene.assetId && <i aria-hidden="true" className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-white bg-danger" />}
                </button>
                <span className="text-[12px] font-bold tabular-nums text-muted">{tc(start)}</span>
              </li>
            )
          })}
        </ol>
        <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </nav>

      {sel && selRow && (
        <div className="grid items-start gap-x-10 gap-y-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <section aria-label={`장면 ${sel.order} 미리보기`} className="mx-auto w-full max-w-[15rem] lg:mx-0">
            <Screen>
              <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
            </Screen>
          </section>

          <section aria-label={`장면 ${sel.order} 역 정보`} className="flex min-w-0 flex-col gap-6">
            <p className="m-0 flex flex-wrap items-center gap-3">
              <RoleChip role={sel.role} />
              <b className="text-[15px] tabular-nums">
                {sel.order}번 역 · {tc(selRow.start)} 출발 → {tc(selRow.end)} 도착
              </b>
            </p>

            <div className="flex flex-col gap-2">
              <label htmlFor="mt-text" className="text-[15px] font-extrabold">
                문구 (자막)
              </label>
              <textarea
                id="mt-text"
                data-scene-text
                data-selected="true"
                rows={4}
                value={sel.text}
                onChange={(e) => ed.setText(sel.id, e.target.value)}
                className="w-full resize-y rounded-control border-2 border-ink bg-white px-4 py-3 text-[17px] leading-[1.7] text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-2 focus:outline-accent"
              />
              <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] tabular-nums text-muted">
                <span>{countChars(sel.text)}자</span>
                <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                {ed.voiceRedo.has(sel.id) && (
                  <span className="inline-flex items-center gap-1 font-extrabold text-hook">
                    <Mic aria-hidden="true" className="size-3.5" />
                    음성 다시 만듦
                  </span>
                )}
              </p>
            </div>

            <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

            <div className="flex flex-col gap-2">
              <p className="m-0 text-[15px] font-extrabold">사진</p>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
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
                        className={cx('relative block h-[4.75rem] w-16 overflow-hidden rounded-small border-[4px] bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-line opacity-85 hover:opacity-100')}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {others.length > 0 && <span className="absolute bottom-0 right-0 bg-white px-1 text-[11px] font-extrabold tabular-nums text-ink">{others.join('·')}</span>}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label className="flex h-[4.75rem] min-w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-small border-[3px] border-dashed border-ink px-2 text-center text-[12px] font-extrabold hover:bg-panel has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
              <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-extrabold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                {!sel.assetId && !upload.error && <b className="mr-2 text-danger-ink">사진 없음</b>}
                {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 역에 바로 적용됩니다.'}
              </p>
            </div>
          </section>
        </div>
      )}

      <Sign className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[13px] font-bold text-white/80">종착역 안내 · 영상 만들기</p>
          <div className="rounded-card bg-white p-4 text-ink">
            <Fare seconds={ed.totalSeconds} actual={ed.allActual} />
          </div>
          <p className="m-0 text-[14px] leading-[1.65] text-white/95" aria-live="polite">
            {ed.missingCount > 0 ? <b className="rounded bg-white px-2 py-0.5 text-danger-ink">사진이 없는 역이 {ed.missingCount}개 있습니다. 모두 채워야 출발할 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 역만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 역은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 역에 음성과 자막을 입혀 MP4로 만듭니다.`}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Quality ed={ed} />
          <button type="button" data-act="render" className={cx(btn.primary, '!bg-[#f6b100] !text-black hover:!bg-[#ffc933] disabled:!bg-white/20 disabled:!text-white/70')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
            {ed.renderPending ? '출발하는 중' : '영상 만들기 출발'}
          </button>
        </div>
      </Sign>
    </div>
  )
}

const btnIcon = 'mt-0.5 grid size-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-white text-ink hover:bg-panel disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[14px] font-extrabold" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-cta">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">
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
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-[15px] font-extrabold">카메라 움직임 (환승)</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-[3px] px-4 text-[14px] font-extrabold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-ink bg-accent text-white' : 'border-accent text-accent hover:bg-accent-soft',
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="grid grid-cols-2 gap-2">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center justify-center rounded-full border-[3px] px-4 text-[14px] font-extrabold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white',
            ed.motionQuality === q.value ? 'border-white bg-white text-[#0d2240]' : 'border-white/60 text-white hover:bg-white/10',
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
