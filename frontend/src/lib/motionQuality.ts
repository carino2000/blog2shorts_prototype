// 움직임 품질 선택값. Project에는 없는 값이라 프로젝트별로 브라우저에 저장한다(통합기획서 6-2).
// 저장을 못 읽거나 못 써도(사생활 보호 모드 등) 계약 기본값 fast로 동작한다.
import type { MotionQuality } from '../api/types'

export const DEFAULT_MOTION_QUALITY: MotionQuality = 'fast'

export const MOTION_QUALITIES: { value: MotionQuality; label: string; description: string }[] = [
  { value: 'fast', label: '빠르게', description: '영상이 빨리 나오지만 움직임이 조금 떨릴 수 있어요' },
  { value: 'smooth', label: '부드럽게', description: '움직임이 더 매끄럽지만 조금 더 걸려요' },
]

function key(projectId: string): string {
  return `blog2shorts:motion-quality:${projectId}`
}

export function loadMotionQuality(projectId: string): MotionQuality {
  try {
    const stored = localStorage.getItem(key(projectId))
    return stored === 'fast' || stored === 'smooth' ? stored : DEFAULT_MOTION_QUALITY
  } catch {
    return DEFAULT_MOTION_QUALITY
  }
}

export function saveMotionQuality(projectId: string, quality: MotionQuality): void {
  try {
    localStorage.setItem(key(projectId), quality)
  } catch {
    // 저장 실패는 무시한다. 이번 화면의 선택값은 그대로 쓰인다
  }
}
