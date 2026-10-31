import { Clapperboard, ImagePlus, Loader2, Mic, Upload } from 'lucide-react'
import { useId } from 'react'
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
import { btn, field } from './styles'
import { Alert, Cap, Head, Mark, Num, Scale } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" wide>
      {(project) => <Sheet project={project} />}
    </Shell>
  )
}

function Sheet({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected

  return (
    <div className="grid-12 gap-y-10">
      <div className="col-span-12 flex items-end gap-6 sm:gap-10 lg:col-span-5">
        <Num n={3} className="text-[clamp(4.5rem,11vw,8.5rem)] text-accent" />
        <Head className="pb-1">장면 편집</Head>
      </div>

      <section aria-label="출력" className="col-span-12 flex flex-col gap-4 border-t-4 border-ink pt-3 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Cap>출력</Cap>
          <Saved state={ed.saveState} onRetry={ed.retrySave} />
        </div>
        <Scale seconds={ed.totalSeconds} actual={ed.allActual} />
        <div className="flex flex-wrap items-center gap-3">
          <QualityPick ed={ed} />
          <button type="button" data-act="render" className={cx(btn.primary, 'min-h-12 flex-1 sm:flex-none')} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
            <span className="flex items-center gap-2">
              <Clapperboard aria-hidden="true" className="size-4" />
              {ed.renderPending ? '시작하는 중' : '영상 만들기'}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <p className="m-0 text-[14px] leading-snug text-muted" aria-live="polite">
          {ed.missingCount > 0 ? <b className="text-accent">사진 없는 장면 {ed.missingCount}개 — 모두 채워야 한다.</b> : ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만든다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 쓴다.' : `장면 ${ed.scenes.length}개. 음성과 자막을 입혀 MP4로 낸다.`}
        </p>
      </section>

      {ed.uploadNotice && (
        <div className="col-span-12">
          <Alert tone="warn" icon={ImagePlus} title="이 글에는 사진이 없습니다.">
            장면에 쓸 사진을 올리세요. 선택한 장면 오른쪽의 업로드 칸에서 올린다.
          </Alert>
        </div>
      )}
      {ed.saveError && (
        <div className="col-span-12">
          <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>
        </div>
      )}
      {ed.renderError && (
        <div className="col-span-12">
          <Alert>{ed.renderError}</Alert>
        </div>
      )}

      <ol className="col-span-12 m-0 list-none border-t-4 border-ink p-0">
        {rows.map(({ scene, start, end }) => {
          const on = scene.id === sel?.id
          const src = ed.srcOf(scene.assetId)
          const missing = !scene.assetId
          return (
            <li
              key={scene.id}
              data-scene-select
              aria-current={on ? 'true' : undefined}
              onClick={() => ed.select(scene.id)}
              onFocusCapture={() => ed.select(scene.id)}
              className={cx('border-b border-ink py-7 transition-colors duration-100', on && 'bg-accent-soft')}
            >
              <div className="grid-12 gap-y-5 px-1">
                <div className="col-span-12 flex items-end gap-5 md:col-span-5 lg:col-span-5">
                  <Num n={scene.order} className={cx('w-[4.25rem] shrink-0 text-[clamp(2.75rem,8vw,6.5rem)] sm:w-24 md:w-[9.5rem]', on && 'text-accent')} />
                  <div className={cx('w-[9.5rem] shrink-0 border-2 sm:w-[10.5rem]', on ? 'border-accent' : 'border-ink')}>
                    <Stage>
                      <SceneFrame key={`${scene.id}-${scene.motion}-${scene.assetId}-${on}`} src={src} subtitle={sceneSubtitle(scene)} motion={scene.motion} animate={on} />
                    </Stage>
                  </div>
                  <div className="hidden min-w-0 flex-col gap-2 pb-1 lg:flex">
                    <Mark role={scene.role} />
                    <p className="m-0 text-[13px] font-medium tabular-nums text-muted">
                      {tc(start)} – {tc(end)}
                    </p>
                  </div>
                </div>

                <div className="col-span-12 flex min-w-0 flex-col gap-3 md:col-span-7 lg:col-span-4">
                  <div className="flex items-center gap-4 lg:hidden">
                    <Mark role={scene.role} />
                    <span className="text-[13px] font-medium tabular-nums text-muted">
                      {tc(start)} – {tc(end)}
                    </span>
                  </div>
                  <label className="sr-only" htmlFor={`${scene.id}-text`}>
                    장면 {scene.order} 문구
                  </label>
                  <textarea
                    id={`${scene.id}-text`}
                    data-scene-text
                    data-selected={on ? 'true' : undefined}
                    rows={4}
                    value={scene.text}
                    onChange={(e) => ed.setText(scene.id, e.target.value)}
                    className={cx(field, 'resize-y py-3 text-[17px] font-bold leading-[1.55]')}
                  />
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <label className="flex items-center gap-2 text-[13px] font-bold">
                      <Cap>카메라</Cap>
                      <select
                        data-scene-motion
                        value={scene.motion}
                        onChange={(e) => ed.setMotion(scene.id, e.target.value as (typeof MOTIONS)[number]['value'])}
                        className="min-h-11 border-2 border-ink bg-bg px-2 text-[15px] font-bold text-ink focus:border-accent focus:outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {MOTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="m-0 flex flex-wrap items-center gap-x-4 text-[13px] font-medium tabular-nums text-muted">
                      <span>{countChars(scene.text)}자</span>
                      <span>{scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}</span>
                      {ed.voiceRedo.has(scene.id) && (
                        <span className="inline-flex items-center gap-1 font-bold text-ink">
                          <Mic aria-hidden="true" className="size-3.5" />
                          음성 다시
                        </span>
                      )}
                      {missing && <b className="text-accent">사진 없음</b>}
                    </p>
                  </div>
                </div>

                <div className="col-span-12 flex min-w-0 flex-col gap-3 lg:col-span-3">
                  <Cap>사진</Cap>
                  {on ? (
                    <>
                      <ul className="m-0 grid list-none grid-cols-5 gap-1.5 p-0 sm:grid-cols-8 lg:grid-cols-4">
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
                                onClick={() => ed.pickAsset(asset.id)}
                                className={cx('relative block aspect-square w-full overflow-hidden border-[3px] bg-bg focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent', current ? 'border-accent' : 'border-transparent hover:border-ink')}
                              >
                                <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                                {others.length > 0 && <span className="absolute bottom-0 right-0 bg-ink px-1 text-[11px] font-black leading-tight text-bg tabular-nums">{others.join('·')}</span>}
                              </button>
                            </li>
                          )
                        })}
                        <li>
                          <label
                            className={cx(
                              'flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-0.5 border-[3px] border-dashed border-ink text-center text-[11px] font-bold leading-tight hover:border-accent hover:text-accent',
                              'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                            )}
                          >
                            {upload.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-4" />}
                            {upload.pending ? '업로드 중' : '업로드'}
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
                      <p className={cx('m-0 text-[13px] leading-snug', upload.error ? 'font-bold text-accent' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                        {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 적용된다.'}
                      </p>
                    </>
                  ) : (
                    <p className="m-0 text-[14px] leading-snug text-muted">{missing ? '사진이 없다. 이 장면을 선택해 고른다.' : '이 장면을 선택하면 사진을 바꿀 수 있다.'}</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="col-span-12 flex items-center gap-6">
        <button type="button" data-act="prev" className={btn.ghost} onClick={ed.prev} disabled={!sel || sel.order <= 1}>
          <span aria-hidden="true">←</span> 이전 장면
        </button>
        <button type="button" data-act="next" className={btn.ghost} onClick={ed.next} disabled={!sel || sel.order >= ed.scenes.length}>
          다음 장면 <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[13px] font-bold" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중</span>}
      {state === 'saved' && <span>저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-accent">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 underline underline-offset-4 focus-visible:outline-[3px] focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function QualityPick({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 border-2 border-ink">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center px-4 text-[14px] font-bold whitespace-nowrap has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
            i > 0 && 'border-l-2 border-ink',
            ed.motionQuality === q.value ? 'bg-ink text-bg' : 'hover:bg-panel-2',
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
