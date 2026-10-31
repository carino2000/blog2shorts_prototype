import { Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useId, useState } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { countChars, formatSec, sceneSec } from '../../lib/duration'
import { MOTIONS } from '../../lib/motion'
import { MOTION_QUALITIES } from '../../lib/motionQuality'
import { sceneSubtitle } from '../../lib/render'
import { cx } from '../../lib/ui'
import { tc } from '../shared/format'
import { Stage } from '../shared/Stage'
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { NOTE, btn } from './styles'
import { Hand, Length, Memo, Polaroid, Stamp } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" wide>
      {(project) => <Desk project={project} />}
    </Shell>
  )
}

function Desk({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const [tray, setTray] = useState<string | null>(null)
  const upload = useAssetUpload(project.id, (assetId) => {
    ed.pickAsset(assetId)
    setTray(null)
  })
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
        <div className="flex flex-col gap-2">
          <Hand className="text-[clamp(2.25rem,5vw,3.5rem)]">장면 메모를 고쳐 봐요.</Hand>
          <p className="m-0 text-[17px] text-muted">메모마다 문구를 쓰고, 사진과 카메라 움직임을 골라요. 고치면 알아서 저장돼요.</p>
        </div>
        <Saved state={ed.saveState} onRetry={ed.retrySave} />
      </div>

      {ed.uploadNotice && (
        <Memo tone="note" icon={ImagePlus} title="이 글에는 사진이 없어요.">
          장면마다 쓸 사진을 올려 주세요. 메모의 사진 칸을 누르면 올릴 수 있어요.
        </Memo>
      )}
      {ed.saveError && <Memo title="저장하지 못했어요">{ed.saveError}</Memo>}
      {ed.renderError && <Memo>{ed.renderError}</Memo>}

      <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="장면 메모" className="flex min-w-0 flex-col gap-8">
          <div className="max-w-xl">
            <Length seconds={ed.totalSeconds} actual={ed.allActual} />
          </div>

          <ol className="m-0 grid list-none gap-x-7 gap-y-10 p-0 md:grid-cols-2">
            {rows.map(({ scene, start }, i) => {
              const on = scene.id === sel?.id
              const src = ed.srcOf(scene.assetId)
              const missing = !scene.assetId
              const open = tray === scene.id
              return (
                <li
                  key={scene.id}
                  data-note={scene.role}
                  data-scene-select
                  aria-current={on ? 'true' : undefined}
                  onClick={() => ed.select(scene.id)}
                  onFocusCapture={() => ed.select(scene.id)}
                  className={cx(NOTE, 'paper-tape flex flex-col gap-4 p-5 pt-6 transition-transform duration-200 motion-reduce:rotate-0', i % 2 ? 'rotate-[0.6deg]' : '-rotate-[0.6deg]', on && 'outline-[3px] outline-dashed outline-offset-4 outline-accent')}
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border-2 border-ink/70 font-display text-[22px] font-bold leading-none">
                      {scene.order}
                    </span>
                    <Stamp role={scene.role} />
                    <span className="ml-auto text-[15px] tabular-nums text-ink/70">
                      {tc(start)} · {scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-4">
                    <button
                      type="button"
                      data-asset-open
                      aria-expanded={open}
                      aria-label={missing ? `장면 ${scene.order} 사진 붙이기` : `장면 ${scene.order} 사진 바꾸기`}
                      onClick={() => {
                        ed.select(scene.id)
                        setTray(open ? null : scene.id)
                      }}
                      className={cx(
                        'relative block aspect-[9/16] w-full self-start overflow-hidden border-[5px] border-surface bg-surface text-[13px] font-bold shadow-[0_2px_6px_rgba(58,47,38,0.35)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                        missing && 'border-dashed border-danger',
                      )}
                    >
                      {src ? <img src={src} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center px-1 text-center leading-tight text-danger-ink">사진을<br />붙여요</span>}
                    </button>
                    <div className="flex min-w-0 flex-col gap-2">
                      <label className="sr-only" htmlFor={`${scene.id}-text`}>
                        장면 {scene.order} 문구
                      </label>
                      <textarea
                        id={`${scene.id}-text`}
                        data-scene-text
                        data-selected={on ? 'true' : undefined}
                        rows={5}
                        value={scene.text}
                        onChange={(e) => ed.setText(scene.id, e.target.value)}
                        className="w-full resize-y border-0 border-b-2 border-dashed border-ink/50 bg-transparent px-0 py-1 font-display text-[23px] font-bold leading-[1.4] text-ink focus:border-solid focus:border-accent focus:outline-none"
                      />
                      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-ink/75">
                        <span>{countChars(scene.text)}자</span>
                        {ed.voiceRedo.has(scene.id) && (
                          <span className="inline-flex items-center gap-1 font-bold text-ink">
                            <Mic aria-hidden="true" className="size-3.5" />
                            음성을 다시 만들어요
                          </span>
                        )}
                        {missing && <span className="font-bold text-danger-ink">사진이 아직 없어요</span>}
                      </p>
                    </div>
                  </div>

                  <MotionStamps id={scene.id} value={scene.motion} onChange={(m) => ed.setMotion(scene.id, m)} />

                  {open && (
                    <div className="appear flex flex-col gap-3 border-t-2 border-dashed border-ink/40 pt-4">
                      <p className="m-0 font-display text-[22px] font-bold leading-none">어떤 사진을 붙일까요?</p>
                      <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                        {ed.assets.map((asset) => {
                          const current = asset.id === scene.assetId
                          const others = ed.scenes.filter((s) => s.assetId === asset.id && s.id !== scene.id).map((s) => s.order)
                          return (
                            <li key={asset.id}>
                              <button
                                type="button"
                                data-asset
                                aria-pressed={current}
                                aria-label={`${asset.origin === 'blog' ? '블로그' : '업로드'} 이미지 ${asset.width}×${asset.height}${others.length ? `, 장면 ${others.join(', ')}에서 사용 중` : ''}`}
                                onClick={() => {
                                  ed.pickAsset(asset.id)
                                  setTray(null)
                                }}
                                className={cx('relative block size-16 overflow-hidden border-[4px] bg-surface shadow-[0_1px_4px_rgba(58,47,38,0.3)] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-surface hover:border-ink/40')}
                              >
                                <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                                {others.length > 0 && <span className="absolute bottom-0 right-0 bg-ink px-1 text-[11px] font-bold leading-tight text-bg">{others.join('·')}</span>}
                              </button>
                            </li>
                          )
                        })}
                        <li>
                          <label
                            className={cx(
                              'flex size-16 cursor-pointer flex-col items-center justify-center gap-0.5 border-[3px] border-dashed border-ink/60 text-center font-display text-[14px] font-bold leading-tight hover:bg-surface',
                              'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                            )}
                          >
                            {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                            {upload.pending ? '올리는 중' : '내 사진'}
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
                      <p className={cx('m-0 text-[15px] leading-snug', upload.error ? 'font-bold text-danger-ink' : 'text-ink/75')} role={upload.error ? 'alert' : undefined}>
                        {upload.error ?? 'jpg·png·webp, 10MB까지 올릴 수 있어요. 올리면 이 메모에 바로 붙어요.'}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <aside aria-label="미리보기" className="mx-auto w-full max-w-[260px] lg:sticky lg:top-6 lg:max-w-none lg:pt-4">
          {sel && selRow && (
            <>
              <Polaroid caption={`장면 ${sel.order} 미리보기`} tilt="rotate-1">
                <Stage>
                  <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
                </Stage>
              </Polaroid>
              <div className="mt-5 flex items-center justify-between">
                <button type="button" data-act="prev" className={btn.quiet} onClick={ed.prev} disabled={sel.order <= 1}>
                  ← 앞 장면
                </button>
                <button type="button" data-act="next" className={btn.quiet} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                  다음 장면 →
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      <section aria-label="영상 만들기" className={cx(NOTE, 'flex flex-col gap-5 bg-surface p-6 sm:p-8')} style={{ ['--note' as string]: '#fffdf7' }}>
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="flex min-w-0 flex-col gap-1">
            <Hand as="h2" className="text-[32px]">
              다 고쳤으면 영상으로 만들어 볼까요?
            </Hand>
            <p className="m-0 text-[17px] leading-[1.7] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <b className="text-danger-ink">사진이 없는 장면이 {ed.missingCount}개 있어요. 모두 붙여야 만들 수 있어요.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만들어요.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 써요.' : `장면 ${ed.scenes.length}개에 음성과 자막을 입혀서 MP4로 만들어요.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <QualityPick ed={ed} />
            <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              <Clapperboard aria-hidden="true" className="size-5" />
              {ed.renderPending ? '시작하는 중…' : '영상 만들기'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 font-display text-[22px] font-bold leading-none" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장하는 중…</span>}
      {state === 'saved' && <span className="text-cta">✓ 저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장하지 못했어요</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-[3px] focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionStamps({ id, value, onChange }: { id: string; value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-2 border-0 p-0">
      <legend className="sr-only">장면 {id} 카메라 움직임</legend>
      <span aria-hidden="true" className="mr-1 font-display text-[18px] font-bold">
        카메라
      </span>
      {MOTIONS.map((m) => (
        <label
          key={m.value}
          className={cx(
            'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[8px] border-2 px-3 text-[15px] has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            value === m.value ? 'border-ink bg-ink/10 font-bold' : 'border-ink/30 hover:border-ink/70',
          )}
        >
          <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
          {m.label}
        </label>
      ))}
    </fieldset>
  )
}

function QualityPick({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 gap-2">
      {MOTION_QUALITIES.map((q) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-12 cursor-pointer items-center rounded-[10px] border-2 px-4 font-display text-[21px] font-bold leading-none whitespace-nowrap has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            ed.motionQuality === q.value ? 'border-accent bg-accent-soft text-ink' : 'border-ink/30 text-muted hover:border-ink/70',
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
