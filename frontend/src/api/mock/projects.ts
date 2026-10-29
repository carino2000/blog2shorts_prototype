import { ApiError } from '../client'
import type { CreateProjectRequest, IdResponse, Project } from '../types'
import { parseNaverUrl } from '../../lib/naverUrl'
import { countChars } from '../../lib/duration'
import { MIN_TEXT_CHARS } from '../../lib/limits'
import { ERROR_MESSAGES, createRecord, getRecord, persist, snapshot, startRegenerate } from './db'
import { latency } from './latency'

export async function createProject(req: CreateProjectRequest): Promise<IdResponse> {
  await latency()
  if (req.type === 'url' && !parseNaverUrl(req.url)) {
    throw new ApiError(400, 'NOT_NAVER_URL', ERROR_MESSAGES.NOT_NAVER_URL)
  }
  if (req.type === 'text' && countChars(req.text) < MIN_TEXT_CHARS) {
    throw new ApiError(400, 'TEXT_TOO_SHORT', ERROR_MESSAGES.TEXT_TOO_SHORT)
  }
  const project = createRecord(req)
  return { id: project.id }
}

export async function getProject(id: string): Promise<Project> {
  await latency(100)
  return snapshot(getRecord(id))
}

export async function regenerateProject(id: string): Promise<IdResponse> {
  await latency()
  const rec = getRecord(id)
  startRegenerate(rec)
  persist()
  return { id }
}
