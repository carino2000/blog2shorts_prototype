import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '..'
import type { MotionQuality, RenderStage } from '../types'
import { queryKeys } from './keys'

/** 렌더 시작. from을 주면 그 단계부터 다시 시도. 품질은 재시도에도 함께 보낸다 */
export function useRender(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ from, motionQuality }: { from?: RenderStage; motionQuality: MotionQuality }) =>
      api.startRender(projectId, from, motionQuality),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
  })
}
