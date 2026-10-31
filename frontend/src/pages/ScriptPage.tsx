import { ArrowRight, BookOpen, ChevronDown, RotateCcw, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { assetUrl, isApiError } from '../api'
import { useRegenerate } from '../api/queries/useRegenerate'
import type { Block, Project, Scene } from '../api/types'
import { DurationMeter } from '../components/DurationMeter'
import { ErrorBanner } from '../components/ErrorBanner'
import { ProjectShell } from '../components/ProjectShell'
import { RoleBadge } from '../components/RoleBadge'
import { formatSec, sceneSec, totalSec } from '../lib/duration'
import { isRegenerateError } from '../lib/projectView'
import { ROLE_BAR, ROLE_LABEL } from '../lib/roles'
import { btnDanger, btnPrimary, btnSecondary, cx } from '../lib/ui'

export function ScriptPage() {
  const { id = '' } = useParams()
  return <ProjectShell id={id} view="script">{(project) => <ScriptView project={project} />}</ProjectShell>
}

function ScriptView({ project }: { project: Project }) {
  const [selected, setSelected] = useState<string | null>(null)
  const { scenes, analysis, source } = project
  const total = totalSec(scenes)
  const allRendered = scenes.length > 0 && scenes.every((s) => s.durationSec !== null)
  const selectedScene = scenes.find((s) => s.id === selected) ?? null

  const groups: { role: Scene['role']; scenes: Scene[] }[] = (['hook', 'body', 'cta'] as const).map((role) => ({
    role,
    scenes: scenes.filter((s) => s.role === role),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-page font-bold">대본 확인</h1>
        <p className="m-0 text-sm text-muted">
          {source.title ?? '직접 입력한 본문'} · 장면 {scenes.length}개. 문구는 다음 단계(장면 편집)에서 고칠 수 있습니다.
        </p>
      </div>

      {isRegenerateError(project) && project.error && (
        <ErrorBanner title="대본을 다시 만들지 못했습니다. 이전 대본을 그대로 보여 드립니다." message={project.error.message} />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="flex flex-col gap-5">
          {analysis && (
            <section aria-labelledby="summary-title" className="rounded-card border border-line bg-surface p-5">
              <h2 id="summary-title" className="m-0 flex items-center gap-2 text-section font-semibold">
                <Sparkles aria-hidden="true" className="size-4 text-accent-bright" />
                핵심 요약
              </h2>
              <p className="m-0 mt-2 text-sm leading-relaxed">{analysis.summary}</p>
              <ul className="m-0 mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-ink marker:text-accent-bright">
                {analysis.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="script-title" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
            <div className="flex flex-col gap-3">
              <h2 id="script-title" className="m-0 text-section font-semibold">
                대본
              </h2>
              <DurationMeter seconds={total} actual={allRendered} />
            </div>

            {groups.map(({ role, scenes: list }) => (
              <div key={role} className="flex gap-3">
                <span className={cx('w-1 shrink-0 rounded-full', ROLE_BAR[role])} aria-hidden="true" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} />
                    <span className="text-xs text-muted tabular-nums">
                      {formatSec(list.reduce((n, s) => n + sceneSec(s), 0))}
                    </span>
                  </div>
                  {list.map((scene) => (
                    <button
                      key={scene.id}
                      type="button"
                      aria-pressed={selected === scene.id}
                      onClick={() => setSelected(selected === scene.id ? null : scene.id)}
                      className={cx(
                        'flex min-h-11 w-full items-start gap-3 rounded-small border p-3 text-left text-sm leading-relaxed transition duration-200',
                        'focus-visible:outline-2 focus-visible:outline-accent-bright',
                        selected === scene.id ? 'border-accent-bright bg-accent-soft' : 'border-transparent hover:border-line hover:bg-bg',
                      )}
                    >
                      <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted tabular-nums">#{scene.order}</span>
                      <span className="flex-1">{scene.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="m-0 text-xs text-muted">장면을 누르면 원문에서 근거가 된 문단을 표시합니다.</p>
          </section>

          <Actions project={project} />
        </div>

        <SourcePanel blocks={source.blocks} project={project} selectedScene={selectedScene} />
      </div>
    </div>
  )
}

function Actions({ project }: { project: Project }) {
  const [confirming, setConfirming] = useState(false)
  const regenerate = useRegenerate(project.id)
  const edited = project.video !== null || project.status === 'done'

  return (
    <div className="flex flex-col gap-3">
      {confirming ? (
        <div role="group" aria-labelledby="regen-confirm" className="appear flex flex-col gap-3 rounded-control border border-danger-line bg-danger-soft p-4">
          <p id="regen-confirm" className="m-0 text-sm">
            대본과 장면을 새로 만듭니다. 장면 편집에서 고친 문구·이미지·모션{edited ? '과 만들어 둔 영상' : ''}은 사라집니다. 계속할까요?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnDanger}
              disabled={regenerate.isPending}
              onClick={() => regenerate.mutate(undefined, { onSettled: () => setConfirming(false) })}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {regenerate.isPending ? '요청 중…' : '네, 다시 만들기'}
            </button>
            <button type="button" className={btnSecondary} onClick={() => setConfirming(false)} disabled={regenerate.isPending}>
              취소
            </button>
          </div>
        </div>
      ) : null}
      {regenerate.isError && (
        <ErrorBanner message={isApiError(regenerate.error) ? regenerate.error.message : '다시 만들기를 요청하지 못했습니다.'} />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <button type="button" className={btnSecondary} onClick={() => setConfirming(true)} disabled={confirming}>
          <RotateCcw aria-hidden="true" className="size-4" />
          대본 다시 만들기
        </button>
        <Link to={`/projects/${project.id}/scenes`} className={btnPrimary}>
          장면 편집으로
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  )
}

function SourcePanel({ blocks, project, selectedScene }: { blocks: Block[]; project: Project; selectedScene: Scene | null }) {
  const usedBy = new Map<string, number[]>()
  for (const s of project.scenes) for (const b of s.sourceBlockIds) usedBy.set(b, [...(usedBy.get(b) ?? []), s.order])
  const highlight = new Set(selectedScene?.sourceBlockIds ?? [])

  const body = (
    <ol className="m-0 flex list-none flex-col gap-2 p-0">
      {blocks.map((block) => {
        const asset = block.assetId ? project.assets.find((a) => a.id === block.assetId) : undefined
        const orders = usedBy.get(block.id) ?? []
        const on = highlight.has(block.id)
        return (
          <li
            key={block.id}
            className={cx(
              'flex gap-3 rounded-small border p-2.5 text-sm transition duration-200',
              on ? 'border-accent-bright bg-accent-soft' : 'border-transparent',
            )}
          >
            <div className="min-w-0 flex-1">
              {block.type === 'image' ? (
                <figure className="m-0 flex items-center gap-3">
                  {asset && <img src={assetUrl(asset)} alt="" className="size-14 shrink-0 rounded-small object-cover" loading="lazy" />}
                  <figcaption className="text-muted">{block.text ?? '이미지'}</figcaption>
                </figure>
              ) : (
                <p className={cx('m-0 leading-relaxed', block.type === 'heading' && 'font-semibold')}>{block.text}</p>
              )}
            </div>
            {orders.length > 0 && (
              <span className="shrink-0 self-start text-xs text-muted tabular-nums" aria-label={`장면 ${orders.join(', ')}의 근거`}>
                {orders.map((o) => `#${o}`).join(' ')}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )

  const title = (
    <span className="flex items-center gap-2 text-card font-semibold">
      <BookOpen aria-hidden="true" className="size-4 text-muted" />
      원문
      {selectedScene && (
        <span className="text-xs font-normal text-accent">
          장면 #{selectedScene.order}({ROLE_LABEL[selectedScene.role]}) 근거 표시 중
        </span>
      )}
    </span>
  )

  return (
    <>
      <aside aria-label="원문" className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto rounded-card border border-line bg-surface p-4 lg:flex">
        {title}
        {body}
      </aside>
      <details className="group rounded-card border border-line bg-surface lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2">
          {title}
          <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">{body}</div>
      </details>
    </>
  )
}
