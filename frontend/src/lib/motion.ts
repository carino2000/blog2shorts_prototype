import type { Motion } from '../api/types'

export const MOTIONS: { value: Motion; label: string }[] = [
  { value: 'zoom_in', label: '줌 인' },
  { value: 'zoom_out', label: '줌 아웃' },
  { value: 'pan_left', label: '왼쪽으로' },
  { value: 'pan_right', label: '오른쪽으로' },
  { value: 'none', label: '없음' },
]

export function motionLabel(m: Motion): string {
  return MOTIONS.find((x) => x.value === m)?.label ?? m
}
