// 렌더·결과 화면의 동작: 렌더 단계, 실패 재시도, 재생·다운로드, 다른 품질로 다시 만들기
import { useState } from 'react'
import { assetUrl, isApiError, videoUrl } from '../../api'
import { useRender } from '../../api/queries/useRender'
import type { MotionQuality, Project, RenderStage } from '../../api/types'
import type { StageItem } from '../../components/StageList'
import { loadMotionQuality, saveMotionQuality } from '../../lib/motionQuality'
import { sceneSubtitle } from '../../lib/render'

export const RENDER_STAGES: { key: RenderStage; label: string }[] = [
  { key: 'tts', label: '음성 만들기' },
  { key: 'subtitle', label: '자막 맞추기' },
  { key: 'render', label: '영상 합치기' },
]

/** 영상이 완성돼 있으면 done, 아니면 진행·실패 화면 */
export function resultMode(project: Project): 'done' | 'rendering' {
  return project.status === 'done' && project.video ? 'done' : 'rendering'
}

export function useRenderingView(project: Project) {
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

  return {
    failed,
    failedLabel,
    items,
    currentIdx,
    message: project.progress?.message ?? null,
    errorMessage: failed && project.error ? project.error.message : null,
    retry: () => failed && render.mutate({ from: failed, motionQuality: loadMotionQuality(project.id) }),
    retryPending: render.isPending,
    retryError: render.isError
      ? isApiError(render.error)
        ? render.error.message
        : '다시 시도하지 못했습니다.'
      : null,
  }
}

export function useDoneView(project: Project, video: NonNullable<Project['video']>) {
  const [videoFailed, setVideoFailed] = useState(false)
  // 렌더가 끝나 이 화면이 다시 열릴 때마다 새 값이 되어, 다시 만든 영상을 캐시가 아닌 서버에서 읽는다
  const [version] = useState(() => Date.now())
  const render = useRender(project.id)
  const other: MotionQuality = loadMotionQuality(project.id) === 'fast' ? 'smooth' : 'fast'

  const first = project.scenes[0]
  const firstAsset = first?.assetId ? project.assets.find((a) => a.id === first.assetId) : undefined

  return {
    durationSec: video.durationSec,
    videoKey: video.url,
    videoSrc: videoUrl(project.id, false, version),
    downloadHref: videoUrl(project.id, true, version),
    videoFailed,
    setVideoFailed,
    poster: firstAsset ? assetUrl(firstAsset) : undefined,
    firstSubtitle: first ? sceneSubtitle(first) : '',
    /** 지금과 다른 쪽 품질 */
    other,
    remake: () => {
      saveMotionQuality(project.id, other)
      // 음성·자막은 그대로 두고 합성만 새로 한다(통합기획서 6-2)
      render.mutate({ from: 'render', motionQuality: other })
    },
    remakePending: render.isPending,
    remakeError: render.isError
      ? isApiError(render.error)
        ? render.error.message
        : '다시 만들기를 시작하지 못했습니다.'
      : null,
  }
}
