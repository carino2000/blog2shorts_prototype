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
import { Alert, Cell, Frame, FormHead, RoleMark, Total } from './ui'

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

  return (
    <>
      <FormHead title="영상 콘티 (장면 편집)" no="B2S-04">
        <Cell label="컷 수">{ed.scenes.length}컷</Cell>
        <Cell label="저장">
          <Saved state={ed.saveState} onRetry={ed.retrySave} />
        </Cell>
        <Cell label="총 길이">
          <Total seconds={ed.totalSeconds} actual={ed.allActual} />
        </Cell>
      </FormHead>

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {ed.uploadNotice && (
          <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
            컷마다 쓸 사진을 ‘그림’ 칸에서 올려 주세요.
          </Alert>
        )}
        {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
        {ed.renderError && <Alert>{ed.renderError}</Alert>}

        <section aria-label="컷 선택">
          <ol className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map(({ scene, start }) => {
              const on = scene.id === sel?.id
              return (
                <li key={scene.id} className={cx('flex flex-col border-2', on ? 'border-accent bg-accent-soft' : 'border-ink bg-surface')}>
                  <button
                    type="button"
                    data-scene-select
                    aria-current={on ? 'true' : undefined}
                    aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                    onClick={() => ed.select(scene.id)}
                    className="flex min-h-11 flex-1 flex-col gap-2 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span className="flex items-center justify-between gap-1">
                      <b className="text-[14px] tabular-nums">CUT {String(scene.order).padStart(2, '0')}</b>
                      <RoleMark role={scene.role} />
                    </span>
                    <Frame>
                      <SceneFrame key={on ? `${scene.id}-${scene.motion}-${scene.assetId}` : scene.id} src={ed.srcOf(scene.assetId)} subtitle={on ? sceneSubtitle(scene) : ''} motion={scene.motion} animate={on} />
                    </Frame>
                    <span className="text-[11px] tabular-nums text-muted">{tc(start)}</span>
                    <span className="line-clamp-3 text-[13px] leading-[1.55]">{scene.text}</span>
                    {!scene.assetId && <b className="text-[12px] text-danger-ink">사진 없음</b>}
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        {sel && selRow && (
          <section aria-label={`CUT ${sel.order} 작성란`} className="border-2 border-ink">
            <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-panel-2 px-4 py-2">
              <h2 className="m-0 text-[15px] font-extrabold">
                CUT {String(sel.order).padStart(2, '0')} 작성란{' '}
                <span className="whitespace-nowrap text-[12px] font-bold text-muted">
                  {tc(selRow.start)}–{tc(selRow.end)}
                </span>
              </h2>
              <span className="flex items-center">
                <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={sel.order <= 1}>
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </span>
            </div>

            <div className="grid gap-px bg-line md:grid-cols-2 [&>*]:bg-surface">
              <div className="flex flex-col gap-2 p-4 md:col-span-2">
                <label htmlFor="sb-text" className="text-[13px] font-extrabold">
                  대사 (자막)
                </label>
                <textarea
                  id="sb-text"
                  data-scene-text
                  data-selected="true"
                  rows={4}
                  value={sel.text}
                  onChange={(e) => ed.setText(sel.id, e.target.value)}
                  className="sb-lines sb-pencil w-full resize-y border border-ink bg-surface px-3 py-0 text-[24px] focus:outline-2 focus:outline-offset-1 focus:outline-accent"
                />
                <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] tabular-nums text-muted">
                  <span>{countChars(sel.text)}자</span>
                  <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                  {ed.voiceRedo.has(sel.id) && (
                    <span className="inline-flex items-center gap-1 font-bold text-hook">
                      <Mic aria-hidden="true" className="size-3.5" />
                      음성 다시 만듦
                    </span>
                  )}
                </p>
              </div>

              <div className="p-4">
                <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />
              </div>

              <div className="flex flex-col gap-2 p-4">
                <p className="m-0 text-[13px] font-extrabold">그림</p>
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
                          className={cx('relative block h-[4.5rem] w-14 overflow-hidden border-2 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-ink/50 hover:border-ink')}
                        >
                          <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                          {others.length > 0 && <span className="absolute bottom-0 right-0 bg-surface px-1 text-[11px] font-bold tabular-nums">{others.join('·')}</span>}
                        </button>
                      </li>
                    )
                  })}
                  <li>
                    <label className="flex h-[4.5rem] min-w-14 cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-ink px-2 text-center text-[11px] font-bold hover:bg-panel-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
                  {!sel.assetId && !upload.error && <b className="mr-2 text-danger-ink">사진 없음</b>}
                  {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 컷에 바로 적용됩니다.'}
                </p>
              </div>
            </div>
          </section>
        )}

        <section aria-label="영상 만들기" className="flex flex-col gap-4 border-t-2 border-ink pt-5">
          <p className="m-0 text-[14px] leading-[1.65] text-muted" aria-live="polite">
            {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 컷이 {ed.missingCount}개 있습니다. 모두 채워야 영상을 만들 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `대사를 고친 ${ed.voiceRedo.size}개 컷만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 컷은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 컷에 음성과 자막을 입혀 MP4로 만듭니다.`}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Quality ed={ed} />
            <button type="button" data-act="render" className={cx(btn.primary, 'min-h-12 px-6')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              {ed.renderPending ? '시작하는 중' : '콘티 확정 · 영상 만들기'}
            </button>
          </div>
        </section>
      </div>
    </>
  )
}

const btnIcon = 'grid size-11 place-items-center text-ink hover:bg-surface disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <span className="flex min-h-6 flex-wrap items-center gap-2 text-[14px]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-cta">저장됨</span>}
      {state === 'idle' && <span className="text-muted">변경 없음</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </span>
  )
}

function Motions({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-[13px] font-extrabold">카메라</legend>
      <div className="flex flex-col">
        {MOTIONS.map((m) => (
          <label key={m.value} className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
            <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
            <span aria-hidden="true" className="grid size-6 place-items-center border-2 border-ink bg-surface">
              {value === m.value && <span className="sb-pencil text-[26px] leading-none">✓</span>}
            </span>
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-12 cursor-pointer items-center border-2 border-ink px-5 text-[14px] font-bold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            i > 0 && '-ml-0.5',
            ed.motionQuality === q.value ? 'bg-ink text-white' : 'bg-surface hover:bg-panel-2',
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
