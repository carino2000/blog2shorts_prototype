// 회의용 디자인 시안 목록(docs/design_variants.md). 시안이 하나 완성될 때마다 아래에 한 줄을 더한다.
// 만들다 만 시안은 여기에 넣지 않는다(전환 목록에 안 보인다).
import type { ComponentType } from 'react'

export const SCREENS = ['input', 'processing', 'script', 'scenes', 'result'] as const
export type Screen = (typeof SCREENS)[number]

export type VariantScreens = Record<Screen, ComponentType>
export interface VariantModule {
  default: VariantScreens
}

export const BASE_VARIANT = 'base'

export interface VariantEntry {
  id: string
  name: string
  mood: string
  /** 전환 패널의 색 견본: 바탕·글자·강조 */
  swatch: [string, string, string]
  /** null이면 지금 화면(base). 아니면 필요할 때 불러오는 시안 묶음 */
  load: (() => Promise<VariantModule>) | null
}

export const VARIANTS: VariantEntry[] = [
  { id: BASE_VARIANT, name: '현재 화면', mood: '디자인 2안 · 기준', swatch: ['#F7F8FA', '#191F28', '#1B64DA'], load: null },
  { id: 'night', name: '야간 편집실', mood: '차분 · 전문가', swatch: ['#0B0D11', '#E9ECF2', '#F5B83D'], load: () => import('./night') },
  { id: 'press', name: '흑백 인쇄', mood: '흑백 · 지적', swatch: ['#F6F5F1', '#111111', '#55554F'], load: () => import('./press') },
]

export function findVariant(id: string): VariantEntry | undefined {
  return VARIANTS.find((v) => v.id === id)
}
