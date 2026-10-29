import { ImageOff, ImagePlus, Mic } from 'lucide-react'
import { useId } from 'react'
import type { Asset, Motion, Scene } from '../api/types'
import { countChars, formatSec, sceneSec } from '../lib/duration'
import { MOTIONS } from '../lib/motion'
import { ROLE_BAR } from '../lib/roles'
import { cx, inputBase } from '../lib/ui'
import { RoleBadge } from './RoleBadge'

/** 필름 스트립의 장면 한 칸: 순번·역할·썸네일·문구·모션 */
export function SceneCard({
  scene,
  asset,
  imageSrc,
  selected,
  voiceRedo,
  onSelect,
  onText,
  onMotion,
  onPickImage,
}: {
  scene: Scene
  asset: Asset | undefined
  imageSrc: string | null
  selected: boolean
  /** 렌더된 적이 있고 문구를 고쳐 음성을 다시 만들어야 하는 장면 */
  voiceRedo: boolean
  onSelect: () => void
  onText: (text: string) => void
  onMotion: (motion: Motion) => void
  onPickImage: () => void
}) {
  const ids = { text: useId(), motion: useId(), hint: useId() }
  const missing = !scene.assetId
  const chars = countChars(scene.text)

  return (
    <article
      aria-label={`장면 ${scene.order}`}
      aria-current={selected ? 'true' : undefined}
      onFocusCapture={onSelect}
      onClick={onSelect}
      className={cx(
        'relative flex gap-3 overflow-hidden rounded-card border bg-surface p-3 pl-4 transition-colors',
        missing ? 'border-danger' : selected ? 'border-accent ring-2 ring-accent/20' : 'border-line',
      )}
    >
      <span className={cx('absolute inset-y-0 left-0 w-1', ROLE_BAR[scene.role])} aria-hidden="true" />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
          onPickImage()
        }}
        className={cx(
          'relative flex aspect-[9/16] w-16 shrink-0 items-center justify-center overflow-hidden rounded-control border bg-bg sm:w-20',
          'focus-visible:outline-2 focus-visible:outline-accent',
          missing ? 'border-dashed border-danger text-danger' : 'border-line',
        )}
        aria-label={missing ? `장면 ${scene.order} 이미지 넣기` : `장면 ${scene.order} 이미지 바꾸기`}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-[11px]">
            <ImageOff aria-hidden="true" className="size-5" />
            없음
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex justify-center bg-black/45 py-0.5 text-white">
          <ImagePlus aria-hidden="true" className="size-3.5" />
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold tabular-nums">#{scene.order}</span>
          <RoleBadge role={scene.role} />
          {voiceRedo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              <Mic aria-hidden="true" className="size-3" />
              음성 다시 만듦
            </span>
          )}
          <span className="ml-auto text-xs text-muted tabular-nums">
            {scene.durationSec !== null ? formatSec(scene.durationSec) : `약 ${formatSec(sceneSec(scene))}`}
          </span>
        </div>

        <label htmlFor={ids.text} className="sr-only">
          장면 {scene.order} 문구
        </label>
        <textarea
          id={ids.text}
          rows={3}
          value={scene.text}
          onChange={(e) => onText(e.target.value)}
          aria-describedby={ids.hint}
          className={cx(inputBase, 'resize-y py-2 text-sm leading-relaxed')}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p id={ids.hint} className="m-0 text-xs text-muted tabular-nums">
            {chars}자{missing && <span className="font-medium text-danger"> · 이미지를 넣어 주세요</span>}
            {asset?.origin === 'upload' && <span> · 업로드 이미지</span>}
          </p>
          <label htmlFor={ids.motion} className="flex items-center gap-2 text-xs text-muted">
            모션
            <select
              id={ids.motion}
              value={scene.motion}
              onChange={(e) => onMotion(e.target.value as Motion)}
              className="min-h-11 rounded-control border border-line bg-surface px-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {MOTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </article>
  )
}
