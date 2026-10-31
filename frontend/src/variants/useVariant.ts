import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { VARIANT_PARAM, resolveVariant, withVariant } from './url'

/** 지금 보고 있는 시안 id (주소의 ?v=) */
export function useVariantId(): string {
  const [params] = useSearchParams()
  return resolveVariant(params.get(VARIANT_PARAM))
}

/** 이동 주소에 시안을 붙여 주는 함수. 시안 화면의 모든 링크·이동이 이것을 거친다 */
export function useVariantTo(): (to: string) => string {
  const variant = useVariantId()
  return useCallback((to: string) => withVariant(to, variant), [variant])
}

export function useVariantNavigate(): (to: string, options?: { replace?: boolean }) => void {
  const navigate = useNavigate()
  const vto = useVariantTo()
  return useCallback((to, options) => void navigate(vto(to), options), [navigate, vto])
}
