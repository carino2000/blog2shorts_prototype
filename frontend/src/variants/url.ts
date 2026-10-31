// 시안 id는 주소의 ?v=시안id에 남는다. 화면을 옮겨도 유지되도록 모든 이동 주소에 붙인다.
import { BASE_VARIANT, findVariant } from './registry'

export const VARIANT_PARAM = 'v'

/** 모르는 id(아직 안 만든 시안, 오타)는 현재 화면으로 */
export function resolveVariant(raw: string | null | undefined): string {
  return raw && findVariant(raw) ? raw : BASE_VARIANT
}

/** 이동할 주소에 시안을 붙인다. 현재 화면(base)이면 붙이지 않는다 */
export function withVariant(to: string, variant: string): string {
  if (variant === BASE_VARIANT) return to
  const url = new URL(to, 'http://local')
  url.searchParams.set(VARIANT_PARAM, variant)
  return `${url.pathname}${url.search}${url.hash}`
}

/** 현재 주소에서 시안만 바꾼 주소(경로·다른 쿼리는 그대로) */
export function switchVariantHref(pathname: string, search: string, variant: string): string {
  const params = new URLSearchParams(search)
  if (variant === BASE_VARIANT) params.delete(VARIANT_PARAM)
  else params.set(VARIANT_PARAM, variant)
  const query = params.toString()
  return `${pathname}${query ? `?${query}` : ''}`
}
