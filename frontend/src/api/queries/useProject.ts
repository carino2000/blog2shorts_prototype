import { useQuery } from '@tanstack/react-query'
import { api, isApiError } from '..'
import type { ProjectStatus } from '../types'
import { queryKeys } from './keys'

export const POLL_MS = 1500
const BUSY: ProjectStatus[] = ['extracting', 'scripting', 'rendering']

export function isBusy(status: ProjectStatus | undefined): boolean {
  return status !== undefined && BUSY.includes(status)
}

/** 진행 중 상태에서는 1.5초마다 다시 조회하고, 끝나면 멈춘다 */
export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.getProject(id),
    refetchInterval: (query) => (isBusy(query.state.data?.status) ? POLL_MS : false),
    // 404(작업 만료)·4xx는 다시 시도해도 같다
    retry: (count, error) => !(isApiError(error) && error.status >= 400 && error.status < 500) && count < 2,
  })
}
