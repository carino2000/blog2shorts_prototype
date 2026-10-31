import { Clapperboard, ImagePlus, ImageOff, Loader2, Mic, Upload } from 'lucide-react'
import { useEffect, useId } from 'react'
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
import { Body, Shell, Topbar } from './Shell'
import { btn, field } from './styles'
import { Alert, Kbd, Meter, Mono, Panel, RoleChip } from './ui'

type Editor = ReturnType<typeof useScenesEditor>

export function Scenes() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="scenes">
      {(project) => <Table project={project} />}
    </Shell>
  )
}

function Table({ project }: { project: Project }) {
  const ed = useScenesEditor(project)
  const upload = useAssetUpload(project.id, ed.pickAsset)
  const rows = withTimes(ed.scenes)
  const sel = ed.selected
  const selRow = rows.find((r) => r.scene.id === sel?.id)
  const title = project.source.title ?? '직접 입력한 본문'

  // 단축키: J/K 장면 이동, E 문구 편집, Ctrl+Enter 영상 만들기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (ed.canRender) {
          e.preventDefault()
          void ed.startRender()
        }
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      const k = e.key.toLowerCase()
      if (k === 'j') ed.next()
      else if (k === 'k') ed.prev()
      else if (k === 'e') {
        e.preventDefault()
        document.querySelector<HTMLTextAreaElement>('[data-scene-text][data-selected="true"]')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <Topbar
        crumbs={['작업', title, '장면 편집']}
        actions={
          <>
            <Saved state={ed.saveState} onRetry={ed.retrySave} />
            <QualityToggle ed={ed} />
            <button type="button" data-act="render" className={btn.primary} disabled={!ed.canRender} onClick={() => void ed.startRender()}>
              <Clapperboard aria-hidden="true" className="size-4" />
              {ed.renderPending ? '시작하는 중…' : '영상 만들기'}
              <span className="hidden xl:block">
                <Kbd className="border-white/30 bg-white/15 text-white">Ctrl ↵</Kbd>
              </span>
            </button>
          </>
        }
      />
      <Body className="max-w-[1320px]">
        {ed.uploadNotice && (
          <Alert tone="warn" icon={ImagePlus} title="이 글에는 이미지가 없습니다.">
            장면에 쓸 이미지를 올려 주세요. 오른쪽 인스펙터의 업로드 칸에서 올릴 수 있습니다.
          </Alert>
        )}
        {ed.saveError && <Alert title="저장하지 못했습니다">{ed.saveError}</Alert>}
        {ed.renderError && <Alert>{ed.renderError}</Alert>}

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            title={`장면 ${ed.scenes.length}개`}
            aside={
              <p className="m-0 hidden items-center gap-1.5 text-[12px] text-muted sm:flex">
                <Kbd>J</Kbd>
                <Kbd>K</Kbd> 이동 <Kbd>E</Kbd> 편집 <Kbd>?</Kbd> 도움말
              </p>
            }
          >
            <div className="border-b border-line px-3.5 py-2.5">
              <Meter seconds={ed.totalSeconds} actual={ed.allActual} />
            </div>
            <div role="table" aria-label="장면 표">
              <div role="row" className="cmd-th hidden grid-cols-[2.25rem_2.5rem_5rem_minmax(0,1fr)_4.5rem_8.5rem] items-center gap-x-3 border-b border-line bg-panel-2 px-3.5 py-1.5 sm:grid">
                <span role="columnheader">#</span>
                <span role="columnheader">사진</span>
                <span role="columnheader">역할</span>
                <span role="columnheader">문구</span>
                <span role="columnheader" className="text-right">
                  길이
                </span>
                <span role="columnheader">움직임</span>
              </div>
              <ol className="m-0 list-none p-0">
                {rows.map(({ scene, start }) => {
                  const on = scene.id === sel?.id
                  const src = ed.srcOf(scene.assetId)
                  const missing = !scene.assetId
                  return (
                    <li
                      key={scene.id}
                      role="row"
                      data-scene-select
                      aria-current={on ? 'true' : undefined}
                      onClick={() => ed.select(scene.id)}
                      onFocusCapture={() => ed.select(scene.id)}
                      className={cx(
                        'grid grid-cols-[2rem_2.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-b border-line px-3.5 py-2.5 transition-colors last:border-b-0',
                        'sm:grid-cols-[2.25rem_2.5rem_5rem_minmax(0,1fr)_4.5rem_8.5rem] sm:items-center',
                        on ? 'bg-accent-soft shadow-[inset_2px_0_0_var(--accent)]' : 'hover:bg-panel-2',
                      )}
                    >
                      <Mono role="cell" className="pt-1 text-[12px] font-semibold text-muted sm:pt-0">
                        {String(scene.order).padStart(2, '0')}
                      </Mono>
                      <span role="cell" className={cx('grid h-12 w-[1.75rem] place-items-center overflow-hidden rounded-[3px] border sm:h-[2.75rem]', missing ? 'border-dashed border-danger text-danger' : 'border-edge bg-bg')}>
                        {src ? <img src={src} alt="" className="size-full object-cover" /> : <ImageOff aria-hidden="true" className="size-3.5" />}
                      </span>
                      <span role="cell" className="hidden sm:block">
                        <RoleChip role={scene.role} />
                      </span>
                      <div role="cell" className="min-w-0">
                        <label className="sr-only" htmlFor={`${scene.id}-text`}>
                          장면 {scene.order} 문구
                        </label>
                        <textarea
                          id={`${scene.id}-text`}
                          data-scene-text
                          data-selected={on ? 'true' : undefined}
                          rows={2}
                          value={scene.text}
                          onChange={(e) => ed.setText(scene.id, e.target.value)}
                          className={cx(field, 'min-h-11 resize-none py-1.5 text-[13px] leading-snug')}
                        />
                        <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted sm:hidden">
                          <RoleChip role={scene.role} />
                          <Mono>{tc(start)}</Mono>
                          <Mono>{countChars(scene.text)}자</Mono>
                          {missing && <span className="font-semibold text-danger-ink">사진 없음</span>}
                        </p>
                      </div>
                      <Mono role="cell" className="hidden text-right text-[12px] text-muted sm:block">
                        {scene.durationSec !== null ? formatSec(scene.durationSec) : `~${formatSec(sceneSec(scene))}`}
                      </Mono>
                      <div role="cell" className="col-span-full col-start-3 sm:col-span-1 sm:col-start-auto">
                        <label className="sr-only" htmlFor={`${scene.id}-motion`}>
                          장면 {scene.order} 카메라 움직임
                        </label>
                        <select
                          id={`${scene.id}-motion`}
                          data-scene-motion
                          value={scene.motion}
                          onChange={(e) => ed.setMotion(scene.id, e.target.value as (typeof MOTIONS)[number]['value'])}
                          className={cx(field, 'min-h-11 py-0 text-[13px]')}
                        >
                          {MOTIONS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
            <p className="m-0 border-t border-line px-3.5 py-2 text-[12px] text-muted" aria-live="polite">
              {ed.missingCount > 0 ? <span className="font-semibold text-danger-ink">이미지가 없는 장면 {ed.missingCount}개 · 모두 채워야 영상을 만들 수 있습니다.</span> : ed.voiceRedo.size > 0 ? `문구를 고친 장면 ${ed.voiceRedo.size}개만 음성을 다시 만듭니다.` : ed.everRendered ? '고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.' : `장면 ${ed.scenes.length}개에 음성·자막을 입혀 MP4를 만듭니다.`}
            </p>
          </Panel>

          {sel && selRow && (
            <Panel title={`인스펙터 · 장면 ${sel.order}`} className="xl:sticky xl:top-16">
              <div className="flex flex-col gap-4 p-3.5">
                <div className="flex gap-4">
                  <div className="w-[8.5rem] shrink-0 overflow-hidden rounded-[6px] border border-edge shadow-[0_6px_18px_rgba(15,23,42,0.12)]">
                    <Stage>
                      <SceneFrame key={`${sel.id}-${sel.motion}-${sel.assetId}`} src={ed.srcOf(sel.assetId)} subtitle={sceneSubtitle(sel)} motion={sel.motion} animate />
                    </Stage>
                  </div>
                  <dl className="m-0 flex min-w-0 flex-1 flex-col gap-2 text-[12px]">
                    <div>
                      <dt className="cmd-th">역할</dt>
                      <dd className="m-0">
                        <RoleChip role={sel.role} />
                      </dd>
                    </div>
                    <div>
                      <dt className="cmd-th">구간</dt>
                      <dd className="m-0">
                        <Mono>
                          {tc(selRow.start)}–{tc(selRow.end)}
                        </Mono>
                      </dd>
                    </div>
                    <div>
                      <dt className="cmd-th">글자</dt>
                      <dd className="m-0">
                        <Mono>{countChars(sel.text)}</Mono>자
                      </dd>
                    </div>
                    {ed.voiceRedo.has(sel.id) && (
                      <div className="flex items-center gap-1 font-semibold text-accent">
                        <Mic aria-hidden="true" className="size-3.5" />
                        음성 다시 만듦
                      </div>
                    )}
                  </dl>
                </div>
                <div className="flex gap-2">
                  <button type="button" data-act="prev" className={cx(btn.ghost, 'flex-1')} onClick={ed.prev} disabled={sel.order <= 1}>
                    이전 <Kbd>K</Kbd>
                  </button>
                  <button type="button" data-act="next" className={cx(btn.ghost, 'flex-1')} onClick={ed.next} disabled={sel.order >= ed.scenes.length}>
                    다음 <Kbd>J</Kbd>
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t border-line pt-3">
                  <p className="cmd-th m-0">이미지</p>
                  <ul className="m-0 grid list-none grid-cols-4 gap-1.5 p-0 sm:grid-cols-6 xl:grid-cols-4">
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
                            className={cx('relative block aspect-square w-full overflow-hidden rounded-[4px] border-2 bg-bg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent', current ? 'border-accent' : 'border-transparent hover:border-edge')}
                          >
                            <img src={ed.srcOf(asset.id) ?? ''} alt="" loading="lazy" className="size-full object-cover" />
                            {others.length > 0 && <Mono className="absolute bottom-0 right-0 bg-ink/85 px-1 text-[10px] text-bg">{others.map((o) => `#${o}`).join(' ')}</Mono>}
                          </button>
                        </li>
                      )
                    })}
                    <li>
                      <label
                        className={cx(
                          'flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[4px] border-2 border-dashed text-[10px] font-semibold',
                          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent',
                          upload.error ? 'border-danger text-danger-ink' : 'border-edge text-muted hover:border-accent hover:text-accent',
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
                  <p className={cx('m-0 text-[11px] leading-snug', upload.error ? 'font-semibold text-danger-ink' : 'text-muted')} role={upload.error ? 'alert' : undefined}>
                    {upload.error ?? 'jpg·png·webp, 10MB 이하. 올리면 이 장면에 바로 적용됩니다.'}
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </Body>
    </>
  )
}

function Saved({ state, onRetry }: { state: Editor['saveState']; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-1.5 font-mono text-[12px]" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && <span className="text-muted">저장 중…</span>}
      {state === 'saved' && <span className="text-cta">저장됨</span>}
      {state === 'error' && (
        <>
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 font-sans font-semibold text-accent underline focus-visible:outline-2 focus-visible:outline-accent">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}

function QualityToggle({ ed }: { ed: Editor }) {
  const name = useId()
  return (
    <div role="radiogroup" aria-label="움직임 품질" aria-describedby={ed.qualityHintId} className="flex shrink-0 overflow-hidden rounded-control border border-edge bg-surface">
      {MOTION_QUALITIES.map((q, i) => (
        <label
          key={q.value}
          title={q.description}
          className={cx(
            'flex min-h-11 cursor-pointer items-center px-3 text-[12px] whitespace-nowrap has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-2px] has-[:focus-visible]:outline-accent',
            i > 0 && 'border-l border-edge',
            ed.motionQuality === q.value ? 'bg-ink font-semibold text-bg' : 'text-ink hover:bg-panel-2',
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
