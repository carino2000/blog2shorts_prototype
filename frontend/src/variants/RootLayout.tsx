import { useLayoutEffect } from 'react'
import { Outlet } from 'react-router'
import { BASE_VARIANT } from './registry'
import { VariantSwitcher } from './VariantSwitcher'
import { useVariantId } from './useVariant'

/** 모든 화면의 바깥 틀: html에 시안 id를 달아 시안별 토큰(CSS)이 켜지게 하고, 전환 패널을 붙인다 */
export function RootLayout() {
  const variant = useVariantId()
  useLayoutEffect(() => {
    const root = document.documentElement
    if (variant === BASE_VARIANT) delete root.dataset.variant
    else root.dataset.variant = variant
  }, [variant])
  return (
    <>
      <Outlet />
      <VariantSwitcher />
    </>
  )
}
