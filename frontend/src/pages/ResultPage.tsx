import { Download, Pencil, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { assetUrl, isApiError, videoUrl } from '../api'
import { useRender } from '../api/queries/useRender'
import type { MotionQuality, Project, RenderStage } from '../api/types'
import { ErrorBanner } from '../components/ErrorBanner'
import { PhoneFrame } from '../components/PhoneFrame'
import { ProjectShell } from '../components/ProjectShell'
import { SceneFrame } from '../components/SceneFrame'
import { StageList, type StageItem } from '../components/StageList'
import { formatSec } from '../lib/duration'
import { loadMotionQuality, saveMotionQuality } from '../lib/motionQuality'
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
              <button type="button" className={btnPrimary} disabled={render.isPending} onClick={() => render.mutate({ from: failed, motionQuality: loadMotionQuality(project.id) })}>
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
  // 렌더가 끝나 이 화면이 다시 열릴 때마다 새 값이 되어, 다시 만든 영상을 캐시가 아닌 서버에서 읽는다
  const [version] = useState(() => Date.now())
  const render = useRender(project.id)
  const other: MotionQuality = loadMotionQuality(project.id) === 'fast' ? 'smooth' : 'fast'
  const OtherIcon = other === 'smooth' ? Sparkles : Zap

  function remake() {
    saveMotionQuality(project.id, other)
    // 음성·자막은 그대로 두고 합성만 새로 한다(통합기획서 6-2)
    render.mutate({ from: 'render', motionQuality: other })
  }
  const first = project.scenes[0]
  const firstAsset = first?.assetId ? project.assets.find((a) => a.id === first.assetId) : undefined
  const poster = firstAsset ? assetUrl(firstAsset) : undefined

  return (
    <div className="mx-auto grid max-w-3xl items-start gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[300px] md:max-w-none">
        <PhoneFrame label="완성된 영상">
          {videoFailed ? (
            <SceneFrame src={poster ?? null} subtitle={first ? sceneSubtitle(first) : ''} />
          ) : (
            <video
              key={video.url}
              src={videoUrl(project.id, false, version)}
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
            영상을 불러오지 못했습니다. 새로고침해 보거나 장면 편집에서 다시 만들어 주세요.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={videoFailed ? undefined : videoUrl(project.id, true, version)}
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

        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <p className="m-0 text-sm">
            {other === 'smooth' ? '움직임을 더 매끄럽게 만들 수 있어요. 조금 더 걸립니다.' : '영상을 더 빨리 다시 만들 수 있어요. 움직임이 조금 떨릴 수 있습니다.'}{' '}
            <span className="text-muted">음성은 다시 만들지 않아요.</span>
          </p>
          <div>
            <button type="button" className={btnSecondary} disabled={render.isPending} onClick={remake}>
              <OtherIcon aria-hidden="true" className="size-4" />
              {render.isPending ? '요청 중…' : `${other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
            </button>
          </div>
          {render.isError && (
            <ErrorBanner message={isApiError(render.error) ? render.error.message : '다시 만들기를 시작하지 못했습니다.'} />
          )}
        </div>

        <p className="m-0 text-sm text-muted">
          휴대폰으로 옮길 때 메신저의 &lsquo;동영상&rsquo;이 아니라 &lsquo;파일&rsquo;로 보내야 화질이 유지됩니다.
        </p>
      </section>
    </div>
  )
}
