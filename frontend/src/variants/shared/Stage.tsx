import type { ReactNode } from 'react'
import { cx } from '../../lib/ui'

/**
 * 정확히 9:16인 영상 화면 틀. 안의 자막(SubtitleOverlay)이 프레임 크기에 비례해 그려지도록 container-type: size를 쓴다.
 * 테두리·모서리·그림자 같은 겉모양은 시안이 className으로 입힌다.
 */
export function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('relative aspect-[9/16] w-full overflow-hidden bg-black [container-type:size]', className)}>{children}</div>
}
