// 글자 수 → 예상 길이(초). 통합기획서 Q6: 1초 ≈ 7자 🟡 (TTS 실측 후 이 상수만 바꾼다)
export const CHARS_PER_SEC = 7

export const MIN_VIDEO_SEC = 30
export const MAX_VIDEO_SEC = 60

/** 앞뒤 공백을 빼고, 연속 공백은 한 칸으로 센 글자 수 */
export function countChars(text: string): number {
  return [...text.replace(/\s+/g, ' ').trim()].length
}

export function estimateSec(text: string): number {
  return countChars(text) / CHARS_PER_SEC
}

/** 렌더된 장면은 실제 길이, 아니면 글자 수로 추정 */
export function sceneSec(scene: { text: string; durationSec: number | null }): number {
  return scene.durationSec ?? estimateSec(scene.text)
}

export function totalSec(scenes: { text: string; durationSec: number | null }[]): number {
  return scenes.reduce((sum, s) => sum + sceneSec(s), 0)
}

export type DurationRange = 'short' | 'ok' | 'long'

export function durationRange(sec: number): DurationRange {
  if (sec < MIN_VIDEO_SEC) return 'short'
  if (sec > MAX_VIDEO_SEC) return 'long'
  return 'ok'
}

/** 화면 표시용: 소수 첫째 자리까지 */
export function formatSec(sec: number): string {
  return `${Math.round(sec * 10) / 10}초`
}
