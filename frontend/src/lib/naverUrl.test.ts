import { describe, expect, it } from 'vitest'
import { explainInvalidUrl, parseNaverUrl } from './naverUrl'

describe('parseNaverUrl 허용 4종', () => {
  it.each([
    ['https://blog.naver.com/someone/223456789012', 'someone', '223456789012'],
    ['https://m.blog.naver.com/some_one-2/223456789012', 'some_one-2', '223456789012'],
    ['https://blog.naver.com/PostView.naver?blogId=someone&logNo=223456789012', 'someone', '223456789012'],
    ['https://blog.naver.com/PostView.nhn?logNo=223456789012&blogId=someone&redirect=Dlog', 'someone', '223456789012'],
  ])('%s', (url, blogId, logNo) => {
    expect(parseNaverUrl(url)).toEqual({ blogId, logNo })
  })

  it('https:// 생략, 앞뒤 공백, 끝 슬래시·쿼리 허용', () => {
    expect(parseNaverUrl('  blog.naver.com/someone/123/  ')).toEqual({ blogId: 'someone', logNo: '123' })
    expect(parseNaverUrl('m.blog.naver.com/someone/123?referrerCode=1')).toEqual({ blogId: 'someone', logNo: '123' })
    expect(parseNaverUrl('http://blog.naver.com/someone/123#x')).toEqual({ blogId: 'someone', logNo: '123' })
  })
})

describe('parseNaverUrl 거부 3종', () => {
  it('naver.me 단축 링크', () => {
    expect(parseNaverUrl('https://naver.me/5abcDEF')).toBeNull()
    expect(explainInvalidUrl('naver.me/5abcDEF')).toMatch(/단축 주소/)
  })

  it('글 번호 없는 블로그 홈', () => {
    expect(parseNaverUrl('https://blog.naver.com/someone')).toBeNull()
    expect(parseNaverUrl('https://blog.naver.com/PostView.naver?blogId=someone')).toBeNull()
    expect(explainInvalidUrl('blog.naver.com/someone')).toMatch(/글 번호가 없는/)
  })

  it('다른 도메인', () => {
    expect(parseNaverUrl('https://someone.tistory.com/123')).toBeNull()
    expect(parseNaverUrl('https://blog.naver.com.evil.com/someone/123')).toBeNull()
    expect(parseNaverUrl('https://cafe.naver.com/someone/123')).toBeNull()
    expect(explainInvalidUrl('https://someone.tistory.com/123')).toMatch(/네이버 블로그 글 주소가 아닙니다/)
  })

  it('글 번호가 숫자가 아니면 거부', () => {
    expect(parseNaverUrl('https://blog.naver.com/someone/abc')).toBeNull()
  })

  it('빈 입력·올바른 입력은 안내 없음', () => {
    expect(explainInvalidUrl('')).toBeNull()
    expect(explainInvalidUrl('blog.naver.com/someone/123')).toBeNull()
  })
})
