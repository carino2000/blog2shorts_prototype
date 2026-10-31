import { describe, expect, it } from 'vitest'
import { BASE_VARIANT, VARIANTS, findVariant } from './registry'
import { resolveVariant, switchVariantHref, withVariant } from './url'

describe('시안 registry', () => {
  it('id가 겹치지 않고 base를 가진다', () => {
    const ids = VARIANTS.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(findVariant(BASE_VARIANT)?.load).toBeNull()
  })

  it('base가 아닌 시안은 전부 불러오는 함수를 가진다', () => {
    for (const v of VARIANTS.filter((x) => x.id !== BASE_VARIANT)) expect(v.load).toBeTypeOf('function')
  })
})

describe('시안 주소', () => {
  it('모르는 id는 base', () => {
    expect(resolveVariant(null)).toBe(BASE_VARIANT)
    expect(resolveVariant('없는시안')).toBe(BASE_VARIANT)
    expect(resolveVariant(BASE_VARIANT)).toBe(BASE_VARIANT)
  })

  it('base면 이동 주소를 그대로 둔다', () => {
    expect(withVariant('/projects/p1/script', BASE_VARIANT)).toBe('/projects/p1/script')
  })

  it('이동 주소의 쿼리를 지키면서 v를 붙인다', () => {
    expect(withVariant('/?tab=text', 'night')).toBe('/?tab=text&v=night')
    expect(withVariant('/projects/p1', 'night')).toBe('/projects/p1?v=night')
  })

  it('전환 주소는 경로와 다른 쿼리를 지킨다', () => {
    expect(switchVariantHref('/', '?tab=text', 'night')).toBe('/?tab=text&v=night')
    expect(switchVariantHref('/projects/p1', '?v=night', 'press')).toBe('/projects/p1?v=press')
    expect(switchVariantHref('/projects/p1', '?v=night&tab=text', BASE_VARIANT)).toBe('/projects/p1?tab=text')
    expect(switchVariantHref('/', '?v=night', BASE_VARIANT)).toBe('/')
  })
})
