import type { ReactNode } from 'react'
import { cx } from '../lib/ui'

/** 9:16 휴대폰 프레임. 미리보기·결과 영상은 항상 이 안에서 보여 준다. 그림자는 여기에만 쓴다(5장) */
export function PhoneFrame({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div
      className={cx(
        'relative rounded-[2.2rem] border-[6px] border-[#1d2027] bg-[#1d2027] p-0 shadow-[0_24px_60px_-20px_rgba(15,20,40,0.45)]',
        className,
      )}
      aria-label={label}
      role={label ? 'figure' : undefined}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[1.8rem] bg-black [container-type:size]">
        {children}
      </div>
      <div className="pointer-events-none absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#1d2027]" />
    </div>
  )
}
