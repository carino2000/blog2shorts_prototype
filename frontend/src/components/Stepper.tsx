import { Check } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../lib/ui'

export type StepKey = 'input' | 'script' | 'scenes' | 'result'

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'input', label: '입력' },
  { key: 'script', label: '대본' },
  { key: 'scenes', label: '장면 편집' },
  { key: 'result', label: '영상' },
]

function stepPath(key: StepKey, projectId?: string): string {
  if (key === 'input' || !projectId) return '/'
  return `/projects/${projectId}/${key}`
}

/**
 * 입력 → 대본 → 장면 편집 → 영상. 현재 단계 강조, 지난 단계는 진행 중 작업이 없을 때만 클릭으로 이동.
 * reached: 이 프로젝트가 도달한 가장 먼 단계(영상이 이미 있으면 영상까지 이동 가능)
 */
export function Stepper({
  current,
  projectId,
  busy = false,
  reached,
}: {
  current: StepKey
  projectId?: string
  busy?: boolean
  reached?: StepKey
}) {
  const currentIdx = STEPS.findIndex((s) => s.key === current)
  const reachedIdx = Math.max(currentIdx, reached ? STEPS.findIndex((s) => s.key === reached) : -1)

  return (
    <nav aria-label="진행 단계">
      <ol className="m-0 flex list-none items-center gap-1 p-0 text-xs sm:gap-2 sm:text-sm">
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIdx
          const isDone = i < currentIdx
          const canGo = !isCurrent && !busy && i <= reachedIdx && (step.key === 'input' || !!projectId)
          const content = (
            <>
              <span
                className={cx(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
                  isCurrent && 'bg-accent text-white',
                  isDone && 'bg-accent/15 text-accent',
                  !isCurrent && !isDone && 'border border-line text-muted',
                )}
              >
                {isDone ? <Check aria-hidden="true" className="size-3" /> : i + 1}
              </span>
              <span className={cx('whitespace-nowrap', isCurrent ? 'font-semibold text-ink' : 'text-muted', i !== currentIdx && 'max-sm:sr-only')}>
                {step.label}
              </span>
            </>
          )
          return (
            <li key={step.key} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && <span aria-hidden="true" className="h-px w-3 bg-line sm:w-6" />}
              {canGo ? (
                <Link
                  to={stepPath(step.key, projectId)}
                  className="flex min-h-11 items-center gap-1.5 rounded-control px-1 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {content}
                </Link>
              ) : (
                <span className="flex min-h-11 items-center gap-1.5 px-1" aria-current={isCurrent ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
