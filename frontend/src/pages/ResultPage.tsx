import { Download, Pencil, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { USE_MOCK, assetUrl, isApiError, videoUrl } from '../api'
import { useRender } from '../api/queries/useRender'
import type { Project, RenderStage } from '../api/types'
import { ErrorBanner } from '../components/ErrorBanner'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProjectShell } from '../components/ProjectShell'
import { SceneFrame } from '../components/SceneFrame'
import { StageList, type StageItem } from '../components/StageList'
import { formatSec } from '../lib/duration'
import { VIDEO_HEIGHT, VIDEO_WIDTH, sceneSubtitle } from '../lib/render'
import { btnPrimary, btnSecondary, cx } from '../lib/ui'

const RENDER_STAGES: { key: RenderStage; label: string }[] = [
  { key: 'tts', label: '음성 만들기' },
  { key: 'subtitle', label: '자막 맞추기' },
  { key: 'render', label: '영상 합치기' },
]

export function ResultPage() {
  const { id = '' } = useParams()
  return <ProjectShell id={id} view="result">{(project) => <Result project={project} />}</ProjectShell>
}

function Result({ project }: { project: Project }) {
  if (project.status === 'done' && project.video) return <Done project={project} video={project.video} />
  return <Rendering project={project} />
}

function Rendering({ project }: { project: Project }) {
  const render = useRender(project.id)
  const failed = project.status === 'error' ? (project.error?.stage as RenderStage | undefined) : undefined
  const current = failed ?? (project.progress?.stage as RenderStage | undefined) ?? 'tts'
  const currentIdx = RENDER_STAGES.findIndex((s) => s.key === current)
  const failedLabel = RENDER_STAGES.find((s) => s.key === failed)?.label

  const items: StageItem[] = RENDER_STAGES.map((s, i) => ({
    key: s.key,
    label: s.label,
    state: i < currentIdx ? 'done' : i > currentIdx ? 'pending' : failed ? 'failed' : 'active',
    percent: !failed && i === currentIdx ? (project.progress?.percent ?? 0) : undefined,
  }))

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-2xl font-bold">{failed ? '영상을 만들지 못했습니다' : '영상을 만들고 있습니다'}</h1>
        <p className="m-0 mt-1 text-sm text-muted" aria-live="polite">
          {failed ? `${failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : project.progress?.message ?? '잠시만 기다려 주세요.'}
        </p>
      </div>

      {failed && project.error && (
        <ErrorBanner
          message={project.error.message}
          actions={
            <>
              <button type="button" className={btnPrimary} disabled={render.isPending} onClick={() => render.mutate(failed)}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {render.isPending ? '요청 중…' : `${failedLabel}부터 다시 시도`}
              </button>
              <Link to={`/projects/${project.id}/scenes`} className={btnSecondary}>
                <Pencil aria-hidden="true" className="size-4" />
                장면 다시 편집
              </Link>
            </>
          }
        />
      )}
      {render.isError && (
        <ErrorBanner message={isApiError(render.error) ? render.error.message : '다시 시도하지 못했습니다.'} />
      )}

      <StageList items={items} />
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const first = project.scenes[0]
  const firstAsset = first?.assetId ? project.assets.find((a) => a.id === first.assetId) : undefined
  const poster = firstAsset ? assetUrl(firstAsset) : undefined

  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] md:justify-center">
      <div className="mx-auto w-full max-w-[300px] md:max-w-none">
        <PhoneFrame label="완성된 영상">
          {videoFailed ? (
            <SceneFrame src={poster ?? null} subtitle={first ? sceneSubtitle(first) : ''} />
          ) : (
            <video
              key={video.url}
              src={videoUrl(project.id)}
              poster={poster}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
              className="absolute inset-0 size-full bg-black object-contain"
            />
          )}
        </PhoneFrame>
      </div>

      <section aria-labelledby="done-title" className="flex flex-col gap-5">
        <div>
          <h1 id="done-title" className="m-0 text-2xl font-bold">
            영상이 완성되었습니다
          </h1>
          <p className="m-0 mt-2 inline-flex flex-wrap gap-x-2 rounded-control border border-line bg-surface px-3 py-1.5 text-sm tabular-nums">
            <span>
              {VIDEO_WIDTH}×{VIDEO_HEIGHT}
            </span>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <span>MP4</span>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <span>{formatSec(video.durationSec)}</span>
          </p>
        </div>

        {videoFailed && (
          <p role="status" className="m-0 rounded-control border border-hook/40 bg-hook/8 p-3 text-sm">
            {USE_MOCK
              ? 'mock 모드라 샘플 영상 파일(public/mock/sample.mp4)이 없어 첫 장면 이미지로 대신 보여 줍니다.'
              : '영상을 불러오지 못했습니다. 새로고침해 보거나 장면 편집에서 다시 만들어 주세요.'}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={videoFailed ? undefined : videoUrl(project.id, true)}
            download={videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={videoFailed || undefined}
            className={cx(btnPrimary, videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-4" />
            MP4 다운로드
          </a>
          <Link to={`/projects/${project.id}/scenes`} className={btnSecondary}>
            <Pencil aria-hidden="true" className="size-4" />
            장면 다시 편집
          </Link>
        </div>

        <p className="m-0 text-sm text-muted">
          휴대폰으로 옮길 때 메신저의 &lsquo;동영상&rsquo;이 아니라 &lsquo;파일&rsquo;로 보내야 화질이 유지됩니다.
        </p>
      </section>
    </div>
  )
}
