import { ApiError } from '../client'
import type { Project, SceneUpdate } from '../types'
import { getRecord, persist, snapshot } from './db'
import { latency } from './latency'

// 통합기획서 6-2 PATCH /scenes 규칙
export async function updateScenes(projectId: string, scenes: SceneUpdate[]): Promise<Project> {
  await latency(250)
  const rec = getRecord(projectId)
  const p = rec.project
  if (!['ready', 'done', 'error'].includes(p.status)) {
    throw new ApiError(409, 'INVALID_STATE', '작업이 진행 중이라 장면을 고칠 수 없습니다.')
  }

  let changed = false
  for (const update of scenes) {
    const scene = p.scenes.find((s) => s.id === update.id)
    if (!scene) throw new ApiError(422, 'INVALID_REQUEST', `없는 장면입니다: ${update.id}`)

    if (update.assetId !== undefined && update.assetId !== scene.assetId) {
      if (!p.assets.some((a) => a.id === update.assetId)) {
        throw new ApiError(400, 'MISSING_IMAGE', '이 작업에 없는 이미지입니다.')
      }
      scene.assetId = update.assetId
      changed = true
    }
    if (update.motion !== undefined && update.motion !== scene.motion) {
      scene.motion = update.motion
      changed = true
    }
    if (update.text !== undefined && update.text !== scene.text) {
      scene.text = update.text
      scene.durationSec = null
      scene.subtitles = []
      changed = true
    }
  }

  if (changed) {
    p.video = null
    if (p.status === 'done') p.status = 'ready'
  }
  persist()
  return snapshot(rec)
}
