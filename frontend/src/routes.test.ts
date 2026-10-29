import { describe, expect, it } from 'vitest'
import { routes } from './routes'

describe('routes', () => {
  it('통합기획서 7장의 화면 경로 5개를 가진다', () => {
    expect(routes.map((r) => r.path)).toEqual([
      '/',
      '/projects/:id',
      '/projects/:id/script',
      '/projects/:id/scenes',
      '/projects/:id/result',
    ])
  })
})
