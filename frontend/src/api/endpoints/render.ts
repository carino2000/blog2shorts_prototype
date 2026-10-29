import { apiUrl, postJson } from '../client'
import type { RenderStage } from '../types'

/** from이 있으면 그 단계부터 다시(완료된 TTS 재사용) */
export async function startRender(projectId: string, from?: RenderStage): Promise<void> {
  const query = from ? `?from=${from}` : ''
  await postJson<unknown>(`/api/projects/${encodeURIComponent(projectId)}/render${query}`)
}

/** video src 또는 다운로드 링크 주소 */
export function videoUrl(projectId: string, download = false): string {
  return apiUrl(`/api/projects/${encodeURIComponent(projectId)}/video${download ? '?download=1' : ''}`)
}
