import { apiUrl, postJson } from '../client'
import type { MotionQuality, RenderStage } from '../types'

/** from이 있으면 그 단계부터 다시(완료된 TTS 재사용) */
export async function startRender(projectId: string, from?: RenderStage, motionQuality?: MotionQuality): Promise<void> {
  const query = from ? `?from=${from}` : ''
  await postJson<unknown>(`/api/projects/${encodeURIComponent(projectId)}/render${query}`, motionQuality ? { motionQuality } : undefined)
}

/**
 * video src 또는 다운로드 링크 주소.
 * 다시 만들어도 경로가 같아 브라우저가 이전 영상을 재사용할 수 있으므로 version(서버는 무시)으로 구분한다
 */
export function videoUrl(projectId: string, download = false, version?: number): string {
  const params = new URLSearchParams()
  if (download) params.set('download', '1')
  if (version !== undefined) params.set('v', String(version))
  const query = params.toString()
  return apiUrl(`/api/projects/${encodeURIComponent(projectId)}/video${query ? `?${query}` : ''}`)
}
