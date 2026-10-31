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
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { area, btn } from './styles'
import { Alert, Bubble, Chip, Glass, Length } from './ui'

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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <h1 className="m-0 font-display text-[clamp(2rem,4.6vw,3.25rem)] font-normal leading-[1.2]">장면을 다듬어 보세요</h1>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </header>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없어요">
          장면마다 쓸 사진을 아래 ‘사진’에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했어요">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {sel && (
          <section aria-label={`장면 ${sel.order} 미리보기`} className="mx-auto flex w-full max-w-[16rem] flex-col gap-5 lg:mx-0 lg:sticky lg:top-6">
            <Bubble>
              <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
            </Bubble>
            <div className="flex items-center justify-center gap-2">
              <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={sel.order <= 1}>
                <ChevronLeft aria-hidden="true" className="size-5" />
              </button>
              <Chip tone="hook" className="min-w-24 justify-center">
                {sel.order} / {ed.scenes.length} · {ROLE_LABEL[sel.role]}
              </Chip>
              <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                <ChevronRight aria-hidden="true" className="size-5" />
              </button>
            </div>
          </section>
        )}

        <div className="flex min-w-0 flex-col gap-6">
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
                      className={cx('flex min-h-12 items-center gap-2 rounded-full border-2 py-1 pl-1 pr-4 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-accent bg-accent-soft text-accent' : 'border-transparent bg-white/70 text-ink hover:bg-white')}
                    >
                      <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-ink/10 text-[11px] text-muted">{src ? <img src={src} alt="" className="size-full object-cover" /> : '없음'}</span>
                      {scene.order}
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>

          {sel && (
            <Glass className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-3">
                <label htmlFor="sf-text" className="text-[15px] font-bold">
                  장면 {sel.order} 문구
                </label>
                <textarea id="sf-text" data-scene-text data-selected="true" rows={4} value={sel.text} onChange={(e) => ed.setText(sel.id, e.target.value)} className={cx(area, 'text-[17px] leading-[1.75]')} />
                <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] tabular-nums text-muted">
                  <span>{countChars(sel.text)}자</span>
                  <span>{sel.durationSec !== null ? formatSec(sel.durationSec) : `약 ${formatSec(sceneSec(sel))}`}</span>
                  {ed.voiceRedo.has(sel.id) && (
                    <span className="inline-flex items-center gap-1 font-semibold text-hook">
                      <Mic aria-hidden="true" className="size-3.5" />
                      음성을 다시 만들어요
                    </span>
                  )}
                </p>
              </div>

              <Motions value={sel.motion} onChange={(m) => ed.setMotion(sel.id, m)} />

              <div className="flex flex-col gap-3">
                <p className="m-0 text-[15px] font-bold">사진</p>
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
                          className={cx('relative block size-[4.5rem] overflow-hidden rounded-[22px] border-4 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-white opacity-85 hover:opacity-100')}
                        >
                          <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                          {others.length > 0 && <span className="absolute bottom-0 right-0 rounded-tl-xl bg-white px-1.5 text-[11px] font-bold tabular-nums text-hook">{others.join('·')}</span>}
                        </button>
                      </li>
                    )
                  })}
                  <li>
                    <label className="flex size-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-[22px] border-2 border-dashed border-edge text-center text-[11px] font-semibold text-muted hover:border-accent hover:text-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
                  {!sel.assetId && !upload.error && <b className="mr-2 text-danger-ink">이 장면엔 사진이 없어요.</b>}
                  {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용돼요.'}
                </p>
              </div>
            </Glass>
          )}

          <Glass className="flex flex-col gap-5 p-6 sm:p-8">
            <Length seconds={ed.totalSeconds} actual={ed.allActual} />
            <p className="m-0 text-[14px] leading-[1.7] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있어요. 모두 채우면 영상을 만들 수 있어요.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 장면만 음성을 다시 만들어요.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 써요.' : `${ed.scenes.length}개 장면에 음성과 자막을 입혀 MP4로 만들어요.`}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Quality ed={ed} />
              <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
                {ed.renderPending ? '시작하는 중' : '영상 만들기'}
              </button>
            </div>
          </Glass>
        </div>
      </div>
    </div>
  )
}

const btnIcon = 'grid size-11 place-items-center rounded-full bg-white/80 text-ink shadow-sm hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[14px] font-semibold" role="status" aria-live="polite">
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
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="mb-3 p-0 text-[15px] font-bold">카메라 움직임</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border-2 px-5 text-[14px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent-soft text-accent' : 'border-transparent bg-ink/[0.07] text-ink hover:bg-ink/10',
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="inline-flex rounded-full bg-ink/[0.07] p-1">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center rounded-full px-5 text-[14px] font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            ed.motionQuality === q.value ? 'bg-white text-ink shadow-md' : 'text-muted hover:text-ink',
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
