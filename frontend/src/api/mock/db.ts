// mock 백엔드의 메모리 상태와 시간 기반 상태 전이 (frontend/CLAUDE.md 7장)
// 전이는 타이머가 아니라 "작업 시작 시각"으로 조회할 때 계산한다. 새로고침해도 이어지고 테스트에서 시간을 돌리기 쉽다.
// 상태는 sessionStorage에 저장한다(탭을 닫으면 사라짐 = 백엔드 재시작과 비슷한 체감).
//
// 오류 흉내 (개발용 트리거):
//   URL에 "notfound"          → POST_NOT_FOUND (추출 단계)
//   URL에 "fail"              → EXTRACT_FAILED (추출 단계)
//   본문에 "fail"             → LLM_FAILED (대본 단계)
//   URL·본문에 "regenfail"    → 처음 생성은 성공, "대본 다시 만들기"만 LLM_FAILED (이전 대본 유지)
//   장면 문구에 "ttsfail"     → 렌더 TTS 단계에서 TTS_FAILED (다시 시도하면 통과)
//   장면 문구에 "renderfail"  → 렌더 합성 단계에서 RENDER_FAILED (다시 시도하면 통과)
import { ApiError } from '../client'
import type { Asset, ErrorCode, Project, RenderStage, Stage } from '../types'
import {
  SAMPLE_ANALYSIS,
  SAMPLE_ASSETS,
  SAMPLE_BLOCKS,
  SAMPLE_TITLE,
  blocksFromText,
  buildScenes,
  buildScript,
  mockDurationSec,
  mockSubtitles,
  variantCount,
} from './sample'

export const TIMING = {
  extractMs: 1500,
  scriptMs: 3000,
  ttsMs: 2000,
  subtitleMs: 1000,
  renderMs: 4000,
} as const

const RENDER_STAGES: RenderStage[] = ['tts', 'subtitle', 'render']
const RENDER_MS: Record<RenderStage, number> = { tts: TIMING.ttsMs, subtitle: TIMING.subtitleMs, render: TIMING.renderMs }

const MESSAGES: Record<Stage, string> = {
  extract: '글 구조를 읽고 있습니다',
  script: '대본과 장면을 만들고 있습니다',
  tts: '음성을 만들고 있습니다',
  subtitle: '자막을 맞추고 있습니다',
  render: '영상을 합치고 있습니다',
}

type Job =
  | { kind: 'create'; startedAt: number; fail: { stage: Stage; code: ErrorCode } | null }
  | { kind: 'regenerate'; startedAt: number; fail: boolean }
  | { kind: 'render'; startedAt: number; from: RenderStage; failAt: RenderStage | null; done: RenderStage[] }

interface MockRecord {
  project: Project
  job: Job | null
  variant: number
  regenFail: boolean
  /** create 작업이 끝났을 때 채울 값 */
  pending: { title: string | null; blocks: Project['source']['blocks']; assets: Asset[] } | null
}

const STORAGE_KEY = 'blog2shorts-mock-db'
const records = new Map<string, MockRecord>(load())

export function now(): number {
  return Date.now()
}

// ---- 생성·조회 ----

export function createRecord(
  source: { type: 'url'; url: string } | { type: 'text'; text: string },
): Project {
  const id = `mock-${Math.random().toString(36).slice(2, 10)}`
  const trigger = (source.type === 'url' ? source.url : source.text).toLowerCase()
  const regenFail = trigger.includes('regenfail')

  let fail: { stage: Stage; code: ErrorCode } | null = null
  if (!regenFail) {
    if (source.type === 'url' && trigger.includes('notfound')) fail = { stage: 'extract', code: 'POST_NOT_FOUND' }
    else if (source.type === 'url' && trigger.includes('fail')) fail = { stage: 'extract', code: 'EXTRACT_FAILED' }
    else if (source.type === 'text' && trigger.includes('fail')) fail = { stage: 'script', code: 'LLM_FAILED' }
  }

  const project: Project = {
    id,
    status: 'extracting',
    progress: { stage: 'extract', percent: 0, message: MESSAGES.extract },
    error: null,
    source: { type: source.type, url: source.type === 'url' ? source.url : null, title: null, blocks: [] },
    assets: [],
    needsUpload: false,
    analysis: null,
    script: null,
    scenes: [],
    video: null,
    createdAt: new Date(now()).toISOString(),
  }

  const pending =
    source.type === 'url'
      ? { title: SAMPLE_TITLE, blocks: SAMPLE_BLOCKS, assets: SAMPLE_ASSETS }
      : { title: null, blocks: blocksFromText(source.text), assets: [] }

  records.set(id, { project, job: { kind: 'create', startedAt: now(), fail }, variant: 0, regenFail, pending })
  save()
  return clone(project)
}

export function getRecord(id: string): MockRecord {
  const rec = records.get(id)
  if (!rec) throw new ApiError(404, 'NOT_FOUND', ERROR_MESSAGES.NOT_FOUND)
  advance(rec, now())
  save()
  return rec
}

export function snapshot(rec: MockRecord): Project {
  return clone(rec.project)
}

export function persist(): void {
  save()
}

// ---- 작업 시작 ----

export function startRegenerate(rec: MockRecord): void {
  const p = rec.project
  if (!['ready', 'done', 'error'].includes(p.status) || !p.script) {
    throw new ApiError(409, 'INVALID_STATE', '지금은 대본을 다시 만들 수 없습니다.')
  }
  p.status = 'scripting'
  p.error = null
  p.progress = { stage: 'script', percent: 0, message: MESSAGES.script }
  rec.job = { kind: 'regenerate', startedAt: now(), fail: rec.regenFail }
}

export function startRenderJob(rec: MockRecord, from: RenderStage | undefined): void {
  const p = rec.project
  if (!['ready', 'done', 'error'].includes(p.status) || p.scenes.length === 0) {
    throw new ApiError(409, 'INVALID_STATE', '지금은 영상을 만들 수 없습니다.')
  }
  if (p.scenes.some((s) => !s.assetId)) {
    throw new ApiError(400, 'MISSING_IMAGE', '이미지가 없는 장면이 있습니다. 모든 장면에 이미지를 넣어 주세요.')
  }
  const texts = p.scenes.map((s) => s.text.toLowerCase())
  // 다시 시도(from 지정)는 실패 트리거를 무시해 통과시킨다
  const failAt: RenderStage | null = from
    ? null
    : texts.some((t) => t.includes('ttsfail'))
      ? 'tts'
      : texts.some((t) => t.includes('renderfail'))
        ? 'render'
        : null
  const start = from ?? 'tts'
  p.status = 'rendering'
  p.error = null
  p.video = null
  p.progress = { stage: start, percent: 0, message: MESSAGES[start] }
  rec.job = { kind: 'render', startedAt: now(), from: start, failAt, done: [] }
}

// ---- 상태 전이 ----

export function advance(rec: MockRecord, t: number): void {
  const job = rec.job
  if (!job) return
  const p = rec.project
  const elapsed = t - job.startedAt

  if (job.kind === 'create') {
    if (elapsed < TIMING.extractMs) {
      p.progress = { stage: 'extract', percent: pct(elapsed, TIMING.extractMs), message: MESSAGES.extract }
      return
    }
    if (job.fail?.stage === 'extract') return fail(rec, 'extract', job.fail.code)

    if (rec.pending) {
      p.source.title = rec.pending.title
      p.source.blocks = rec.pending.blocks
      p.assets = rec.pending.assets
      p.needsUpload = rec.pending.assets.length === 0
      rec.pending = null
    }
    const scriptElapsed = elapsed - TIMING.extractMs
    if (scriptElapsed < TIMING.scriptMs) {
      p.status = 'scripting'
      p.progress = { stage: 'script', percent: pct(scriptElapsed, TIMING.scriptMs), message: MESSAGES.script }
      return
    }
    if (job.fail?.stage === 'script') return fail(rec, 'script', job.fail.code)

    fillScript(rec)
    return finish(rec, 'ready')
  }

  if (job.kind === 'regenerate') {
    if (elapsed < TIMING.scriptMs) {
      p.progress = { stage: 'script', percent: pct(elapsed, TIMING.scriptMs), message: MESSAGES.script }
      return
    }
    // 실패하면 이전 대본·장면을 그대로 둔다
    if (job.fail) return fail(rec, 'script', 'LLM_FAILED')
    rec.variant = (rec.variant + 1) % variantCount()
    fillScript(rec)
    p.video = null
    return finish(rec, 'ready')
  }

  // render
  const stages = RENDER_STAGES.slice(RENDER_STAGES.indexOf(job.from))
  let offset = 0
  for (const stage of stages) {
    const ms = RENDER_MS[stage]
    const local = elapsed - offset
    if (job.failAt === stage && local >= ms / 2) {
      return fail(rec, stage, stage === 'tts' ? 'TTS_FAILED' : 'RENDER_FAILED')
    }
    if (local < ms) {
      p.progress = { stage, percent: pct(local, ms), message: MESSAGES[stage] }
      return
    }
    if (!job.done.includes(stage)) {
      completeRenderStage(rec, stage)
      job.done.push(stage)
    }
    offset += ms
  }
  return finish(rec, 'done')
}

function completeRenderStage(rec: MockRecord, stage: RenderStage): void {
  const p = rec.project
  if (stage === 'tts') {
    // 문구가 바뀐 장면(durationSec=null)만 음성을 다시 만든다 — 백엔드 TTS 캐시 흉내
    for (const s of p.scenes) if (s.durationSec === null) s.durationSec = mockDurationSec(s.text)
  } else if (stage === 'subtitle') {
    for (const s of p.scenes) {
      s.durationSec ??= mockDurationSec(s.text)
      s.subtitles = mockSubtitles(s.text, s.durationSec)
    }
  } else {
    const total = p.scenes.reduce((n, s) => n + (s.durationSec ?? mockDurationSec(s.text)), 0)
    p.video = { url: '/mock/sample.mp4', durationSec: Math.round(total * 10) / 10, width: 1080, height: 1920, fps: 30 }
  }
}

function fillScript(rec: MockRecord): void {
  const p = rec.project
  const blockIds = p.source.blocks.filter((b) => b.type !== 'image').map((b) => b.id)
  p.scenes = buildScenes(rec.variant, blockIds, p.assets.length > 0)
  p.script = buildScript(p.scenes)
  p.analysis = SAMPLE_ANALYSIS
}

function finish(rec: MockRecord, status: 'ready' | 'done'): void {
  rec.project.status = status
  rec.project.progress = null
  rec.project.error = null
  rec.job = null
}

function fail(rec: MockRecord, stage: Stage, code: ErrorCode): void {
  rec.project.status = 'error'
  rec.project.progress = null
  rec.project.error = { stage, code, message: ERROR_MESSAGES[code] }
  rec.job = null
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  NOT_NAVER_URL: '네이버 블로그 글 주소가 아닙니다. 주소를 다시 확인해 주세요.',
  POST_NOT_FOUND: '글을 찾을 수 없습니다. 삭제되었거나 비공개 글일 수 있습니다.',
  EXTRACT_FAILED: '글 내용을 읽지 못했습니다. 본문을 직접 붙여 넣어 다시 시작해 주세요.',
  TEXT_TOO_SHORT: '본문이 너무 짧습니다. 200자 이상 넣어 주세요.',
  LLM_FAILED: '대본을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
  TTS_FAILED: '음성을 만들지 못했습니다. 다시 시도해 주세요.',
  RENDER_FAILED: '영상을 합치지 못했습니다. 다시 시도해 주세요.',
  MISSING_IMAGE: '이미지가 없는 장면이 있습니다. 모든 장면에 이미지를 넣어 주세요.',
  UPLOAD_INVALID: '이미지는 jpg, png, webp 형식, 10MB 이하만 올릴 수 있습니다.',
  NOT_FOUND: '작업이 만료되었습니다. 처음부터 다시 시작해 주세요.',
  INVALID_REQUEST: '요청 형식이 올바르지 않습니다.',
  INVALID_STATE: '지금 상태에서는 할 수 없는 요청입니다.',
}

// ---- 테스트용 ----

export function resetDb(): void {
  records.clear()
  save()
}

// ---- 저장 ----

function pct(elapsed: number, total: number): number {
  return Math.max(0, Math.min(99, Math.floor((elapsed / total) * 100)))
}

function clone<T>(v: T): T {
  return structuredClone(v)
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    return null
  }
}

function load(): [string, MockRecord][] {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as [string, MockRecord][]) : []
  } catch {
    return []
  }
}

function save(): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify([...records.entries()]))
  } catch {
    // 용량 초과(큰 업로드 이미지) 등은 무시한다. 새로고침 시 유지만 안 될 뿐 동작은 같다
  }
}
