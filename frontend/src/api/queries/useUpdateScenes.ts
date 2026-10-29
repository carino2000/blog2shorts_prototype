import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError, isApiError } from '..'
import type { Project, Scene, SceneUpdate } from '../types'
import { queryKeys } from './keys'

export const SAVE_DEBOUNCE_MS = 800

export type SceneDraft = Omit<SceneUpdate, 'id'>
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/**
 * 장면 자동 저장. 바뀐 내용은 drafts로 바로 화면에 보이고, 입력이 멈춘 뒤 800ms에 PATCH /scenes로 저장한다.
 * 저장 응답이 와도 그 사이 새로 입력한 글자는 drafts가 덮어 보여 주므로 되돌아가지 않는다.
 */
export function useUpdateScenes(projectId: string) {
  const qc = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, SceneDraft>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [error, setError] = useState<ApiError | null>(null)

  const pending = useRef(new Map<string, SceneDraft>())
  const inflight = useRef<Promise<void> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  const saveBatch = useCallback(
    async (batch: Map<string, SceneDraft>) => {
      setSaveState('saving')
      try {
        const project = await api.updateScenes(
          projectId,
          [...batch].map(([id, draft]) => ({ id, ...draft })),
        )
        qc.setQueryData<Project>(queryKeys.project(projectId), project)
        setDrafts((prev) => {
          const next = { ...prev }
          for (const id of batch.keys()) if (!pending.current.has(id)) delete next[id]
          return next
        })
        setError(null)
        setSaveState(pending.current.size > 0 ? 'pending' : 'saved')
      } catch (e) {
        // 실패한 변경을 되돌려 놓는다(그 사이 새 입력이 있으면 새 입력이 이긴다)
        for (const [id, draft] of batch) pending.current.set(id, { ...draft, ...pending.current.get(id) })
        setError(isApiError(e) ? e : new ApiError(0, 'UNKNOWN', '저장하지 못했습니다.'))
        setSaveState('error')
        throw e
      }
    },
    [projectId, qc],
  )

  /** 남은 변경을 모두 저장할 때까지 기다린다. 렌더 시작·화면 이동 전에 부른다 */
  const flush = useCallback(async () => {
    clearTimer()
    for (;;) {
      if (inflight.current) {
        await inflight.current
        continue
      }
      if (pending.current.size === 0) return
      const batch = pending.current
      pending.current = new Map()
      const p = saveBatch(batch)
      inflight.current = p.catch(() => undefined)
      try {
        await p
      } finally {
        inflight.current = null
      }
    }
  }, [saveBatch])

  const change = useCallback(
    (sceneId: string, draft: SceneDraft, options: { immediate?: boolean } = {}) => {
      setDrafts((prev) => ({ ...prev, [sceneId]: { ...prev[sceneId], ...draft } }))
      pending.current.set(sceneId, { ...pending.current.get(sceneId), ...draft })
      setSaveState('pending')
      clearTimer()
      const run = () => void flush().catch(() => undefined)
      if (options.immediate) run()
      else timer.current = setTimeout(run, SAVE_DEBOUNCE_MS)
    },
    [flush],
  )

  /** 서버 장면 위에 아직 저장 안 된 변경을 겹친 값. 문구가 바뀐 장면은 저장 후 서버처럼 길이·자막을 비운다(6-2) */
  const applyDrafts = useCallback(
    (scenes: Scene[]): Scene[] =>
      scenes.map((s) => {
        const d = drafts[s.id]
        if (!d) return s
        const textChanged = d.text !== undefined && d.text !== s.text
        return { ...s, ...d, ...(textChanged ? { durationSec: null, subtitles: [] } : {}) }
      }),
    [drafts],
  )

  // 화면을 떠날 때 남은 변경을 저장한다
  useEffect(
    () => () => {
      clearTimer()
      if (pending.current.size > 0) void flush().catch(() => undefined)
    },
    [flush],
  )

  return { change, flush, applyDrafts, drafts, saveState, error, hasPending: Object.keys(drafts).length > 0 }
}
