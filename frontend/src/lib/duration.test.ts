import { describe, expect, it } from 'vitest'
import { CHARS_PER_SEC, countChars, durationRange, estimateSec, formatSec, sceneSec, totalSec } from './duration'

describe('duration', () => {
  it('글자 수: 앞뒤 공백 제외, 연속 공백은 한 칸', () => {
    expect(countChars('  가나  다\n\n라 ')).toBe(6) // "가나 다 라"
    expect(countChars('')).toBe(0)
  })

  it('1초 ≈ 7자', () => {
    expect(CHARS_PER_SEC).toBe(7)
    expect(estimateSec('가'.repeat(70))).toBe(10)
  })

  it('렌더된 장면은 실제 길이, 아니면 추정', () => {
    expect(sceneSec({ text: '가'.repeat(70), durationSec: 4.2 })).toBe(4.2)
    expect(sceneSec({ text: '가'.repeat(70), durationSec: null })).toBe(10)
    expect(
      totalSec([
        { text: '가'.repeat(70), durationSec: null },
        { text: 'x', durationSec: 5 },
      ]),
    ).toBe(15)
  })

  it('30~60초 구간 판정(경계 포함)', () => {
    expect(durationRange(29.9)).toBe('short')
    expect(durationRange(30)).toBe('ok')
    expect(durationRange(60)).toBe('ok')
    expect(durationRange(60.1)).toBe('long')
  })

  it('표시는 소수 첫째 자리', () => {
    expect(formatSec(34.94)).toBe('34.9초')
    expect(formatSec(40)).toBe('40초')
  })
})
