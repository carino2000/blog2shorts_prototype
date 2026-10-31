import { ChevronDown, ChevronUp, Eye, ImagePlus, Loader2, Mic, Pencil, Upload } from 'lucide-react'
import { useId, useState } from 'react'
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
import { Alert, Bars, Length, Pane, RoleLabel } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Editing project={project} />}
    </Shell>
  )
}

function Editing({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)
  const [preview, setPreview] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          장면마다 쓸 사진을 아래 ‘사진’에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start justify-center gap-x-8 gap-y-6 lg:grid-cols-[calc((100dvh-7.5rem)*9/16)_20rem]">
        {sel && selRow && (
          <Pane label={`장면 ${sel.order} 편집`} className="lg:mx-0">
            <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={preview ? sceneSubtitle(sel) : ''} motion={sel.motion} animate />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 bg-gradient-to-b from-black/70 to-transparent p-4 pb-8">
              <Bars states={ed.scenes.map((s) => (s.order < sel.order ? 'done' : s.id === sel.id ? 'active' : 'pending'))} />
              <div className="flex items-center gap-2">
                <RoleLabel role={sel.role} />
                <span className="text-[12px] tabular-nums text-white">
                  {sel.order}/{ed.scenes.length} · {tc(selRow.start)}–{tc(selRow.end)}
                </span>
              </div>
            </div>

            <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2">
              <button type="button" data-act="prev" aria-label="이전 장면" className={arrow} onClick={ed.prev} disabled={sel.order <= 1}>
                <ChevronUp aria-hidden="true" className="size-5" />
              </button>
              <button type="button" data-act="next" aria-label="다음 장면" className={arrow} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                <ChevronDown aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-10">
              {!preview && (
                <>
                  <label htmlFor="st-text" className="sr-only">
                    장면 {sel.order} 문구
                  </label>
                  <textarea
                    id="st-text"
                    data-scene-text
                    data-selected="true"
                    rows={3}
                    value={sel.text}
                    onChange={(e) => ed.setText(sel.id, e.target.value)}
                    className="w-full resize-none rounded-2xl border border-white/40 bg-black/70 px-3 py-2 text-[15px] font-bold leading-[1.5] text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <p className="m-0 flex flex-wrap items-center gap-x-3 text-[12px] tabular-nums text-white/90">
                    <span>{countChars(sel.text)}자</span>
                    <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                    {ed.voiceRedo.has(sel.id) && (
                      <span className="inline-flex items-center gap-1 font-bold text-hook">
                        <Mic aria-hidden="true" className="size-3.5" />
                        음성 다시 만듦
                      </span>
                    )}
                    {!sel.assetId && <b className="text-danger-ink">사진 없음</b>}
                  </p>
                </>
              )}
              <button type="button" aria-pressed={preview} onClick={() => setPreview((p) => !p)} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-white/15 px-4 text-[13px] font-bold text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                {preview ? <Pencil aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                {preview ? '문구 고치기' : '자막 미리보기'}
              </button>
            </div>
          </Pane>
        )}

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="m-0 text-[24px] font-black">장면 편집</h1>
            <Saved state={ed.saveState} onRetry={ed.retrySave} />
          </div>

          <nav aria-label="장면 선택">
            <ol className="m-0 flex list-none flex-wrap gap-2 p-0">
              {rows.map(({ scene }) => {
                const on = scene.id === sel?.id
                const src = ed.srcOf(scene.assetId)
                return (
                  <li key={scene.id}>
                    <button
                      type="button"
                      data-scene-select
                      aria-current={on ? 'true' : undefined}
                      aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                      onClick={() => ed.select(scene.id)}
                      className={cx('relative block h-[4.5rem] w-11 overflow-hidden rounded-xl border-2 bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}
                    >
                      {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="text-[10px] text-muted">없음</span>}
                      <span className="absolute inset-x-0 bottom-0 bg-black/75 text-center text-[11px] font-bold tabular-nums">{scene.order}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>

          {sel && (
            <>
              <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

              <div className="flex flex-col gap-2">
                <p className="m-0 text-[14px] font-bold">사진</p>
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
                          className={cx('relative block h-[4.5rem] w-14 overflow-hidden rounded-xl border-2 bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-transparent opacity-75 hover:opacity-100')}
                        >
                          <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                          {others.length > 0 && <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[11px] font-bold tabular-nums text-hook">{others.join('·')}</span>}
                        </button>
                      </li>
                    )
                  })}
                  <li>
                    <label className="flex h-[4.5rem] min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/40 px-2 text-center text-[11px] font-bold text-white hover:bg-white/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
                <p className={cx('m-0 text-[12px] leading-snug', upload.error ? 'font-bold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                  {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용됩니다.'}
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 border-t border-white/15 pt-5">
            <Length seconds={ed.totalSeconds} actual={ed.allActual} />
            <p className="m-0 text-[13px] leading-[1.65] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있습니다. 모두 채워야 영상을 만들 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 장면만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 장면에 음성과 자막을 입혀 MP4로 만듭니다.`}
            </p>
            <Quality ed={ed} />
            <button type="button" data-act="render" className={cx(btn.primary, 'w-full')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              {ed.renderPending ? '시작하는 중' : '영상 만들기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const arrow = 'grid size-11 place-items-center rounded-full bg-black/70 text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[13px] font-bold" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-accent">저장됨</span>}
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
      <legend className="mb-2 p-0 text-[14px] font-bold">카메라 움직임</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border px-4 text-[13px] font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent text-on-accent' : 'border-white/30 text-white hover:bg-white/10',
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
            'flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-4 text-[13px] font-bold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            ed.motionQuality === q.value ? 'border-white bg-white text-black' : 'border-white/30 text-white hover:bg-white/10',
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
