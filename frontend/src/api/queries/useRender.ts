import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '..'
import type { RenderStage } from '../types'
import { queryKeys } from './keys'

/** 렌더 시작. from을 주면 그 단계부터 다시 시도 */
export function useRender(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (from?: RenderStage) => api.startRender(projectId, from),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
  })
}
