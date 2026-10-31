// 장면 편집 화면의 동작: 자동 저장, 선택 장면, 이미지 교체·업로드, 움직임 품질, 렌더 시작
import { useId, useState } from 'react'
import { assetUrl, isApiError } from '../../api'
import { useRender } from '../../api/queries/useRender'
import { useUpdateScenes } from '../../api/queries/useUpdateScenes'
import { useUploadAsset } from '../../api/queries/useUploadAsset'
import type { Asset, Motion, MotionQuality, Project } from '../../api/types'
import { totalSec } from '../../lib/duration'
import { UPLOAD_ACCEPT, checkUpload } from '../../lib/limits'
import { MOTION_QUALITIES, loadMotionQuality, saveMotionQuality } from '../../lib/motionQuality'
import { showUploadNotice } from '../../lib/projectView'
import { WIDE_QUERY, useMediaQuery } from '../../lib/useMediaQuery'
import { useVariantNavigate } from '../useVariant'

export function useScenesEditor(project: Project) {
  const navigate = useVariantNavigate()
  const updates = useUpdateScenes(project.id)
  const render = useRender(project.id)
  const [selectedId, setSelectedId] = useState(project.scenes[0]?.id ?? '')
  const [renderError, setRenderError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [motionQuality, setMotionQuality] = useState<MotionQuality>(() => loadMotionQuality(project.id))
  const qualityHintId = useId()
  const isWide = useMediaQuery(WIDE_QUERY)

  const scenes = updates.applyDrafts(project.scenes)
  const assetById = new Map(project.assets.map((a) => [a.id, a]))
  const assetOf = (assetId: string | null): Asset | undefined => (assetId ? assetById.get(assetId) : undefined)
  const srcOf = (assetId: string | null): string | null => {
    const a = assetOf(assetId)
    return a ? assetUrl(a) : null
  }

  // 한 번 렌더된 뒤 문구를 고친 장면 = 음성을 다시 만드는 장면 (durationSec이 null로 돌아감)
  const everRendered = project.scenes.some((s) => s.durationSec !== null)
  const voiceRedo = new Set(everRendered ? scenes.filter((s) => s.durationSec === null).map((s) => s.id) : [])
  const missingCount = scenes.filter((s) => !s.assetId).length
  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0]

  function selectIndex(i: number) {
    const next = scenes[Math.max(0, Math.min(scenes.length - 1, i))]
    if (next) setSelectedId(next.id)
  }

  function pickAsset(assetId: string) {
    if (selected) updates.change(selected.id, { assetId }, { immediate: true })
  }

  async function startRender() {
    setRenderError(null)
    try {
      await updates.flush()
      await render.mutateAsync({ motionQuality })
      navigate(`/projects/${project.id}/result`)
    } catch (e) {
      setRenderError(isApiError(e) ? e.message : '영상 만들기를 시작하지 못했습니다.')
    }
  }

  return {
    scenes,
    selected,
    selectedId: selected?.id ?? '',
    select: setSelectedId,
    selectIndex,
    prev: () => selected && selectIndex(selected.order - 2),
    next: () => selected && selectIndex(selected.order),
    assets: project.assets,
    assetOf,
    srcOf,
    pickAsset,
    setText: (id: string, text: string) => updates.change(id, { text }),
    setMotion: (id: string, motion: Motion) => updates.change(id, { motion }, { immediate: true }),
    voiceRedo,
    everRendered,
    missingCount,
    totalSeconds: totalSec(scenes),
    allActual: scenes.every((s) => s.durationSec !== null),
    saveState: updates.saveState,
    saveError: updates.error?.message ?? null,
    retrySave: () => void updates.flush().catch(() => undefined),
    uploadNotice: showUploadNotice(project),
    isWide,
    pickerOpen,
    setPickerOpen,
    motionQuality,
    changeQuality: (q: MotionQuality) => {
      setMotionQuality(q)
      saveMotionQuality(project.id, q)
    },
    qualityDescription: MOTION_QUALITIES.find((q) => q.value === motionQuality)?.description ?? '',
    qualityHintId,
    startRender,
    renderPending: render.isPending,
    renderError,
    canRender: missingCount === 0 && !render.isPending && updates.saveState !== 'error',
  }
}

/** 이미지 업로드(클라이언트 검사 + 서버). 올리면 onPicked로 새 이미지 id를 알려 준다 */
export function useAssetUpload(projectId: string, onPicked: (assetId: string) => void) {
  const upload = useUploadAsset(projectId)
  const [clientError, setClientError] = useState<string | null>(null)

  function pickFile(file: File | undefined) {
    if (!file) return
    upload.reset()
    const problem = checkUpload(file)
    setClientError(problem)
    if (problem) return
    upload.mutate(file, { onSuccess: (asset) => onPicked(asset.id) })
  }

  const error = clientError ?? (upload.isError ? (isApiError(upload.error) ? upload.error.message : '업로드하지 못했습니다.') : null)
  return { pickFile, pending: upload.isPending, error, accept: UPLOAD_ACCEPT }
}
