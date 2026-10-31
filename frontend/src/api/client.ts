import type { ErrorCode, ErrorResponse } from './types'

/** 서버 오류 코드 + 프론트에서만 쓰는 코드(연결 실패, 형식을 알 수 없는 오류) */
export type ApiErrorCode = ErrorCode | 'NETWORK' | 'UNKNOWN'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

/** 404 = 작업이 없음(백엔드 재시작으로 사라졌거나 잘못된 주소) */
/** 서버에 닿지 못했거나 서버가 실패한 경우. 입력을 고칠 일이 아니라 다시 시도할 일이다 */
export function isConnectionError(e: unknown): boolean {
  return isApiError(e) && (e.status === 0 || e.status >= 500)
}

export function isNotFound(e: unknown): boolean {
  return isApiError(e) && (e.code === 'NOT_FOUND' || e.status === 404)
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** 백엔드 주소를 붙인 URL. img·video·a 태그에 넣을 주소도 이걸로 만든다 */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false
  const err = (body as { error: unknown }).error
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err
}

const NETWORK_MESSAGE = '백엔드 서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.'

/** 이 파일만 fetch를 부른다. 실패는 전부 ApiError로 바꾼다 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(apiUrl(path), { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK', NETWORK_MESSAGE)
  }

  const text = await res.text()
  let body: unknown = undefined
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
  }

  if (!res.ok) {
    if (isErrorResponse(body)) throw new ApiError(res.status, body.error.code, body.error.message)
    // 본문이 공통 형식이 아닐 때(프록시·서버 밖 오류)도 상태 코드로 계약 코드를 맞춘다
    if (res.status === 404) throw new ApiError(404, 'NOT_FOUND', '작업을 찾을 수 없습니다.')
    if (res.status === 409) throw new ApiError(409, 'INVALID_STATE', '지금 상태에서는 할 수 없는 요청입니다.')
    if (res.status === 422 || res.status === 405) throw new ApiError(res.status, 'INVALID_REQUEST', '요청 형식이 올바르지 않습니다.')
    if (res.status >= 500 && res.status !== 501) {
      // Vite 프록시가 백엔드에 연결하지 못하면 5xx(본문 없음)를 돌려준다
      if (body === undefined) throw new ApiError(res.status, 'NETWORK', NETWORK_MESSAGE)
      throw new ApiError(res.status, 'UNKNOWN', '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
    throw new ApiError(res.status, 'UNKNOWN', `요청을 처리하지 못했습니다. (HTTP ${res.status})`)
  }

  return body as T
}

export function postJson<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) })
}
