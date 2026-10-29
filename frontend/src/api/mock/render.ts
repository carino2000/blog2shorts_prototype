import type { RenderStage } from '../types'
import { getRecord, persist, startRenderJob } from './db'
import { latency } from './latency'

export async function startRender(projectId: string, from?: RenderStage): Promise<void> {
  await latency()
  const rec = getRecord(projectId)
  startRenderJob(rec, from)
  persist()
}

/** mock 영상: public/mock/sample.mp4 (FFmpeg로 만든 540×960·3초 무음 그라디언트, 28KB) */
export function videoUrl(_projectId: string, _download = false): string {
  return '/mock/sample.mp4'
}
