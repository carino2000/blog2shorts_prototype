// 처리 중 화면(추출·대본 생성)의 동작
import { isApiError } from '../../api'
import { useRegenerate } from '../../api/queries/useRegenerate'
import type { Project } from '../../api/types'
import type { StageItem } from '../../components/StageList'

export type ProcessingAction = 'text' | 'retry' | 'home'

export function useProcessing(project: Project) {
  const regenerate = useRegenerate(project.id)
  const { status, progress, error, source, assets } = project

  const extractDone = source.blocks.length > 0
  const failedStage = status === 'error' ? error?.stage : undefined

  const stages: StageItem[] = [
    {
      key: 'extract',
      label: extractDone || failedStage === 'extract' ? '글 구조 읽기' : '글 구조 읽는 중',
      state: failedStage === 'extract' ? 'failed' : extractDone ? 'done' : 'active',
      percent: progress?.stage === 'extract' ? progress.percent : undefined,
    },
    {
      key: 'script',
      label: status === 'scripting' ? '대본과 장면 만드는 중' : '대본과 장면 만들기',
      state: failedStage === 'script' ? 'failed' : status === 'scripting' ? 'active' : 'pending',
      percent: progress?.stage === 'script' ? progress.percent : undefined,
    },
  ]

  const action: ProcessingAction | null = !error
    ? null
    : error.code === 'EXTRACT_FAILED' || error.code === 'POST_NOT_FOUND'
      ? 'text'
      : error.code === 'LLM_FAILED'
        ? 'retry'
        : 'home'

  return {
    failed: status === 'error',
    title: source.title ?? '직접 입력한 본문',
    message: progress?.message ?? null,
    stages,
    extractDone,
    paragraphs: source.blocks.filter((b) => b.type !== 'image').length,
    images: assets.filter((a) => a.origin === 'blog'),
    error: error ? { code: error.code, message: error.message } : null,
    action,
    retry: () => regenerate.mutate(),
    retryPending: regenerate.isPending,
    retryError: regenerate.isError
      ? isApiError(regenerate.error)
        ? regenerate.error.message
        : '다시 시도하지 못했습니다.'
      : null,
  }
}
