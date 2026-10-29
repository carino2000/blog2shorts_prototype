import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, isNotFound, request } from './client'

function stubFetch(status: number, body: string) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(body || null, { status })))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request 오류 변환', () => {
  it('공통 오류 형식이면 code·message를 그대로 쓴다', async () => {
    stubFetch(404, JSON.stringify({ error: { code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다.' } }))
    const err = await request('/api/projects/x').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 404, code: 'NOT_FOUND', message: '작업을 찾을 수 없습니다.' })
    expect(isNotFound(err)).toBe(true)
  })

  it.each([
    [404, 'NOT_FOUND'],
    [409, 'INVALID_STATE'],
    [422, 'INVALID_REQUEST'],
    [405, 'INVALID_REQUEST'],
  ])('본문 없는 %i → %s', async (status, code) => {
    stubFetch(status, '')
    await expect(request('/api/x')).rejects.toMatchObject({ status, code })
  })

  it('프록시가 백엔드에 못 붙으면(본문 없는 502) NETWORK', async () => {
    stubFetch(502, '')
    await expect(request('/api/health')).rejects.toMatchObject({ code: 'NETWORK' })
  })

  it('fetch 자체가 실패하면 NETWORK', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))
    await expect(request('/api/health')).rejects.toMatchObject({ status: 0, code: 'NETWORK' })
  })

  it('성공 응답은 JSON을 돌려준다', async () => {
    stubFetch(200, JSON.stringify({ ok: true }))
    await expect(request('/api/health')).resolves.toEqual({ ok: true })
  })
})
