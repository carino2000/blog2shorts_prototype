import { Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
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
import { Stage } from '../shared/Stage'
import { withTimes } from '../shared/timeline'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn } from './styles'
import { Kicker, Notice, Plate, RoleMark, Ruler } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" wide>
      {(project) => <Proof project={project} />}
    </Shell>
  )
}

function Proof({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const [drawer, setDrawer] = useState<string | null>(null)
  const upload = useAssetUpload(project.id, (assetId) => {
    ed.pickAsset(assetId)
    setDrawer(null)
  })
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)

  const preview = sel && selRow && (
    <Plate
      caption={
        <>
          도판 · 장면 {sel.order}({ROLE_LABEL[sel.role]}) · <span className="tabular-nums">{tc(selRow.start)}–{tc(selRow.end)}</span>
        </>
      }
    >
      <Stage>
        <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
      </Stage>
    </Plate>
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-ink pb-6">
        <div className="flex flex-col gap-3">
          <Kicker>교정 · 장면</Kicker>
          <h1 className="m-0 font-serif text-[40px] font-black leading-[1.1] tracking-[-0.03em] sm:text-[52px]">장면 교정</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Saved state={ed.saveState} onRetry={ed.retrySave} />
          <div className="hidden lg:block">
            <Controls ed={ed} variant="top" />
          </div>
        </div>
      </div>

      {ed.uploadNotice && (
        <Notice tone="note" icon={ImagePlus} title="이 글에는 사진이 없습니다.">
          장면에 쓸 사진을 올려 주세요. 장면마다 ‘도판’을 눌러 올릴 수 있습니다.
        </Notice>
      )}
      {ed.saveError && <Notice title="저장하지 못했습니다">{ed.saveError}</Notice>}
      {ed.renderError && <Notice>{ed.renderError}</Notice>}

      <div className="grid items-start gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="장면 교정쇄" className="flex min-w-0 flex-col gap-6">
          <Ruler seconds={ed.totalSeconds} actual={ed.allActual} />

          <ol className="m-0 list-none border-t-2 border-ink p-0">
            {rows.map(({ scene, start, end }) => {
              const on = scene.id === sel?.id
              const src = ed.srcOf(scene.assetId)
              const missing = !scene.assetId
              const open = drawer === scene.id
              return (
                <li
                  key={scene.id}
                  data-scene-select
                  onClick={() => ed.select(scene.id)}
                  onFocusCapture={() => ed.select(scene.id)}
                  className={cx('border-b border-line border-l-[6px] py-5 pl-3 pr-1 transition-colors duration-150 sm:pr-3', on ? 'border-l-ink bg-panel-2' : 'border-l-transparent')}
                >
                  <div className="grid grid-cols-[2.6rem_4.6rem_minmax(0,1fr)] gap-x-3 gap-y-3 sm:grid-cols-[3.4rem_5.6rem_minmax(0,1fr)] sm:gap-x-5">
                    <div className="flex flex-col items-start gap-2">
                      <span className="font-serif text-[36px] font-black leading-[0.9] sm:text-[44px]">{scene.order}</span>
                      <RoleMark role={scene.role} />
                    </div>

                    <button
                      type="button"
                      aria-expanded={open}
                      data-asset-open
                      aria-label={missing ? `장면 ${scene.order} 사진 넣기` : `장면 ${scene.order} 사진 바꾸기`}
                      onClick={() => {
                        ed.select(scene.id)
                        setDrawer(open ? null : scene.id)
                      }}
                      className={cx(
                        'group relative block aspect-[9/16] w-full overflow-hidden border text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                        missing ? 'border-dashed border-ink bg-bg' : 'border-ink',
                      )}
                    >
                      {src ? <img src={src} alt="" className={cx('size-full object-cover', on ? 'press-photo-on' : 'press-photo')} /> : <span className="grid size-full place-items-center px-1 text-center leading-tight">사진<br />없음</span>}
                      <span className="absolute inset-x-0 bottom-0 bg-ink py-0.5 text-center text-[10px] font-bold text-bg">{open ? '닫기' : '바꾸기'}</span>
                    </button>

                    <div className="flex min-w-0 flex-col gap-2.5">
                      <label className="sr-only" htmlFor={`${scene.id}-text`}>
                        장면 {scene.order} 문구
                      </label>
                      <textarea
                        id={`${scene.id}-text`}
                        data-scene-text
                        data-selected={on ? 'true' : undefined}
                        rows={3}
                        value={scene.text}
                        onChange={(e) => ed.setText(scene.id, e.target.value)}
                        className="w-full resize-y border-0 border-b border-ink bg-transparent px-0 py-1 font-serif text-[17px] leading-[1.75] text-ink focus:border-b-[3px] focus:outline-none"
                      />
                      <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-muted">
                        <span className="tabular-nums">{countChars(scene.text)}자</span>
                        <span className="tabular-nums">{tc(start)}–{tc(end)}</span>
                        <span>{scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}</span>
                        {ed.voiceRedo.has(scene.id) && (
                          <span className="inline-flex items-center gap-1 font-bold text-ink">
                            <Mic aria-hidden="true" className="size-3" />※ 음성 다시 만듦
                          </span>
                        )}
                        {missing && <span className="font-bold text-ink">▲ 사진이 없습니다</span>}
                      </p>
                      <MotionLine id={scene.id} value={scene.motion} onChange={(m) => ed.setMotion(scene.id, m)} />
                    </div>
                  </div>

                  {open && (
                    <div className="appear mt-4 flex flex-col gap-3 border-t border-ink pt-4 sm:ml-[4.6rem]">
                      <p className="m-0 font-sans text-xs font-bold">장면 {scene.order}에 실을 도판</p>
                      <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-6 xl:grid-cols-8">
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
                                  setDrawer(null)
                                }}
                                className={cx(
                                  'relative block aspect-square w-full overflow-hidden border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                                  current ? 'border-ink' : 'border-line hover:border-ink',
                                )}
                              >
                                <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className={cx('size-full object-cover', current ? 'press-photo-on' : 'press-photo')} />
                                {others.length > 0 && <span className="absolute bottom-0 right-0 bg-ink px-1 font-sans text-[10px] font-bold text-bg">{others.map((o) => `${o}`).join('·')}</span>}
                              </button>
                            </li>
                          )
                        })}
                        <li>
                          <label
                            className={cx(
                              'flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-ink text-center font-sans text-[11px] font-bold hover:bg-ink hover:text-bg',
                              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                            )}
                          >
                            {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                            {upload.pending ? '올리는 중' : '올리기'}
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
                      <p className={cx('m-0 font-sans text-xs', upload.error ? 'font-bold' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                        {upload.error ? `▲ ${upload.error}` : 'jpg·png·webp, 10MB 이하. 올린 사진은 이 장면에 바로 실립니다.'}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        <aside aria-label="미리보기" className="mx-auto w-full max-w-[300px] lg:sticky lg:top-6 lg:max-w-none">
          {preview}
          {sel && (
            <div className="mt-3 flex items-center justify-between font-sans text-[15px]">
              <button type="button" data-act="prev" className={btn.link} onClick={ed.prev} disabled={sel.order <= 1}>
                ← 이전 장면
              </button>
              <button type="button" data-act="next" className={btn.link} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                다음 장면 →
              </button>
            </div>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-bg lg:hidden">
        <div className="sw-inset mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-3">
          <Controls ed={ed} variant="bottom" />
        </div>
      </div>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-8 items-center gap-2 font-sans text-xs" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중…</span>}
      {state === 'saved' && <span className="text-muted">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="font-bold">▲ 저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ink">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionLine({ id, value, onChange }: { id: string; value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-wrap items-center gap-x-1 border-0 p-0">
      <legend className="sr-only">장면 {id} 카메라 움직임</legend>
      <span aria-hidden="true" className="mr-2 font-sans text-xs text-muted">
        움직임
      </span>
      {MOTIONS.map((m) => (
        <label
          key={m.value}
          className={cx(
            'flex min-h-11 min-w-11 cursor-pointer items-center justify-center px-2 font-sans text-[13px] underline-offset-[6px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-ink',
            value === m.value ? 'font-bold underline decoration-[3px]' : 'text-muted hover:text-ink hover:underline',
          )}
        >
          <input type="radio" name={`${name}`} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
          {m.label}
        </label>
      ))}
    </fieldset>
  )
}

function Controls({ ed, variant }: { ed: Editor; variant: 'top' | 'bottom' }) {
  const name = useId()
  const hint =
    ed.missingCount > 0
      ? `▲ 사진이 없는 장면 ${ed.missingCount}개 · 모든 장면에 사진이 있어야 합니다.`
      : ed.voiceRedo.size > 0
        ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만듭니다.`
        : ed.everRendered
          ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.'
          : `장면 ${ed.scenes.length}개에 음성과 자막을 입혀 MP4로 찍습니다.`
  return (
    <div className={cx('flex flex-col gap-1.5', variant === 'top' && 'items-end')}>
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label="움직임 품질" aria-describedby={`${ed.qualityHintId}-${variant}`} className="flex shrink-0 border border-ink">
          {MOTION_QUALITIES.map((q, i) => (
            <label
              key={q.value}
              className={cx(
                'flex min-h-11 cursor-pointer items-center px-3.5 font-sans text-[13px] whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
                i > 0 && 'border-l border-ink',
                ed.motionQuality === q.value ? 'bg-ink font-bold text-bg' : 'text-ink hover:bg-panel-2',
                ed.renderPending && 'cursor-not-allowed opacity-50',
              )}
            >
              <input type="radio" name={`${name}-${variant}`} value={q.value} checked={ed.motionQuality === q.value} disabled={ed.renderPending} onChange={() => ed.changeQuality(q.value)} className="sr-only" />
              {q.label}
            </label>
          ))}
        </div>
        <button type="button" data-act="render" className={cx(btn.primary, 'min-h-11 flex-1 px-5 sm:flex-none')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
          <Clapperboard aria-hidden="true" className="size-4" />
          {ed.renderPending ? '시작하는 중…' : '영상 찍기'}
        </button>
      </div>
      <p className="m-0 font-sans text-xs leading-snug text-muted" aria-live="polite">
        {variant === 'bottom' || ed.missingCount > 0 ? hint : ed.qualityDescription}
      </p>
      <p id={`${ed.qualityHintId}-${variant}`} className="sr-only">
        {ed.qualityDescription}
      </p>
    </div>
  )
}
