import { describe, expect, it } from 'vitest'
import type { ErrorCode, Project, Stage } from '../api/types'
import { allowedViews, defaultView, furthestView } from './projectView'

const script = { hook: 'h', body: 'b', cta: 'c', estimatedSec: 40 }

function p(status: Project['status'], opts: { stage?: Stage; code?: ErrorCode; hasScript?: boolean } = {}) {
  return {
    status,
    error: opts.stage ? { stage: opts.stage, code: opts.code ?? 'LLM_FAILED', message: '' } : null,
    script: opts.hasScript ? script : null,
  }
}

describe('projectView', () => {
  it.each([
    ['extracting', p('extracting'), 'processing', ['processing']],
    ['scripting', p('scripting'), 'processing', ['processing']],
    ['ready', p('ready', { hasScript: true }), 'script', ['script', 'scenes']],
    ['rendering', p('rendering', { hasScript: true }), 'result', ['result']],
    ['done', p('done', { hasScript: true }), 'result', ['script', 'scenes', 'result']],
    ['추출 실패', p('error', { stage: 'extract', code: 'EXTRACT_FAILED' }), 'processing', ['processing']],
    ['첫 대본 실패', p('error', { stage: 'script' }), 'processing', ['processing']],
    ['재생성 실패(이전 대본 있음)', p('error', { stage: 'script', hasScript: true }), 'script', ['script', 'scenes']],
    ['렌더 실패', p('error', { stage: 'tts', code: 'TTS_FAILED', hasScript: true }), 'result', ['script', 'scenes', 'result']],
  ] as const)('%s', (_name, project, def, allowed) => {
    expect(defaultView(project)).toBe(def)
    expect(allowedViews(project)).toEqual(allowed)
  })

  it('Stepper는 허용된 가장 먼 화면까지 간다', () => {
    expect(furthestView(p('ready', { hasScript: true }))).toBe('scenes')
    expect(furthestView(p('done', { hasScript: true }))).toBe('result')
  })
})
