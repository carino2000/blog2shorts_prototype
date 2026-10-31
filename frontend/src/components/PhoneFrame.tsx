import type { ReactNode } from 'react'
import { cx } from '../lib/ui'

/** 9:16 휴대폰 프레임. 미리보기·결과 영상은 항상 이 안에서 보여 준다. 화면 안쪽 비율은 정확히 9:16 */
export function PhoneFrame({
  children,
  className,
  label,
  badge,
}: {
  children: ReactNode
  className?: string
  label?: string
  /** 실제 결과가 아닐 때 화면에 겹쳐 표시하는 글자(예: 샘플 미리보기) */
  badge?: string
}) {
  return (
    <div
      className={cx(
        'relative rounded-[40px] bg-[#14171c] p-2 shadow-phone ring-1 ring-black/10 dark:ring-white/12',
        className,
      )}
      aria-label={label}
      role={label ? 'figure' : undefined}
    >
      <span aria-hidden="true" className="absolute top-[22%] -right-[2px] h-[9%] w-[2px] rounded-r-full bg-[#2a2e36]" />
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[32px] bg-black [container-type:size]">
        {children}
        <span aria-hidden="true" className="pointer-events-none absolute top-2 left-1/2 h-1.5 w-14 -translate-x-1/2 rounded-full bg-black/70" />
        {badge && (
          <span className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
