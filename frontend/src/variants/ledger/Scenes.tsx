import { ArrowLeft, ArrowRight, Clapperboard, ImagePlus, Loader2, Upload } from 'lucide-react'
import { useId, useState } from 'react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { countChars, formatSec, sceneSec } from '../../lib/duration'
import { MOTIONS } from '../../lib/motion'
import { MOTION_QUALITIES } from '../../lib/motionQuality'
import { sceneSubtitle } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useAssetUpload, useScenesEditor } from '../shared/useScenesEditor'
import { Shell } from './Shell'
import { btn, field } from './styles'
import { Length, Note, Question } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes" width="max-w-[860px]">
      {(project) => <Wizard project={project} />}
    </Shell>
  )
}

const ROLE_TEXT = { hook: '시작', body: '이야기', cta: '마무리' } as const

function Wizard({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const [step, setStep] = useState(0)
  const n = ed.scenes.length
  const final = step >= n
  const scene = ed.selected

  function go(i: number) {
    setStep(i)
    if (i < n) ed.selectIndex(i)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-[17px] text-muted">장면을 하나씩 고쳐 봐요.</p>
          <Saved state={ed.saveState} onRetry={ed.retrySave} />
        </div>
        <ol className="m-0 flex list-none flex-wrap gap-2.5 p-0" aria-label="장면 이동">
          {ed.scenes.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                data-scene-select
                aria-current={!final && step === i ? 'step' : undefined}
                aria-label={`장면 ${s.order}${s.assetId ? '' : ', 사진 없음'}`}
                onClick={() => go(i)}
                className={cx(
                  'relative grid size-12 place-items-center rounded-full border-2 text-[18px] font-bold transition-colors',
                  'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                  !final && step === i ? 'border-accent bg-accent text-on-accent' : 'border-edge bg-surface text-ink hover:border-ink',
                )}
              >
                {s.order}
                {!s.assetId && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-bg bg-danger" />}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              data-act="finish"
              aria-current={final ? 'step' : undefined}
              onClick={() => go(n)}
              className={cx(
                'min-h-12 rounded-full border-2 px-5 text-[17px] font-bold transition-colors',
                'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                final ? 'border-accent bg-accent text-on-accent' : 'border-edge bg-surface text-ink hover:border-ink',
              )}
            >
              마무리
            </button>
          </li>
        </ol>
      </div>

      {ed.uploadNotice && (
        <Note tone="info" icon={ImagePlus} title="이 글에는 사진이 없어요">
          장면마다 쓸 사진을 올려 주세요. 아래 ‘내 사진 올리기’로 올릴 수 있어요.
        </Note>
      )}
      {ed.saveError && <Note title="저장하지 못했어요">{ed.saveError}</Note>}
      {ed.renderError && <Note>{ed.renderError}</Note>}

      {!final && scene ? (
        <div className="grid gap-x-14 gap-y-10 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="flex flex-col gap-12">
            <p className="m-0 text-[17px] font-semibold text-muted">
              장면 {scene.order} / {n} · {ROLE_TEXT[scene.role]}
            </p>

            <QuestionBlock id="q-text" title="이 장면에서는 뭐라고 말할까요?">
              <textarea
                id="q-text"
                data-scene-text
                data-selected="true"
                rows={4}
                value={scene.text}
                onChange={(e) => ed.setText(scene.id, e.target.value)}
                className={cx(field, 'resize-y py-4 text-[20px] leading-[1.75]')}
              />
              <p className="m-0 text-[16px] text-muted">
                {countChars(scene.text)}자 · {scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}
                {ed.voiceRedo.has(scene.id) && ' · 문구를 고쳐서 이 장면의 음성을 다시 만들어요'}
              </p>
            </QuestionBlock>

            <QuestionBlock id="q-photo" title="어떤 사진을 보여 줄까요?">
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
                        onClick={() => ed.pickAsset(asset.id)}
                        className={cx(
                          'relative block size-[5.5rem] overflow-hidden rounded-[16px] border-4 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                          current ? 'border-accent' : 'border-transparent hover:border-edge',
                        )}
                      >
                        <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                        {others.length > 0 && <span className="absolute bottom-0.5 right-0.5 rounded-md bg-ink/85 px-1.5 text-[12px] font-bold text-bg">{others.join('·')}번</span>}
                      </button>
                    </li>
                  )
                })}
                <li>
                  <label
                    className={cx(
                      'flex size-[5.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-[16px] border-2 border-dashed text-center text-[13px] font-semibold leading-tight',
                      'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                      upload.error ? 'border-danger text-danger-ink' : 'border-edge text-muted hover:border-accent hover:text-accent',
                    )}
                  >
                    {upload.pending ? <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" /> : <Upload aria-hidden="true" className="size-5" />}
                    {upload.pending ? '올리는 중' : '내 사진 올리기'}
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
              <p className={cx('m-0 text-[16px]', upload.error ? 'font-semibold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                {scene.assetId ? '' : '이 장면에는 사진이 아직 없어요. 하나 골라 주세요. '}
                {upload.error ?? 'jpg·png·webp, 10MB까지 올릴 수 있어요. 올린 사진은 이 장면에 바로 들어가요.'}
              </p>
            </QuestionBlock>

            <MotionChoice value={scene.motion} onChange={(m) => ed.setMotion(scene.id, m)} />

            <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-line pt-8">
              <button type="button" data-act="prev" className={btn.quiet} disabled={step === 0} onClick={() => go(step - 1)}>
                <ArrowLeft aria-hidden="true" className="size-5" />
                이전 장면
              </button>
              <button type="button" data-act="next" className={btn.primary} onClick={() => go(step + 1)}>
                {step === n - 1 ? '마무리하러 가기' : '다음 장면'}
                <ArrowRight aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>

          <aside aria-label="미리보기" className="mx-auto w-[180px] md:sticky md:top-6 md:w-full md:self-start">
            <div className="overflow-hidden rounded-[22px] border-[3px] border-ink">
              <Stage>
                <SceneFrame key={`${scene.id}-${scene.motion}-${scene.assetId}`} src={ed.srcOf(scene.assetId)} subtitle={sceneSubtitle(scene)} motion={scene.motion} animate />
              </Stage>
            </div>
            <p className="m-0 mt-3 text-center text-[15px] text-muted">장면 {scene.order} 미리보기</p>
          </aside>
        </div>
      ) : (
        <Finish ed={ed} go={go} />
      )}
    </div>
  )
}

function QuestionBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <label htmlFor={id} className="text-[26px] font-bold leading-snug tracking-[-0.01em]">
        {title}
      </label>
      {children}
    </section>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-2 text-[16px]" role="status" aria-live="polite">
      {state === 'idle' && <span className="text-muted">고치면 자동으로 저장돼요</span>}
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장하는 중…</span>}
      {state === 'saved' && <span className="font-semibold text-accent">✓ 저장됨</span>}
      {state === 'error' && (
        <>
          <span className="font-semibold text-danger-ink">저장하지 못했어요</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-2 font-bold underline underline-offset-4 focus-visible:outline-[3px] focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function MotionChoice({ value, onChange }: { value: string; onChange: (m: (typeof MOTIONS)[number]['value']) => void }) {
  const name = useId()
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
      <legend className="mb-4 p-0 text-[26px] font-bold leading-snug tracking-[-0.01em]">카메라는 어떻게 움직일까요?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {MOTIONS.map((m) => (
          <label
            key={m.value}
            className={cx(
              'flex min-h-14 cursor-pointer items-center gap-3 rounded-[16px] border-2 px-5 text-[18px] transition-colors',
              'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === m.value ? 'border-accent bg-accent-soft font-bold' : 'border-edge bg-surface hover:border-ink',
            )}
          >
            <input type="radio" name={name} value={m.value} checked={value === m.value} onChange={() => onChange(m.value)} className="sr-only" />
            <span aria-hidden="true" className={cx('grid size-5 place-items-center rounded-full border-2', value === m.value ? 'border-accent' : 'border-edge')}>
              {value === m.value && <span className="size-2.5 rounded-full bg-accent" />}
            </span>
            {m.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Finish({ ed, go }: { ed: Editor; go: (i: number) => void }) {
  const name = useId()
  const missing = ed.scenes.filter((s) => !s.assetId)
  return (
    <div className="flex flex-col gap-12">
      <Question hint="마음에 들지 않는 장면은 ‘고치기’로 돌아가서 다시 손볼 수 있어요.">이제 영상으로 만들어 볼까요?</Question>

      <Length seconds={ed.totalSeconds} text={`장면 ${ed.scenes.length}개, 모두 합쳐 약 ${formatSec(ed.totalSeconds)}예요.`} />

      {missing.length > 0 && (
        <Note title="사진이 없는 장면이 있어요">
          장면 {missing.map((s) => s.order).join(', ')}번에 사진을 넣어 주세요. 사진이 모두 있어야 영상을 만들 수 있어요.
        </Note>
      )}

      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {ed.scenes.map((s, i) => {
          const src = ed.srcOf(s.assetId)
          return (
            <li key={s.id} className="flex items-center gap-4 rounded-[18px] border-2 border-line bg-surface p-4">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-panel-2 text-[13px] text-muted">
                {src ? <img src={src} alt="" className="size-full object-cover" /> : '사진 없음'}
              </span>
              <p className="m-0 line-clamp-2 min-w-0 flex-1 text-[17px] leading-snug">
                <b className="mr-2">{s.order}</b>
                {s.text}
              </p>
              <button type="button" className={btn.quiet} onClick={() => go(i)}>
                고치기
              </button>
            </li>
          )
        })}
      </ol>

      <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
        <legend className="mb-4 p-0 text-[26px] font-bold leading-snug tracking-[-0.01em]">어느 쪽으로 만들까요?</legend>
        <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="grid gap-3 sm:grid-cols-2">
          {MOTION_QUALITIES.map((q) => (
            <label
              key={q.value}
              className={cx(
                'flex cursor-pointer flex-col gap-1 rounded-[16px] border-2 px-5 py-4 transition-colors',
                'has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
                ed.motionQuality === q.value ? 'border-accent bg-accent-soft' : 'border-edge bg-surface hover:border-ink',
                ed.renderPending && 'cursor-not-allowed opacity-50',
              )}
            >
              <input type="radio" name={name} value={q.value} checked={ed.motionQuality === q.value} disabled={ed.renderPending} onChange={() => ed.changeQuality(q.value)} className="sr-only" />
              <span className="text-[19px] font-bold">{q.label}</span>
              <span className="text-[15px] leading-snug text-muted">{q.description}</span>
            </label>
          ))}
        </div>
        <p id={ed.qualityHintId} className="sr-only">
          {ed.qualityDescription}
        </p>
      </fieldset>

      <div className="flex flex-col gap-4 border-t-2 border-line pt-8">
        <p className="m-0 text-[17px] text-muted" aria-live="polite">
          {ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만들어요.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 써요.' : '음성과 자막을 입혀서 MP4로 만들어요.'}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
            <Clapperboard aria-hidden="true" className="size-5" />
            {ed.renderPending ? '시작하는 중…' : '영상 만들기'}
          </button>
          <button type="button" className={btn.quiet} onClick={() => go(ed.scenes.length - 1)}>
            <ArrowLeft aria-hidden="true" className="size-5" />
            마지막 장면으로
          </button>
        </div>
      </div>
    </div>
  )
}
