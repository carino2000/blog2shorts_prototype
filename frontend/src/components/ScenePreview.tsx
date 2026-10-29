import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Scene } from '../api/types'
import { sceneSubtitle } from '../lib/render'
import { motionLabel } from '../lib/motion'
import { ROLE_LABEL } from '../lib/roles'
import { btnSecondary, cx } from '../lib/ui'
import { PhoneFrame } from './PhoneFrame'
import { SceneFrame } from './SceneFrame'

/** 선택 장면 미리보기: 렌더와 같은 배치·자막, CSS 모션 3초 반복, 이전/다음 */
export function ScenePreview({
  scene,
  total,
  imageSrc,
  onPrev,
  onNext,
  className,
}: {
  scene: Scene
  total: number
  imageSrc: string | null
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-center gap-3', className)}>
      <p className="m-0 text-sm text-muted" aria-live="polite">
        장면 <span className="font-semibold text-ink tabular-nums">#{scene.order}</span> / {total} · {ROLE_LABEL[scene.role]} · 모션{' '}
        {motionLabel(scene.motion)}
      </p>
      <PhoneFrame className="w-full" label={`장면 ${scene.order} 미리보기`}>
        {/* key로 장면·모션이 바뀌면 애니메이션을 처음부터 다시 */}
        <SceneFrame
          key={`${scene.id}-${scene.motion}-${scene.assetId}`}
          src={imageSrc}
          subtitle={sceneSubtitle(scene)}
          motion={scene.motion}
          animate
        />
      </PhoneFrame>
      <div className="flex gap-2">
        <button type="button" className={btnSecondary} onClick={onPrev} disabled={scene.order <= 1}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          이전 장면
        </button>
        <button type="button" className={btnSecondary} onClick={onNext} disabled={scene.order >= total}>
          다음 장면
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  )
}
