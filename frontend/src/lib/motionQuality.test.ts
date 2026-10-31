import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadMotionQuality, saveMotionQuality } from './motionQuality'

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('motionQuality 저장', () => {
  it('기본값은 fast', () => {
    stubStorage()
    expect(loadMotionQuality('p1')).toBe('fast')
  })

  it('프로젝트별로 저장한다', () => {
    stubStorage()
    saveMotionQuality('p1', 'smooth')
    expect(loadMotionQuality('p1')).toBe('smooth')
    expect(loadMotionQuality('p2')).toBe('fast')
  })

  it('이상한 값이면 fast', () => {
    stubStorage({ 'blog2shorts:motion-quality:p1': 'ultra' })
    expect(loadMotionQuality('p1')).toBe('fast')
  })

  it('저장소가 예외를 던져도 동작한다', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadMotionQuality('p1')).toBe('fast')
    expect(() => saveMotionQuality('p1', 'smooth')).not.toThrow()
  })
})
