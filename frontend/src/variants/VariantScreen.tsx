import { Suspense, lazy, type ComponentType } from 'react'
import { BASE_SCREENS } from './baseScreens'
import { VARIANTS, type Screen, type VariantEntry, type VariantScreens } from './registry'
import { useVariantId } from './useVariant'

/**
 * 시안 화면은 필요할 때만 불러온다. lazy()는 만들어 두기만 해서는 아무것도 받지 않고,
 * 그 화면이 처음 그려질 때 그 시안 묶음을 한 번 받아 5개 화면을 꺼내 쓴다.
 */
function buildScreens(entry: VariantEntry): VariantScreens {
  const load = entry.load
  if (!load) return BASE_SCREENS
  const pick = (screen: Screen) => lazy(async () => ({ default: (await load()).default[screen] }))
  return { input: pick('input'), processing: pick('processing'), script: pick('script'), scenes: pick('scenes'), result: pick('result') }
}

const TABLE = new Map<string, VariantScreens>(VARIANTS.map((v) => [v.id, buildScreens(v)]))

/** 라우트 요소: 주소의 ?v=에 맞는 시안의 화면을 보여 준다 */
export function VariantScreen({ screen }: { screen: Screen }) {
  const id = useVariantId()
  const Component: ComponentType | undefined = TABLE.get(id)?.[screen]
  if (!Component) return null
  return (
    <Suspense
      fallback={
        <div role="status" className="grid min-h-dvh place-items-center text-sm text-muted">
          시안을 불러오는 중…
        </div>
      }
    >
      <Component />
    </Suspense>
  )
}
