import { ChevronDown, Clapperboard, ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { assetUrl, isApiError } from '../api'
import { useRender } from '../api/queries/useRender'
import { useUpdateScenes } from '../api/queries/useUpdateScenes'
import type { Project } from '../api/types'
import { AssetPicker } from '../components/AssetPicker'
import { DurationMeter } from '../components/DurationMeter'
import { ErrorBanner } from '../components/ErrorBanner'
import { MediaGrid } from '../components/MediaGrid'
import { ProjectShell } from '../components/ProjectShell'
import { SaveStatus } from '../components/SaveStatus'
import { SceneCard } from '../components/SceneCard'
import { ScenePreview } from '../components/ScenePreview'
import { totalSec } from '../lib/duration'
import { WIDE_QUERY, useMediaQuery } from '../lib/useMediaQuery'
import { btnPrimary } from '../lib/ui'

export function ScenesPage() {
  const { id = '' } = useParams()
  return (
    <ProjectShell id={id} view="scenes" wide>
      {(project) => <ScenesEditor project={project} />}
    </ProjectShell>
  )
}

function ScenesEditor({ project }: { project: Project }) {
  const navigate = useNavigate()
  const updates = useUpdateScenes(project.id)
  const render = useRender(project.id)
  const [selectedId, setSelectedId] = useState(project.scenes[0]?.id ?? '')
  const [renderError, setRenderError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const isWide = useMediaQuery(WIDE_QUERY)

  const scenes = updates.applyDrafts(project.scenes)
  const assetById = new Map(project.assets.map((a) => [a.id, a]))
  const srcOf = (assetId: string | null) => {
    const a = assetId ? assetById.get(assetId) : undefined
    return a ? assetUrl(a) : null
  }

  // 한 번 렌더된 뒤 문구를 고친 장면 = 음성을 다시 만드는 장면 (durationSec이 null로 돌아감)
  const everRendered = project.scenes.some((s) => s.durationSec !== null)
  const voiceRedo = new Set(everRendered ? scenes.filter((s) => s.durationSec === null).map((s) => s.id) : [])
  const missingCount = scenes.filter((s) => !s.assetId).length
  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0]
  const selectIndex = (i: number) => {
    const next = scenes[Math.max(0, Math.min(scenes.length - 1, i))]
    if (next) setSelectedId(next.id)
  }
  const pickAsset = (assetId: string) => {
    if (selected) updates.change(selected.id, { assetId }, { immediate: true })
  }
  const preview = (className?: string) =>
    selected && (
      <ScenePreview
        scene={selected}
        total={scenes.length}
        imageSrc={srcOf(selected.assetId)}
        onPrev={() => selectIndex(selected.order - 2)}
        onNext={() => selectIndex(selected.order)}
        className={className}
      />
    )
  const mediaGrid = (
    <MediaGrid projectId={project.id} assets={project.assets} scenes={scenes} selectedScene={selected} onPick={pickAsset} />
  )
  const allActual = scenes.every((s) => s.durationSec !== null)

  async function startRender() {
    setRenderError(null)
    try {
      await updates.flush()
      await render.mutateAsync(undefined)
      navigate(`/projects/${project.id}/result`)
    } catch (e) {
      setRenderError(isApiError(e) ? e.message : '영상 만들기를 시작하지 못했습니다.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold">장면 편집</h1>
          <p className="m-0 text-sm text-muted">문구·이미지·모션을 고치면 자동으로 저장됩니다.</p>
        </div>
        <SaveStatus state={updates.saveState} onRetry={() => void updates.flush().catch(() => undefined)} />
      </div>

      {project.needsUpload && (
        <div role="note" className="flex items-start gap-3 rounded-card border border-hook/40 bg-hook/8 p-4 text-sm">
          <ImagePlus aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-hook" />
          <p className="m-0">이 글에는 이미지가 없습니다. 장면에 쓸 이미지를 올려주세요.</p>
        </div>
      )}
      {updates.error && <ErrorBanner title="저장하지 못했습니다" message={updates.error.message} />}
      {renderError && <ErrorBanner message={renderError} />}

      {/* 767px 이하: 미리보기는 위쪽 접이식(기본 접힘, 선택 장면 썸네일만) */}
      {selected && (
        <details className="group rounded-card border border-line bg-surface md:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-3 py-2">
            <span className="aspect-[9/16] w-7 shrink-0 overflow-hidden rounded bg-bg">
              {srcOf(selected.assetId) && <img src={srcOf(selected.assetId) ?? ''} alt="" className="size-full object-cover" />}
            </span>
            <span className="flex-1 text-sm font-medium">미리보기 · 장면 #{selected.order}</span>
            <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="mx-auto w-full max-w-[260px] px-3 pb-4">{preview()}</div>
        </details>
      )}

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] xl:grid-cols-[400px_minmax(0,1fr)_320px]">
        <section aria-labelledby="scene-list-title" className="flex flex-col gap-3">
          <h2 id="scene-list-title" className="sr-only">
            장면 목록
          </h2>
          <div className="rounded-card border border-line bg-surface p-4">
            <DurationMeter seconds={totalSec(scenes)} actual={allActual} />
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {scenes.map((scene) => (
              <li key={scene.id}>
                <SceneCard
                  scene={scene}
                  asset={scene.assetId ? assetById.get(scene.assetId) : undefined}
                  imageSrc={srcOf(scene.assetId)}
                  selected={scene.id === selectedId}
                  voiceRedo={voiceRedo.has(scene.id)}
                  onSelect={() => setSelectedId(scene.id)}
                  onText={(text) => updates.change(scene.id, { text })}
                  onMotion={(motion) => updates.change(scene.id, { motion }, { immediate: true })}
                  onPickImage={() => {
                    if (!isWide) setPickerOpen(true)
                  }}
                />
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="미리보기" className="sticky top-4 hidden md:block">
          {/* 높이 기준 맞춤: 화면 높이 안에 휴대폰 프레임이 다 들어오게 */}
          <div className="mx-auto w-full max-w-[min(100%,max(180px,calc((100dvh-320px)*9/16)))]">{preview()}</div>
        </section>

        <aside aria-labelledby="media-title" className="sticky top-4 hidden flex-col gap-3 rounded-card border border-line bg-surface p-4 xl:flex">
          <h2 id="media-title" className="m-0 text-base font-semibold">
            이미지
          </h2>
          {mediaGrid}
        </aside>
      </div>

      {!isWide && (
        <AssetPicker open={pickerOpen} title={selected ? `장면 #${selected.order} 이미지` : '이미지'} onClose={() => setPickerOpen(false)}>
          <MediaGrid
            projectId={project.id}
            assets={project.assets}
            scenes={scenes}
            selectedScene={selected}
            onPick={(assetId) => {
              pickAsset(assetId)
              setPickerOpen(false)
            }}
          />
        </AssetPicker>
      )}

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-muted" aria-live="polite">
          {missingCount > 0 ? (
            <span className="text-danger-ink">이미지가 없는 장면 {missingCount}개 · 모든 장면에 이미지를 넣어야 영상을 만들 수 있습니다.</span>
          ) : voiceRedo.size > 0 ? (
            <>문구를 고친 장면 {voiceRedo.size}개만 음성을 다시 만듭니다.</>
          ) : everRendered ? (
            <>문구를 고치지 않은 장면은 만들어 둔 음성을 그대로 씁니다.</>
          ) : (
            <>장면 {scenes.length}개로 음성·자막을 입혀 MP4를 만듭니다.</>
          )}
        </p>
        <button
          type="button"
          className={btnPrimary}
          disabled={missingCount > 0 || render.isPending || updates.saveState === 'error'}
          onClick={() => void startRender()}
        >
          <Clapperboard aria-hidden="true" className="size-4" />
          {render.isPending ? '시작하는 중…' : '영상 만들기'}
        </button>
      </div>
    </div>
  )
}
