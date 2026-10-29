import { useQuery } from '@tanstack/react-query'
import { api } from '..'
import { queryKeys } from './keys'

/** 첫 화면에서 백엔드가 켜져 있는지 확인 */
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealth,
    retry: false,
    staleTime: 30_000,
  })
}
