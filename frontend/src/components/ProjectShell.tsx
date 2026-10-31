import { Loader2, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { isApiError, isNotFound } from '../api'
import { isBusy, useProject } from '../api/queries/useProject'
import type { Project } from '../api/types'
import { allowedViews, defaultView, furthestView, viewPath, type View } from '../lib/projectView'
import { btnPrimary, btnSecondary } from '../lib/ui'
import { AppHeader } from './AppHeader'
import { ErrorBanner } from './ErrorBanner'
import type { StepKey } from './Stepper'

// 처리 중 화면은 대본을 만드는 중이므로 Stepper에서 '대본' 칸을 현재로 보여 준다
const STEP_OF: Record<View, StepKey> = { processing: 'script', script: 'script', scenes: 'scenes', result: 'result' }

/**
 * 프로젝트 화면 공통 틀: 헤더·Stepper, 로딩, 404(작업 만료), 조회 실패,
 * 그리고 지금 상태에서 열 수 없는 화면이면 맞는 화면으로 보낸다.
 */
export function ProjectShell({
  id,
  view,
  wide = false,
  children,
}: {
  id: string
  view: View
  wide?: boolean
  children: (project: Project) => ReactNode
}) {
  const query = useProject(id)
  const project = query.data
  const step = STEP_OF[view]

  const header = (
    <AppHeader
      step={step}
      projectId={id}
      busy={isBusy(project?.status)}
      reached={project ? STEP_OF[furthestView(project)] : undefined}
      wide={wide}
    />
  )
  const container = wide ? 'mx-auto max-w-[1440px] px-5 py-6' : 'mx-auto max-w-[1140px] px-5 py-8 sm:py-12'

  if (query.isError && (isNotFound(query.error) || !project)) {
    return (
      <div className="min-h-dvh">
        {header}
        <main className={container}>
          {isNotFound(query.error) ? (
            <ExpiredNotice />
          ) : (
            <ErrorBanner
              title="작업 상태를 불러오지 못했습니다"
              message={isApiError(query.error) ? query.error.message : '잠시 후 다시 시도해 주세요.'}
              actions={
                <button type="button" className={btnSecondary} onClick={() => void query.refetch()}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  다시 시도
                </button>
              }
            />
          )}
        </main>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-dvh">
        {header}
        <main className={container}>
          <p role="status" className="flex items-center gap-2 text-muted">
            <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
            작업 상태를 불러오는 중…
          </p>
        </main>
      </div>
    )
  }

  if (!allowedViews(project).includes(view)) {
    return <Navigate to={viewPath(id, defaultView(project))} replace />
  }

  return (
    <div className="min-h-dvh">
      {header}
      <main className={container}>{children(project)}</main>
    </div>
  )
}

export function ExpiredNotice() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-card border border-line bg-surface p-8 text-center">
      <h1 className="m-0 text-lg font-semibold">작업이 만료되었습니다. 처음부터 다시 시작해 주세요.</h1>
      <p className="m-0 text-sm text-muted">작업은 서버 메모리에만 있어서 서버가 다시 시작되면 사라집니다.</p>
      <Link to="/" className={btnPrimary}>
        입력 화면으로
      </Link>
    </section>
  )
}
