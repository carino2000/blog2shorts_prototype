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
import { btn, field } from './styles'
import { Alert, Gauge, Heading, RoleTag, Screen, Win } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Workbench project={project} />}
    </Shell>
  )
}

function Workbench({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading>장면 편집</Heading>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다">
          장면마다 쓸 사진을 ‘속성’ 창에서 올려 주세요.
        </Alert>
      )}
      {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
      {ed.renderError && <Alert>{ed.renderError}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {sel && (
            <Win
              title={`미리보기 ${sel.order}/${ed.scenes.length}`}
              className="mx-auto w-full max-w-[17rem] lg:mx-0"
              bodyClassName="flex flex-col gap-3 !p-3"
              right={
                <span className="flex items-center gap-1">
                  <button type="button" data-act="prev" aria-label="이전 장면" className={btnIcon} onClick={ed.prev} disabled={sel.order <= 1}>
                    <ChevronLeft aria-hidden="true" className="size-5" />
                  </button>
                  <button type="button" data-act="next" aria-label="다음 장면" className={btnIcon} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </button>
                </span>
              }
            >
              <Screen>
                <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
              </Screen>
            </Win>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Win title="장면 목록" bodyClassName="!p-0">
            <ol className="dk-sunk m-3 list-none p-0">
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
                      className={cx('grid min-h-11 w-full grid-cols-[1.75rem_3rem_3.25rem_minmax(0,1fr)] items-center gap-x-2 px-3 py-1.5 text-left font-mono text-[12px] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent', on ? 'bg-accent text-on-accent' : 'hover:bg-panel-2')}
                    >
                      <b>{String(scene.order).padStart(2, '0')}</b>
                      <span>{tc(start)}</span>
                      <span>{on ? ROLE_LABEL[scene.role] : <RoleTag role={scene.role} />}</span>
                      <span className="flex min-w-0 items-center gap-2 font-sans text-[14px]">
                        <span className="truncate">{scene.text}</span>
                        {!scene.assetId && <span className={cx('shrink-0 font-mono text-[11px] font-bold', on ? 'text-on-accent' : 'text-danger-ink')}>사진 없음</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </Win>

          {sel && (
            <Win title={`속성 — 장면 ${sel.order}`} bodyClassName="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="dk-text" className="text-[14px] font-bold">
                  문구
                </label>
                <textarea id="dk-text" data-scene-text data-selected="true" rows={4} value={sel.text} onChange={(e) => ed.setText(sel.id, e.target.value)} className={cx(field, 'resize-y py-2 text-[16px] leading-[1.7]')} />
                <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-muted">
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
                          className={cx('dk-sunk relative block size-[4.5rem] overflow-hidden p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', current && 'outline outline-[3px] outline-offset-0 outline-accent')}
                        >
                          <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                          {others.length > 0 && <span className="absolute bottom-0 right-0 bg-surface px-1 font-mono text-[11px] font-bold">{others.join('·')}</span>}
                        </button>
                      </li>
                    )
                  })}
                  <li>
                    <label className="dk-key flex size-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 text-center font-mono text-[11px] font-bold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
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
                <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-bold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                  {!sel.assetId && !upload.error && <b className="mr-2 text-danger-ink">사진 없음</b>}
                  {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용됩니다.'}
                </p>
              </div>
            </Win>
          )}

          <Win title="내보내기" bodyClassName="flex flex-col gap-4">
            <Gauge seconds={ed.totalSeconds} actual={ed.allActual} />
            <p className="m-0 text-[14px] leading-[1.65] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있습니다. 모두 채워야 영상을 만들 수 있습니다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 ${ed.voiceRedo.size}개 장면만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `${ed.scenes.length}개 장면에 음성과 자막을 입혀 MP4로 만듭니다.`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Quality ed={ed} />
              <button type="button" data-act="render" className={cx(btn.primary, 'min-h-12 px-6')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
                {ed.renderPending ? '시작하는 중' : '영상 만들기'}
              </button>
            </div>
          </Win>
        </div>
      </div>
    </div>
  )
}

const btnIcon = 'grid size-11 place-items-center text-on-accent hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white'

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="dk-win m-0 flex min-h-11 items-center gap-2 px-3 font-mono text-[12px]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중…</span>}
      {state === 'saved' && <span className="font-bold text-cta">저장됨</span>}
      {state === 'idle' && <span className="text-muted">변경 없음</span>}
      {state === 'error' && (
        <>
          <span className="font-bold text-danger-ink">저장 실패</span>
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
      <legend className="mb-2 p-0 text-[14px] font-bold">카메라 움직임</legend>
      <div className="flex flex-wrap gap-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            aria-pressed={value === m.value}
            className={cx('dk-key flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-4 text-[14px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent', value === m.value && '!bg-accent !text-on-accent')}
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
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex gap-1">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'dk-key flex min-h-12 cursor-pointer items-center px-4 text-[14px] font-semibold whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            ed.motionQuality === q.value && '!bg-accent !text-on-accent',
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
