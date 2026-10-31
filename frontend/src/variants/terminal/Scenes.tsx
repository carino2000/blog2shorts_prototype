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
import { Alert, Block, Out, Role, Screen, Total } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Edit project={project} />}
    </Shell>
  )
}

function Edit({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-[clamp(1.25rem,3vw,1.75rem)] font-bold">장면 편집</h1>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          장면마다 쓸 사진을 ‘assets’에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Block cmd="ls scenes/" label="장면 목록">
            <Out>
              <ol className="m-0 list-none overflow-hidden rounded-card border border-edge p-0">
                {rows.map(({ scene, start }) => {
                  const on = scene.id === sel?.id
                  return (
                    <li key={scene.id} className="border-b border-line last:border-b-0">
                      <button
                        type="button"
                        data-scene-select
                        aria-current={on ? 'true' : undefined}
                        aria-label={`장면 ${scene.order}, ${ROLE_LABEL[scene.role]}${scene.assetId ? '' : ', 사진 없음'}`}
                        onClick={() => ed.select(scene.id)}
                        className={cx('grid min-h-11 w-full grid-cols-[1.75rem_3rem_3.25rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-1.5 text-left text-[13px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent', on ? 'bg-accent-soft' : 'hover:bg-panel-2')}
                      >
                        <b className={cx('tabular-nums', on ? 'text-accent' : 'text-muted')}>{String(scene.order).padStart(2, '0')}</b>
                        <span className="tabular-nums text-muted">{tc(start)}</span>
                        <Role role={scene.role} />
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-ink">{scene.text}</span>
                          {!scene.assetId && <b className="shrink-0 text-[11px] text-danger-ink">no-img</b>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </Out>
          </Block>

          {sel && selRow && (
            <Block cmd={`b2s edit ${String(sel.order).padStart(2, '0')}`} label={`장면 ${sel.order} 편집`}>
              <Out className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="tm-text" className="text-[13px] font-bold text-hi">
                    text&gt;
                  </label>
                  <textarea
                    id="tm-text"
                    data-scene-text
                    data-selected="true"
                    rows={4}
                    value={sel.text}
                    onChange={(e) => ed.setText(sel.id, e.target.value)}
                    className="w-full resize-y rounded-control border border-edge bg-bg px-3 py-2 text-[14px] leading-[1.7] text-ink placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] tabular-nums">
                    <span>{countChars(sel.text)} chars</span>
                    <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `~${formatSec(sceneSec(sel))}`}</span>
                    {ed.voiceRedo.has(sel.id) && (
                      <span className="inline-flex items-center gap-1 font-bold text-hook">
                        <Mic aria-hidden="true" className="size-3.5" />
                        음성 다시 만듦
                      </span>
                    )}
                  </p>
                </div>

                <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

                <div className="flex flex-col gap-2">
                  <p className="m-0 text-[13px] font-bold text-hi">assets/</p>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {ed.assets.map((asset, i) => {
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
                            className={cx('relative block h-[4.5rem] w-14 overflow-hidden rounded-small border-2 bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-edge opacity-80 hover:opacity-100')}
                          >
                            <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                            <span className="absolute left-0 top-0 bg-bg px-1 text-[11px] text-ink">{i + 1}</span>
                            {others.length > 0 && <span className="absolute bottom-0 right-0 bg-bg px-1 text-[11px] font-bold tabular-nums text-hook">{others.join('·')}</span>}
                          </button>
                        </li>
                      )
                    })}
                    <li>
                      <label className="flex h-[4.5rem] min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-small border-2 border-dashed border-edge px-2 text-center text-[11px] font-bold text-muted hover:border-accent hover:text-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
                        {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                        {upload.pending ? 'uploading' : 'upload'}
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
                    {upload.error ?? '# jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용됩니다.'}
                  </p>
                </div>
              </Out>
            </Block>
          )}

          <Block cmd="b2s render --quality ?" label="영상 만들기">
            <Out className="flex flex-col gap-4">
              <Total seconds={ed.totalSeconds} actual={ed.allActual} />
              <p className="m-0 text-[13px] leading-[1.65]" aria-live="polite">
                {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있습니다. 모두 채워야 영상을 만들 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 장면만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 장면에 음성과 자막을 입혀 MP4로 만듭니다.`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Quality ed={ed} />
                <button type="button" data-act="render" className={cx(btn.primary, 'min-h-12 px-6')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
                  {ed.renderPending ? 'running…' : '실행 (영상 만들기)'}
                </button>
              </div>
            </Out>
          </Block>
        </div>

        {sel && selRow && (
          <aside aria-label="미리보기" className="mx-auto flex w-full max-w-[15rem] flex-col gap-2 lg:sticky lg:top-20 lg:mx-0">
            <p className="m-0 text-[12px] text-muted">$ b2s preview {String(sel.order).padStart(2, '0')}</p>
            <Screen>
              <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
            </Screen>
            <div className="flex items-center justify-between gap-2">
              <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={sel.order <= 1}>
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <span className="text-[12px] tabular-nums text-muted">
                {sel.order}/{ed.scenes.length} · {tc(selRow.start)}-{tc(selRow.end)}
              </span>
              <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

const btnIcon = 'grid size-11 place-items-center rounded-control border border-edge text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[13px]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="font-bold text-accent">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="font-bold text-danger-ink">저장 실패</span>
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
      <legend className="mb-2 p-0 text-[13px] font-bold text-hi">--motion</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-control border px-3 text-[13px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent-soft text-accent' : 'border-edge text-muted hover:text-ink',
            )}
          >
            <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
            <span aria-hidden="true">{value === m.value ? '(•)' : '( )'}</span>
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex flex-wrap gap-2">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-4 text-[13px] font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            ed.motionQuality === q.value ? 'border-hi bg-hi text-on-hi' : 'border-edge text-muted hover:text-ink',
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
