import { postJson, request } from '../client'
import type { CreateProjectRequest, IdResponse, Project } from '../types'

export function createProject(req: CreateProjectRequest): Promise<IdResponse> {
  return postJson<IdResponse>('/api/projects', req)
}

export function getProject(id: string): Promise<Project> {
  return request<Project>(`/api/projects/${encodeURIComponent(id)}`)
}

export function regenerateProject(id: string): Promise<IdResponse> {
  return postJson<IdResponse>(`/api/projects/${encodeURIComponent(id)}/regenerate`)
}
