import { describe, expect, it } from 'vitest'
import { previewSubtitle, sceneSubtitle, splitSubtitleChunks } from './render'

describe('splitSubtitleChunks (백엔드 split_chunks와 같은 규칙)', () => {
  it('문장부호 뒤 공백에서 나누고 숫자 안 쉼표는 나누지 않는다', () => {
    expect(splitSubtitleChunks('안녕하세요, 160,000원입니다.')).toEqual(['안녕하세요,', '160,000원입니다.'])
  })

  it('14자를 넘으면 어절로 다시 나눈다', () => {
    const chunks = splitSubtitleChunks('제주 동쪽 해안 길을 3시간 동안 걸으면 어떤 풍경을')
    expect(chunks).toEqual(['제주 동쪽 해안 길을', '3시간 동안 걸으면 어떤', '풍경을'])
    for (const c of chunks) expect([...c].length).toBeLessThanOrEqual(14)
  })

  it('14자를 넘는 어절은 글자 단위로 자른다', () => {
    expect(splitSubtitleChunks('가나다라마바사아자차카타파하거너더')).toEqual(['가나다라마바사아자차카타파하', '거너더'])
  })
})

describe('미리보기 자막', () => {
  it('렌더 전에는 첫 덩어리', () => {
    expect(previewSubtitle('제주 동쪽 해안 길을 3시간 동안 걸으면')).toBe('제주 동쪽 해안 길을')
    expect(previewSubtitle('  ')).toBe('')
  })

  it('렌더 후에는 첫 자막', () => {
    expect(sceneSubtitle({ text: '문구', subtitles: [{ startSec: 0, endSec: 1, text: '첫 자막' }] })).toBe('첫 자막')
  })
})
