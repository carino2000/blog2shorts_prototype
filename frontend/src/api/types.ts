// 통합기획서 6장(API·데이터 계약)의 복사본. 원본이 바뀌면 여기를 따라 고친다.

// ---- 6-1. 데이터 모양 ----

export type ProjectStatus =
  | 'extracting' // ① 구조 추출 중
  | 'scripting' // ②~④ 분석·대본·장면 구성 중
  | 'ready' // 사용자 편집 가능
  | 'rendering' // ⑤~⑦ TTS·자막·합성 중
  | 'done' // MP4 완료
  | 'error'

export type Stage = 'extract' | 'script' | 'tts' | 'subtitle' | 'render'

export interface Project {
  id: string
  status: ProjectStatus
  progress: { stage: Stage; percent: number; message: string } | null
  error: { stage: Stage; code: ErrorCode; message: string } | null
  source: {
    type: 'url' | 'text'
    url: string | null
    title: string | null
    blocks: Block[]
  }
  assets: Asset[] // 이 프로젝트에서 쓸 수 있는 이미지 전체(블로그 + 업로드)
  needsUpload: boolean // 블로그 이미지 0장
  analysis: {
    summary: string // 원문 핵심 요약 2~3문장
    keyPoints: string[] // 핵심 포인트 3~5개, 각 한 문장
  } | null // ③ 전에는 null
  script: { hook: string; body: string; cta: string; estimatedSec: number } | null
  scenes: Scene[] // 4~6개
  video: { url: string; durationSec: number; width: 1080; height: 1920; fps: 30 } | null
  createdAt: string // ISO 8601
}

export interface Block {
  id: string // "b1", "b2" ...
  type: 'heading' | 'paragraph' | 'image'
  text: string | null // heading·paragraph 본문, image는 캡션
  assetId: string | null // image일 때만
  linkedBlockIds: string[] // image일 때 앞뒤 문단 ID
}

export interface Asset {
  id: string // "a1" ...
  origin: 'blog' | 'upload'
  url: string // 백엔드가 서빙하는 주소 (/api/assets/{id})
  width: number
  height: number
}

export type Motion = 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'none'

export interface Subtitle {
  startSec: number
  endSec: number
  text: string
}

export interface Scene {
  id: string // "s1" ...
  order: number // 1부터
  role: 'hook' | 'body' | 'cta'
  text: string // 내레이션 = 자막 원문
  assetId: string | null // null이면 업로드 필요
  motion: Motion
  sourceBlockIds: string[] // 근거 문단
  durationSec: number | null // TTS 후 확정, 그 전엔 null
  subtitles: Subtitle[] // 장면 기준 상대 시간
}

export type ErrorCode =
  | 'NOT_NAVER_URL'
  | 'POST_NOT_FOUND'
  | 'EXTRACT_FAILED'
  | 'TEXT_TOO_SHORT'
  | 'LLM_FAILED'
  | 'TTS_FAILED'
  | 'RENDER_FAILED'
  | 'MISSING_IMAGE'
  | 'UPLOAD_INVALID'
  | 'NOT_FOUND' // 404: 없는 프로젝트·이미지·경로. 프론트는 "작업 만료" 안내
  | 'INVALID_REQUEST' // 422(405 포함): 요청 형식 오류
  | 'INVALID_STATE' // 409: 지금 상태에서 할 수 없는 요청(예: rendering 중 PATCH)

// ---- 6-2. 엔드포인트 요청·응답 ----

export type CreateProjectRequest = { type: 'url'; url: string } | { type: 'text'; text: string }

export interface IdResponse {
  id: string
}

export interface SceneUpdate {
  id: string
  text?: string
  assetId?: string
  motion?: Motion
}

/** POST /render?from= 에 쓸 수 있는 단계 */
export type RenderStage = Extract<Stage, 'tts' | 'subtitle' | 'render'>

export interface HealthResponse {
  ok: boolean
}

/** 오류 응답 공통 형식 */
export interface ErrorResponse {
  error: { code: ErrorCode; message: string }
}
