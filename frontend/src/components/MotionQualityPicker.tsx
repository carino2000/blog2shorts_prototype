import type { MotionQuality } from '../api/types'
import { MOTION_QUALITIES } from '../lib/motionQuality'
import { cx } from '../lib/ui'

/** 움직임 품질 두 칸 선택. 네이티브 라디오라 Tab·화살표 키를 브라우저가 처리한다. 주 버튼과 겹치지 않게 accent로 채우지 않는다 */
export function MotionQualityPicker({
  value,
  onChange,
  disabled = false,
  describedBy,
}: {
  value: MotionQuality
  onChange: (quality: MotionQuality) => void
  disabled?: boolean
  describedBy?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="움직임 품질"
      aria-describedby={describedBy}
      className="flex shrink-0 gap-1 rounded-control border border-line bg-surface p-0.5"
    >
      {MOTION_QUALITIES.map((q) => {
        const checked = q.value === value
        return (
          <label
            key={q.value}
            className={cx(
              'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[6px] px-2.5 text-sm whitespace-nowrap transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent',
              checked ? 'bg-accent/15 font-semibold text-ink' : 'text-muted hover:text-ink',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="radio"
              name="motion-quality"
              value={q.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(q.value)}
              className="sr-only"
            />
            {q.label}
          </label>
        )
      })}
    </div>
  )
}
