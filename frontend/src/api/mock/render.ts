import type { RenderStage } from '../types'
import { getRecord, persist, startRenderJob } from './db'
import { latency } from './latency'

export async function startRender(projectId: string, from?: RenderStage): Promise<void> {
  await latency()
  const rec = getRecord(projectId)
  startRenderJob(rec, from)
  persist()
}

/** mock 영상. public/mock/sample.mp4가 없으면 결과 화면이 포스터 이미지로 대체한다 */
export function videoUrl(_projectId: string, _download = false): string {
  return '/mock/sample.mp4'
}
