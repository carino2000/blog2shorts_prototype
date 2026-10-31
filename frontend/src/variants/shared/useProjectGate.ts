// 프로젝트 화면 공통 관문: 로딩·만료·조회 실패·화면 이동·단계 표시. 모양은 시안의 Shell이 정한다.
import { isApiError, isNotFound } from '../../api'
import { isBusy, useProject } from '../../api/queries/useProject'
import type { Project } from '../../api/types'
import { allowedViews, defaultView, furthestView, viewPath, type View } from '../../lib/projectView'
import { useVariantTo } from '../useVariant'

export type StepKey = 'input' | 'script' | 'scenes' | 'result'

export const STEPS: { key: StepKey; label: string }[] = [
  { key: 'input', label: '입력' },
  { key: 'script', label: '대본' },
  { key: 'scenes', label: '장면 편집' },
  { key: 'result', label: '영상' },
]

// 처리 중 화면은 대본을 만드는 중이므로 '대본' 칸을 현재로 본다
const STEP_OF: Record<View, StepKey> = { processing: 'script', script: 'script', scenes: 'scenes', result: 'result' }

export interface StepItem {
  key: StepKey
  label: string
  index: number
  state: 'done' | 'current' | 'upcoming'
  /** 클릭으로 갈 수 있으면 주소, 아니면 null */
  href: string | null
}

export type Gate =
  | { kind: 'loading' }
  | { kind: 'expired' }
  | { kind: 'error'; message: string; retry: () => void }
  | { kind: 'redirect'; to: string }
  | { kind: 'ready'; project: Project }

export function useProjectGate(id: string, view: View) {
  const query = useProject(id)
  const vto = useVariantTo()
  const project = query.data
  const current = STEP_OF[view]
  const busy = isBusy(project?.status)
  const reached = project ? STEP_OF[furthestView(project)] : undefined

  const currentIdx = STEPS.findIndex((s) => s.key === current)
  const reachedIdx = Math.max(currentIdx, reached ? STEPS.findIndex((s) => s.key === reached) : -1)
  const steps: StepItem[] = STEPS.map((s, i) => {
    const canGo = i !== currentIdx && !busy && i <= reachedIdx && (s.key === 'input' || !!project)
    return {
      ...s,
      index: i + 1,
      state: i === currentIdx ? 'current' : i < currentIdx ? 'done' : 'upcoming',
      href: canGo ? vto(s.key === 'input' ? '/' : `/projects/${id}/${s.key}`) : null,
    }
  })

  let gate: Gate
  if (query.isError && (isNotFound(query.error) || !project)) {
    gate = isNotFound(query.error)
      ? { kind: 'expired' }
      : {
          kind: 'error',
          message: isApiError(query.error) ? query.error.message : '잠시 후 다시 시도해 주세요.',
          retry: () => void query.refetch(),
        }
  } else if (!project) {
    gate = { kind: 'loading' }
  } else if (!allowedViews(project).includes(view)) {
    gate = { kind: 'redirect', to: vto(viewPath(id, defaultView(project))) }
  } else {
    gate = { kind: 'ready', project }
  }

  return { gate, steps, current, busy }
}
