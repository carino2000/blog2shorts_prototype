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
import { Alert, Dimensioned, Mono, Ruler, Tag } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" title="조립도 · 장면 편집">
      {(project) => <Assembly project={project} />}
    </Shell>
  )
}

const row = 'grid grid-cols-1 gap-x-6 gap-y-2 border-b border-line px-4 py-4 sm:grid-cols-[7rem_minmax(0,1fr)]'

function Assembly({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div className="flex flex-col gap-3">
          <Tag>조립도 · 도면 번호 B2S-004</Tag>
          <h1 className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">장면 편집</h1>
        </div>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </header>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          장면마다 쓸 사진을 ‘사진’ 항목에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <nav aria-label="장면 선택" className="flex items-center gap-2">
        <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <ol className="relative m-0 flex min-w-0 flex-1 list-none justify-between gap-1 p-0">
          <i aria-hidden="true" className="bp-dash absolute inset-x-5 top-[1.375rem] border-t" />
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
                  className={cx('relative grid size-11 place-items-center rounded-full border-2 font-mono text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-accent bg-accent text-on-accent' : 'border-edge bg-bg text-ink hover:border-ink')}
                >
                  {scene.order}
                  {!scene.assetId && <i aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-bg bg-danger" />}
                </button>
                <Mono className="text-[11px] text-muted">{tc(start)}</Mono>
              </li>
            )
          })}
        </ol>
        <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </nav>

      {sel && selRow && (
        <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <section aria-label={`장면 ${sel.order} 미리보기`} className="mx-auto w-full max-w-[16rem] lg:mx-0">
            <Tag className="mb-3 block">
              상세 {sel.order} · {ROLE_LABEL[sel.role]} · {tc(selRow.start)}–{tc(selRow.end)}
            </Tag>
            <Dimensioned>
              <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
            </Dimensioned>
          </section>

          <section aria-label={`장면 ${sel.order} 사양표`} className="min-w-0 border border-edge">
            <div className={row}>
              <Tag className="pt-2">
                <label htmlFor="bp-text">문구</label>
              </Tag>
              <div className="flex flex-col gap-2">
                <textarea
                  id="bp-text"
                  data-scene-text
                  data-selected="true"
                  rows={4}
                  value={sel.text}
                  onChange={(e) => ed.setText(sel.id, e.target.value)}
                  className="w-full resize-y border border-edge bg-bg px-3 py-2 text-[16px] leading-[1.7] text-ink placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-muted">
                  <span>{countChars(sel.text)}자</span>
                  <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                  {ed.voiceRedo.has(sel.id) && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Mic aria-hidden="true" className="size-3.5" />
                      음성 다시 만듦
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className={row}>
              <Tag className="pt-2">움직임</Tag>
              <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />
            </div>

            <div className={cx(row, 'border-b-0')}>
              <Tag className="pt-2">사진</Tag>
              <div className="flex flex-col gap-3">
                <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2 p-0">
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
                          className={cx('relative block aspect-[3/4] w-full overflow-hidden border-2 bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-edge opacity-80 hover:opacity-100')}
                        >
                          <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                          <span className="absolute left-0 top-0 bg-bg px-1 font-mono text-[11px] text-ink">{i + 1}</span>
                          {others.length > 0 && <span className="absolute bottom-0 right-0 bg-bg px-1 font-mono text-[11px] text-accent">{others.join('·')}</span>}
                        </button>
                      </li>
                    )
                  })}
                  <li>
                    <label className="bp-dash flex aspect-[3/4] min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-1 border-2 text-center font-mono text-[11px] font-semibold uppercase text-muted hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
                <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-semibold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                  {!sel.assetId && !upload.error && <b className="mr-2 text-danger-ink">사진 없음</b>}
                  {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용됩니다.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      <section aria-label="영상 만들기" className="bp-dash grid gap-x-10 gap-y-6 border-t-2 pt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-4">
          <Ruler seconds={ed.totalSeconds} actual={ed.allActual} />
          <p className="m-0 text-[14px] leading-[1.65] text-muted" aria-live="polite">
            {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있습니다. 모두 채워야 조립할 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 장면만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 장면에 음성과 자막을 입혀 MP4로 만듭니다.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Quality ed={ed} />
          <button type="button" data-act="render" className={cx(btn.primary, 'min-h-12 px-6')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
            {ed.renderPending ? '시작하는 중' : '도면 승인 · 영상 만들기'}
          </button>
        </div>
      </section>
    </div>
  )
}

const btnIcon = 'grid size-11 shrink-0 place-items-center border border-edge text-ink hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span className="text-cta">저장됨</span>}
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

function Motions({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">카메라 움직임</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center border px-3 text-[14px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent text-on-accent' : 'border-edge text-ink hover:bg-panel-2',
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-12 cursor-pointer items-center border px-4 text-[14px] font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            i > 0 && '-ml-px',
            ed.motionQuality === q.value ? 'border-hi bg-hi text-on-hi' : 'border-edge text-ink hover:bg-panel-2',
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
