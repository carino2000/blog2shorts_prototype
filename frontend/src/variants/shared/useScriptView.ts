// 대본 확인 화면의 동작: 장면 선택 → 원문 근거 강조, 다시 만들기 확인 단계
import { useState } from 'react'
import { assetUrl, isApiError } from '../../api'
import { useRegenerate } from '../../api/queries/useRegenerate'
import type { Block, Project, Scene } from '../../api/types'
import { totalSec } from '../../lib/duration'
import { isRegenerateError } from '../../lib/projectView'

export function useScriptView(project: Project) {
  const [selected, setSelected] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const regenerate = useRegenerate(project.id)
  const { scenes, analysis, source } = project

  const selectedScene = scenes.find((s) => s.id === selected) ?? null
  const highlight = new Set(selectedScene?.sourceBlockIds ?? [])
  /** 블록 id → 그 블록을 근거로 쓴 장면 번호들 */
  const usedBy = new Map<string, number[]>()
  for (const s of scenes) for (const b of s.sourceBlockIds) usedBy.set(b, [...(usedBy.get(b) ?? []), s.order])

  const groups = (['hook', 'body', 'cta'] as const).map((role) => ({
    role,
    scenes: scenes.filter((s) => s.role === role),
  }))

  const assetSrc = (block: Block): string | null => {
    const asset = block.assetId ? project.assets.find((a) => a.id === block.assetId) : undefined
    return asset ? assetUrl(asset) : null
  }

  return {
    scenes,
    analysis,
    source,
    title: source.title ?? '직접 입력한 본문',
    total: totalSec(scenes),
    allRendered: scenes.length > 0 && scenes.every((s) => s.durationSec !== null),
    groups: groups as { role: Scene['role']; scenes: Scene[] }[],
    selectedId: selected,
    selectedScene,
    toggle: (id: string) => setSelected((cur) => (cur === id ? null : id)),
    highlight,
    usedBy,
    assetSrc,
    /** 다시 만들면 고친 내용과 만든 영상이 사라진다 */
    edited: project.video !== null || project.status === 'done',
    confirming,
    setConfirming,
    regenerate: () => regenerate.mutate(undefined, { onSettled: () => setConfirming(false) }),
    regeneratePending: regenerate.isPending,
    regenerateError: regenerate.isError
      ? isApiError(regenerate.error)
        ? regenerate.error.message
        : '다시 만들기를 요청하지 못했습니다.'
      : null,
    /** 대본을 다시 만들다 실패했지만 이전 대본이 남아 있을 때의 안내 */
    previousScriptError: isRegenerateError(project) && project.error ? project.error.message : null,
  }
}
