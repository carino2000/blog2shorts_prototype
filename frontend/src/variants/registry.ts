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
  { id: 'ledger', name: '단정한 안내', mood: '정갈 · 친절', swatch: ['#FBFAF7', '#1F2933', '#0F766E'], load: () => import('./ledger') },
  { id: 'command', name: '작업 콘솔', mood: '세련 · 고밀도', swatch: ['#F3F4F6', '#16191F', '#BE185D'], load: () => import('./command') },
  { id: 'reel', name: '빅 릴', mood: '화려 · 대담', swatch: ['#FF4A1C', '#0A0A0A', '#D4FF3A'], load: () => import('./reel') },
  { id: 'paper', name: '종이 공방', mood: '따뜻 · 차분', swatch: ['#F1E9DB', '#3A2F26', '#B4532A'], load: () => import('./paper') },
  { id: 'grid', name: '스위스 격자', mood: '이성적', swatch: ['#FFFFFF', '#0B0B0B', '#D4001C'], load: () => import('./grid') },
  { id: 'zine', name: '굵은 진', mood: '개성 · 강렬', swatch: ['#FFFFFF', '#0A0A0A', '#FF2E93'], load: () => import('./zine') },
  { id: 'gallery', name: '전시관', mood: '초미니멀', swatch: ['#FFFFFF', '#000000', '#9A9A9A'], load: () => import('./gallery') },
  { id: 'cinema', name: '상영관', mood: '영화적', swatch: ['#0B0809', '#F3EBD9', '#E8C872'], load: () => import('./cinema') },
  { id: 'broadcast', name: '방송 부조실', mood: '긴박 · 실무', swatch: ['#0E1115', '#E8EDF2', '#D92D20'], load: () => import('./broadcast') },
  { id: 'blueprint', name: '설계 도면', mood: '정밀 · 기술적', swatch: ['#0C2340', '#EAF3FF', '#FFD23F'], load: () => import('./blueprint') },
  { id: 'soft', name: '부드러운 유리', mood: '친근 · 가벼움', swatch: ['#EEF6F3', '#1D2B28', '#0E7566'], load: () => import('./soft') },
  { id: 'desktop', name: '옛 PC 책상', mood: '복고 · 장난기', swatch: ['#7FB5A0', '#1B1B1B', '#2B3A67'], load: () => import('./desktop') },
  { id: 'story', name: '세로 스토리', mood: '모바일 · 몰입', swatch: ['#000000', '#FFFFFF', '#3DDCFF'], load: () => import('./story') },
  { id: 'storyboard', name: '콘티 용지', mood: '실무 · 아날로그', swatch: ['#F1EEE6', '#1F2328', '#2C4A86'], load: () => import('./storyboard') },
  { id: 'terminal', name: '터미널', mood: '개발자 · 절제', swatch: ['#0C1014', '#D6E2EE', '#7EE787'], load: () => import('./terminal') },
]

export function findVariant(id: string): VariantEntry | undefined {
  return VARIANTS.find((v) => v.id === id)
}
