import type { Scene } from '../../api/types'
import { sceneSec } from '../../lib/duration'

/** 장면을 이어 붙였을 때 각 장면의 시작·끝(초) */
export function withTimes<T extends Pick<Scene, 'text' | 'durationSec'>>(scenes: T[]): { scene: T; start: number; end: number }[] {
  return scenes.reduce<{ scene: T; start: number; end: number }[]>((rows, scene) => {
    const start = rows.at(-1)?.end ?? 0
    return [...rows, { scene, start, end: start + sceneSec(scene) }]
  }, [])
}
