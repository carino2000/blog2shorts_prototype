import { afterEach, describe, expect, it, vi } from 'vitest'
import { startRender, videoUrl } from './render'

function stubFetch() {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => new Response(JSON.stringify({ id: 'p1' }), { status: 202 }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('videoUrl', () => {
  it('다시 만든 영상을 캐시에서 읽지 않게 version을 붙인다', () => {
    expect(videoUrl('p1')).toBe('/api/projects/p1/video')
    expect(videoUrl('p1', false, 5)).toBe('/api/projects/p1/video?v=5')
    expect(videoUrl('p1', true, 5)).toBe('/api/projects/p1/video?download=1&v=5')
  })
})

describe('startRender 요청', () => {
  it('선택값을 본문에 싣는다', async () => {
    const fetchMock = stubFetch()
    await startRender('p1', undefined, 'fast')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/projects/p1/render')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"motionQuality":"fast"}')
  })

  it('재시도(from)에도 같은 본문을 싣는다', async () => {
    const fetchMock = stubFetch()
    await startRender('p1', 'subtitle', 'smooth')
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/projects/p1/render?from=subtitle')
    expect(init.body).toBe('{"motionQuality":"smooth"}')
  })

  it('생략하면 본문 없이 보낸다(서버 기본값 fast)', async () => {
    const fetchMock = stubFetch()
    await startRender('p1')
    expect(fetchMock.mock.calls[0]![1].body).toBeUndefined()
  })
})
