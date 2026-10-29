import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '..'
import { queryKeys } from './keys'

/** 대본·장면 다시 만들기. 성공하면 프로젝트를 다시 조회해 폴링을 시작한다 */
export function useRegenerate(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.regenerateProject(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.project(projectId) }),
  })
}
