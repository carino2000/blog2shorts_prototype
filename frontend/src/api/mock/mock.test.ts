import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../client'
import { countChars } from '../../lib/duration'
import { TIMING, createRecord, getRecord, resetDb, snapshot, startRegenerate, startRenderJob } from './db'
import * as projects from './projects'
import * as scenes from './scenes'
import * as assets from './assets'

const URL_OK = 'https://blog.naver.com/someone/223456789012'
const T0 = new Date('2026-10-29T10:00:00Z').getTime()

function at(ms: number) {
  vi.setSystemTime(T0 + ms)
}

/** mock 함수의 지연(setTimeout)을 흘려보내며 결과를 받는다 */
async function settle<T>(p: Promise<T>): Promise<T> {
  const result = p.then(
    (v) => ({ ok: true as const, v }),
    (e: unknown) => ({ ok: false as const, e }),
  )
  await vi.advanceTimersByTimeAsync(1000)
  const r = await result
  if (!r.ok) throw r.e
  return r.v
}

beforeEach(() => {
  vi.useFakeTimers()
  at(0)
  resetDb()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('mock 생성 흐름', () => {
  it('extracting 1.5초 → scripting 3초 → ready', () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })

    at(500)
    let p = snapshot(getRecord(id))
    expect(p.status).toBe('extracting')
    expect(p.progress?.stage).toBe('extract')
    expect(p.source.blocks).toHaveLength(0)

    at(TIMING.extractMs + 100)
    p = snapshot(getRecord(id))
    expect(p.status).toBe('scripting')
    expect(p.progress?.stage).toBe('script')
    // 구조 추출이 끝나면 블록·이미지가 먼저 보인다
    expect(p.source.blocks).toHaveLength(10)
    expect(p.source.blocks.filter((b) => b.type === 'image')).toHaveLength(3)
    expect(p.assets).toHaveLength(3)
    expect(p.script).toBeNull()

    at(TIMING.extractMs + TIMING.scriptMs)
    p = snapshot(getRecord(id))
    expect(p.status).toBe('ready')
    expect(p.progress).toBeNull()
    expect(p.analysis?.keyPoints.length).toBeGreaterThanOrEqual(3)
    expect(p.scenes.map((s) => s.role)).toEqual(['hook', 'body', 'body', 'body', 'cta'])
    expect(p.scenes.every((s) => s.assetId)).toBe(true)
    expect(p.needsUpload).toBe(false)
  })

  it('샘플 대본은 기획 범위(전체 210~400자, 장면 4~6개)를 지킨다', () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    at(10_000)
    const p = snapshot(getRecord(id))
    const total = p.scenes.reduce((n, s) => n + countChars(s.text), 0)
    expect(total).toBeGreaterThanOrEqual(210)
    expect(total).toBeLessThanOrEqual(400)
    // 근거 블록은 실제로 있는 블록이다
    const ids = new Set(p.source.blocks.map((b) => b.id))
    expect(p.scenes.flatMap((s) => s.sourceBlockIds).every((b) => ids.has(b))).toBe(true)
  })

  it('URL에 fail → 추출 단계 EXTRACT_FAILED', () => {
    const { id } = createRecord({ type: 'url', url: 'https://blog.naver.com/failcase/1' })
    at(TIMING.extractMs)
    const p = snapshot(getRecord(id))
    expect(p.status).toBe('error')
    expect(p.error).toMatchObject({ stage: 'extract', code: 'EXTRACT_FAILED' })
  })

  it('본문에 fail → 대본 단계 LLM_FAILED, 블록은 남아 있음', () => {
    const { id } = createRecord({ type: 'text', text: 'fail '.repeat(60) })
    at(TIMING.extractMs + TIMING.scriptMs)
    const p = snapshot(getRecord(id))
    expect(p.error).toMatchObject({ stage: 'script', code: 'LLM_FAILED' })
    expect(p.source.blocks.length).toBeGreaterThan(0)
  })

  it('본문 입력은 이미지가 없어 needsUpload=true, 장면 assetId=null', () => {
    const { id } = createRecord({ type: 'text', text: '가나다라마바사 '.repeat(40) })
    at(10_000)
    const p = snapshot(getRecord(id))
    expect(p.status).toBe('ready')
    expect(p.needsUpload).toBe(true)
    expect(p.scenes.every((s) => s.assetId === null)).toBe(true)
  })

  it('없는 ID는 404', () => {
    expect(() => getRecord('nope')).toThrow(ApiError)
    try {
      getRecord('nope')
    } catch (e) {
      expect((e as ApiError).status).toBe(404)
    }
  })
})

describe('mock 생성 요청 검증', () => {
  it('네이버 글 주소가 아니면 NOT_NAVER_URL', async () => {
    await expect(settle(projects.createProject({ type: 'url', url: 'https://naver.me/abc' }))).rejects.toMatchObject({
      code: 'NOT_NAVER_URL',
      status: 400,
    })
  })

  it('본문 200자 미만이면 TEXT_TOO_SHORT', async () => {
    await expect(settle(projects.createProject({ type: 'text', text: '짧은 글' }))).rejects.toMatchObject({
      code: 'TEXT_TOO_SHORT',
    })
  })
})

describe('mock 재생성', () => {
  it('scripting → ready, 대본이 바뀐다', () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    at(10_000)
    const before = snapshot(getRecord(id)).scenes[0]?.text
    startRegenerate(getRecord(id))
    expect(snapshot(getRecord(id)).status).toBe('scripting')
    at(10_000 + TIMING.scriptMs)
    const p = snapshot(getRecord(id))
    expect(p.status).toBe('ready')
    expect(p.scenes[0]?.text).not.toBe(before)
  })

  it('regenfail → 재생성만 실패하고 이전 대본 유지', () => {
    const { id } = createRecord({ type: 'url', url: 'https://blog.naver.com/regenfail/1' })
    at(10_000)
    const before = snapshot(getRecord(id))
    expect(before.status).toBe('ready')
    startRegenerate(getRecord(id))
    at(10_000 + TIMING.scriptMs)
    const p = snapshot(getRecord(id))
    expect(p.error).toMatchObject({ stage: 'script', code: 'LLM_FAILED' })
    expect(p.script).toEqual(before.script)
    expect(p.scenes).toEqual(before.scenes)
  })
})

describe('mock PATCH /scenes (6-2 규칙)', () => {
  async function readyAndRendered() {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    at(10_000)
    startRenderJob(getRecord(id), undefined)
    at(10_000 + TIMING.ttsMs + TIMING.subtitleMs + TIMING.renderMs)
    const p = snapshot(getRecord(id))
    expect(p.status).toBe('done')
    return p
  }

  it('text가 바뀐 장면만 durationSec=null·subtitles=[], video=null, done→ready', async () => {
    const p0 = await readyAndRendered()
    const p = await settle(
      scenes.updateScenes(p0.id, [
        { id: 's1', text: '새 문구' },
        { id: 's2', motion: 'none' },
      ]),
    )
    expect(p.status).toBe('ready')
    expect(p.video).toBeNull()
    const [s1, s2] = p.scenes
    expect(s1).toMatchObject({ text: '새 문구', durationSec: null, subtitles: [] })
    expect(s2?.motion).toBe('none')
    expect(s2?.durationSec).not.toBeNull()
    expect(s2?.subtitles.length).toBeGreaterThan(0)
  })

  it('같은 값이면 아무것도 바꾸지 않는다', async () => {
    const p0 = await readyAndRendered()
    const p = await settle(scenes.updateScenes(p0.id, [{ id: 's1', text: p0.scenes[0]!.text }]))
    expect(p.status).toBe('done')
    expect(p.video).not.toBeNull()
  })

  it('없는 assetId는 MISSING_IMAGE', async () => {
    const p0 = await readyAndRendered()
    await expect(settle(scenes.updateScenes(p0.id, [{ id: 's1', assetId: 'a99' }]))).rejects.toMatchObject({
      code: 'MISSING_IMAGE',
    })
  })

  it('진행 중에는 수정 불가(409)', async () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    await expect(settle(scenes.updateScenes(id, [{ id: 's1', text: 'x' }]))).rejects.toMatchObject({ status: 409 })
  })
})

describe('mock 렌더', () => {
  it('tts 2초 → subtitle 1초 → render 4초 → done, durationSec·subtitles·video 채움', () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    at(10_000)
    startRenderJob(getRecord(id), undefined)

    at(10_000 + 500)
    expect(snapshot(getRecord(id)).progress?.stage).toBe('tts')
    at(10_000 + TIMING.ttsMs + 100)
    let p = snapshot(getRecord(id))
    expect(p.progress?.stage).toBe('subtitle')
    expect(p.scenes.every((s) => s.durationSec !== null)).toBe(true)
    at(10_000 + TIMING.ttsMs + TIMING.subtitleMs + 100)
    expect(snapshot(getRecord(id)).progress?.stage).toBe('render')
    at(10_000 + TIMING.ttsMs + TIMING.subtitleMs + TIMING.renderMs)
    p = snapshot(getRecord(id))
    expect(p.status).toBe('done')
    expect(p.video).toMatchObject({ width: 1080, height: 1920, fps: 30 })
    const s1 = p.scenes[0]!
    // 7장: 글자 수 ÷ 7 + 0.3, 자막 시간 합 = 장면 길이
    expect(s1.durationSec).toBeCloseTo(countChars(s1.text) / 7 + 0.3, 1)
    expect(s1.subtitles.at(-1)?.endSec).toBeCloseTo(s1.durationSec!, 1)
  })

  it('이미지 없는 장면이 있으면 MISSING_IMAGE', () => {
    const { id } = createRecord({ type: 'text', text: '가나다라마바사 '.repeat(40) })
    at(10_000)
    expect(() => startRenderJob(getRecord(id), undefined)).toThrow(/이미지가 없는 장면/)
  })

  it('ttsfail → TTS_FAILED, from=tts로 다시 시도하면 done', async () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    at(10_000)
    await settle(scenes.updateScenes(id, [{ id: 's2', text: 'ttsfail 테스트 문구입니다.' }]))
    const t = Date.now() - T0
    startRenderJob(getRecord(id), undefined)
    at(t + TIMING.ttsMs)
    expect(snapshot(getRecord(id)).error).toMatchObject({ stage: 'tts', code: 'TTS_FAILED' })

    startRenderJob(getRecord(id), 'tts')
    at(t + TIMING.ttsMs + TIMING.ttsMs + TIMING.subtitleMs + TIMING.renderMs)
    expect(snapshot(getRecord(id)).status).toBe('done')
  })
})

describe('mock 업로드 검사', () => {
  it('형식이 다르면 UPLOAD_INVALID', async () => {
    const { id } = createRecord({ type: 'url', url: URL_OK })
    const file = new File(['x'], 'a.gif', { type: 'image/gif' })
    await expect(settle(assets.uploadAsset(id, file))).rejects.toMatchObject({ code: 'UPLOAD_INVALID' })
  })
})
