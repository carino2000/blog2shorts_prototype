import { request } from '../client'
import type { Project, SceneUpdate } from '../types'

export function updateScenes(projectId: string, scenes: SceneUpdate[]): Promise<Project> {
  return request<Project>(`/api/projects/${encodeURIComponent(projectId)}/scenes`, {
    method: 'PATCH',
    body: JSON.stringify({ scenes }),
  })
}
