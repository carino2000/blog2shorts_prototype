import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Mic, Radio, Upload } from 'lucide-react'
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
import { Alert, Duration, Monitor, Mono, Role, Tally } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Switcher project={project} />}
    </Shell>
  )
}

const panelHead = 'flex items-center justify-between gap-3 border-b border-edge bg-panel-2 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted'

function Switcher({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)
  const next = sel ? ed.scenes.find((s) => s.order === sel.order + 1) : undefined

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="flex flex-col gap-1">
          <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Switcher</Mono>
          <h1 className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-none tracking-[0.02em]">장면 편집</h1>
        </div>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          장면마다 쓸 사진을 소스 빈에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        {/* 모니터 열 */}
        {sel && selRow && (
          <section aria-label={`장면 ${sel.order} 모니터`} className="flex flex-row items-start gap-4 lg:flex-col">
            <Monitor
              className="w-full max-w-[13rem] flex-1 lg:max-w-none"
              tag={
                <>
                  <Tally tone="pvw">PVW · {String(sel.order).padStart(2, '0')}</Tally>
                  <Mono className="text-[11px] text-muted">
                    {tc(selRow.start)}–{tc(selRow.end)}
                  </Mono>
                </>
              }
              info={`${ROLE_LABEL[sel.role]} · ${ed.scenes.length}컷 중 ${sel.order}번`}
            >
              <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
            </Monitor>
            <Monitor
              className="w-[6.5rem] shrink-0 lg:w-24"
              tag={<Tally tone="idle">NEXT</Tally>}
              info={next ? `${String(next.order).padStart(2, '0')} ${ROLE_LABEL[next.role]}` : '마지막 컷'}
            >
              {next ? <SceneFrame src={ed.srcOf(next.assetId)} subtitle="" /> : <div aria-hidden="true" className="bc-bars-low absolute inset-0" />}
            </Monitor>
          </section>
        )}

        {/* 큐 시트 + 편집 */}
        <div className="flex min-w-0 flex-col gap-5">
          <section aria-label="장면 목록" className="overflow-hidden rounded-card border border-edge bg-panel">
            <div className={panelHead}>
              <span>Cue list</span>
              <div className="flex items-center gap-1">
                <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
                <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              </div>
            </div>
            <ol className="m-0 list-none p-0">
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
                      className={cx('grid min-h-12 w-full grid-cols-[2rem_4.25rem_3.5rem_1fr] items-center gap-x-3 px-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-hi', on ? 'bg-panel-2 shadow-[inset_4px_0_0_var(--hi)]' : 'hover:bg-panel-2/60')}
                    >
                      <Mono className={cx('text-[14px] font-semibold', on ? 'text-hi' : 'text-muted')}>{String(scene.order).padStart(2, '0')}</Mono>
                      <Mono className="text-[12px] text-muted">{tc(start)}</Mono>
                      <Role role={scene.role} />
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[14px]">{scene.text}</span>
                        {!scene.assetId && <span className="shrink-0 font-mono text-[11px] font-semibold text-danger-ink">NO IMG</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>

          {sel && (
            <section aria-label={`장면 ${sel.order} 편집`} className="overflow-hidden rounded-card border border-edge bg-panel">
              <div className={panelHead}>
                <span>Cue {String(sel.order).padStart(2, '0')} · 문구</span>
                <span className="flex items-center gap-3 normal-case tracking-normal">
                  <span>{countChars(sel.text)}자</span>
                  <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                </span>
              </div>
              <div className="flex flex-col gap-3 p-4">
                <label htmlFor="bc-text" className="sr-only">
                  장면 {sel.order} 문구
                </label>
                <textarea
                  id="bc-text"
                  data-scene-text
                  data-selected="true"
                  rows={4}
                  value={sel.text}
                  onChange={(e) => ed.setText(sel.id, e.target.value)}
                  className="w-full resize-y rounded-control border border-edge bg-bg px-3 py-2 text-[16px] leading-[1.7] text-ink placeholder:text-placeholder focus:border-hi focus:outline-none focus:ring-1 focus:ring-hi"
                />
                <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px]">
                  {ed.voiceRedo.has(sel.id) && (
                    <span className="inline-flex items-center gap-1 text-hook">
                      <Mic aria-hidden="true" className="size-3.5" />
                      음성 다시 만듦
                    </span>
                  )}
                  {!sel.assetId && <span className="font-semibold text-danger-ink">사진 없음 · 아래 소스 빈에서 고르세요</span>}
                </p>
                <Transitions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />
              </div>
            </section>
          )}
        </div>

        {/* 소스 빈 + 송출 */}
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-2 xl:col-span-1">
          <section aria-label="소스 빈" className="overflow-hidden rounded-card border border-edge bg-panel">
            <div className={panelHead}>
              <span>Source bin</span>
              <span className="normal-case tracking-normal">{ed.assets.length}장</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2 p-0">
                {ed.assets.map((asset) => {
                  const current = asset.id === sel?.assetId
                  const others = ed.scenes.filter((s) => s.assetId === asset.id && s.id !== sel?.id).map((s) => s.order)
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        data-asset
                        aria-pressed={current}
                        aria-label={`${asset.origin === 'blog' ? '블로그' : '업로드'} 이미지 ${asset.width}×${asset.height}${others.length ? `, 장면 ${others.join(', ')}에서 사용 중` : ''}`}
                        onClick={() => ed.pickAsset(asset.id)}
                        className={cx('relative block aspect-[3/4] w-full overflow-hidden rounded-[3px] border-2 bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi', current ? 'border-hi' : 'border-edge opacity-80 hover:opacity-100')}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {others.length > 0 && <span className="absolute bottom-0 right-0 bg-black px-1 font-mono text-[11px] text-hook">{others.join('·')}</span>}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label className="flex aspect-[3/4] min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[3px] border-2 border-dashed border-edge text-center font-mono text-[11px] font-semibold uppercase text-muted hover:border-hi hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hi">
                    {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                    {upload.pending ? 'Uploading' : 'Upload'}
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
              <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-semibold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 선택한 컷에 바로 적용됩니다.'}
              </p>
            </div>
          </section>

          <section aria-label="영상 송출" className="flex flex-col gap-4 rounded-card border-2 border-accent bg-panel p-4">
            <div className="flex items-center gap-2">
              <Radio aria-hidden="true" className="size-4 text-accent-bright" />
              <Mono className="text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-bright">Program out</Mono>
            </div>
            <Duration seconds={ed.totalSeconds} actual={ed.allActual} />
            <p className="m-0 text-[14px] leading-[1.65] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 컷이 {ed.missingCount}개 있습니다. 모두 채워야 송출할 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 컷만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 컷은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 컷에 음성과 자막을 입혀 MP4로 만듭니다.`}
            </p>
            <Quality ed={ed} />
            <button type="button" data-act="render" className={btn.take} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              <span className="flex flex-col items-center gap-0.5"><span>{ed.renderPending ? 'Starting' : 'Take'}</span><span className="font-sans text-[12px] font-semibold normal-case tracking-normal">{ed.renderPending ? '시작하는 중' : '영상 만들기'}</span></span>
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

const btnIcon = 'grid size-11 place-items-center rounded-control border border-edge text-ink hover:border-muted disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-hi">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-hi">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function Transitions({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Camera move</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control border px-3 text-[14px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hi',
              value === m.value ? 'border-hook bg-hook text-black' : 'border-edge bg-panel-2 text-ink hover:border-muted',
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
            'flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-3 text-[14px] font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hi',
            ed.motionQuality === q.value ? 'border-hi bg-hi text-on-hi' : 'border-edge bg-panel-2 text-ink hover:border-muted',
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
