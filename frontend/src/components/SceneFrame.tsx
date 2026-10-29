import { ImageOff } from 'lucide-react'
import type { Motion } from '../api/types'
import { BG_BLUR_PX, cqw } from '../lib/render'
import { SubtitleOverlay } from './SubtitleOverlay'

/**
 * 렌더 ⑦과 같은 배치: 흐린 배경(cover + blur) 위에 원본 전체(contain), 그 위에 자막.
 * motion이 있으면 CSS로 3초 반복(prefers-reduced-motion이면 정지, styles/index.css).
 */
export function SceneFrame({
  src,
  subtitle,
  motion = 'none',
  animate = false,
  alt = '',
}: {
  src: string | null
  subtitle: string
  motion?: Motion
  animate?: boolean
  alt?: string
}) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#23262d] text-sm text-[#9198a6]">
        <ImageOff aria-hidden="true" className="size-8" />
        <span>이미지 없음</span>
        <SubtitleOverlay text={subtitle} />
      </div>
    )
  }
  return (
    <>
      <div className={animate ? `motion-${motion} absolute inset-0` : 'absolute inset-0'}>
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-110 object-cover"
          style={{ filter: `blur(${cqw(BG_BLUR_PX)})` }}
        />
        <img src={src} alt={alt} className="absolute inset-0 size-full object-contain" />
      </div>
      <SubtitleOverlay text={subtitle} />
    </>
  )
}
