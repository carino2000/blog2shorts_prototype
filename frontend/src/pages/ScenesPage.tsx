import { Clapperboard, ImagePlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { assetUrl, isApiError } from '../api'
import { useRender } from '../api/queries/useRender'
import { useUpdateScenes } from '../api/queries/useUpdateScenes'
import type { Project } from '../api/types'
import { DurationMeter } from '../components/DurationMeter'
import { ErrorBanner } from '../components/ErrorBanner'
import { ProjectShell } from '../components/ProjectShell'
import { SaveStatus } from '../components/SaveStatus'
import { SceneCard } from '../components/SceneCard'
import { totalSec } from '../lib/duration'
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

      <div className="grid items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)_320px]">
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
                  onPickImage={() => undefined}
                />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-muted" aria-live="polite">
          {missingCount > 0 ? (
            <span className="text-danger">이미지가 없는 장면 {missingCount}개 · 모든 장면에 이미지를 넣어야 영상을 만들 수 있습니다.</span>
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
