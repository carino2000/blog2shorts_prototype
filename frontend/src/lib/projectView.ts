// 프로젝트 상태 → 보여 줄 화면. ProjectPage의 분기와 각 화면의 진입 검사가 같은 규칙을 쓴다.
import type { Project, ProjectStatus } from '../api/types'

export type View = 'processing' | 'script' | 'scenes' | 'result'

const ORDER: View[] = ['processing', 'script', 'scenes', 'result']

type ProjectLike = Pick<Project, 'status' | 'error' | 'script'>

/** 렌더 단계(tts·subtitle·render)에서 난 오류 */
export function isRenderError(p: ProjectLike): boolean {
  return p.status === 'error' && !!p.error && ['tts', 'subtitle', 'render'].includes(p.error.stage)
}

/** 대본 재생성 실패: 이전 대본이 남아 있는 script 단계 오류 */
export function isRegenerateError(p: ProjectLike): boolean {
  return p.status === 'error' && p.error?.stage === 'script' && p.script !== null
}

/** 이 상태에서 열 수 있는 화면 */
export function allowedViews(p: ProjectLike): View[] {
  const busyOrEarlyError: ProjectStatus[] = ['extracting', 'scripting']
  if (busyOrEarlyError.includes(p.status)) return ['processing']
  if (p.status === 'rendering') return ['result']
  if (p.status === 'error') {
    if (isRenderError(p)) return ['script', 'scenes', 'result']
    if (isRegenerateError(p)) return ['script', 'scenes']
    return ['processing'] // 추출·첫 대본 실패
  }
  if (p.status === 'done') return ['script', 'scenes', 'result']
  return ['script', 'scenes'] // ready
}

/** /projects/:id 로 들어왔을 때 갈 화면 */
export function defaultView(p: ProjectLike): View {
  if (p.status === 'rendering' || p.status === 'done' || isRenderError(p)) return 'result'
  const allowed = allowedViews(p)
  return allowed[0] ?? 'processing'
}

/** Stepper에서 클릭으로 갈 수 있는 가장 먼 화면 */
export function furthestView(p: ProjectLike): View {
  const allowed = allowedViews(p)
  return allowed.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), allowed[0] ?? 'processing')
}

export function viewPath(id: string, view: View): string {
  return view === 'processing' ? `/projects/${id}` : `/projects/${id}/${view}`
}

/** needsUpload는 '블로그 이미지 0장'이라 업로드 뒤에도 true로 남는다. 쓸 이미지가 생기면 안내를 내린다 */
export function showUploadNotice(p: Pick<Project, 'needsUpload' | 'assets'>): boolean {
  return p.needsUpload && p.assets.length === 0
}
