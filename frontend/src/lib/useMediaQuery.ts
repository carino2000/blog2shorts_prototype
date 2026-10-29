import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** 5-2: 1280px 이상이면 미디어 패널을 옆에 고정, 아니면 시트로 */
export const WIDE_QUERY = '(min-width: 1280px)'
