import type { Scene } from '../api/types'

export const ROLE_LABEL: Record<Scene['role'], string> = { hook: 'Hook', body: '본문', cta: 'CTA' }

/** 카드 왼쪽 띠 등에 쓰는 역할 색 */
export const ROLE_BAR: Record<Scene['role'], string> = { hook: 'bg-hook', body: 'bg-body', cta: 'bg-cta' }
