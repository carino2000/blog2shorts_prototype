import { Film } from 'lucide-react'
import { Link } from 'react-router'
import { USE_MOCK } from '../api'
import { Stepper, type StepKey } from './Stepper'

export function AppHeader({
  step,
  projectId,
  busy,
  reached,
}: {
  step: StepKey
  projectId?: string
  busy?: boolean
  reached?: StepKey
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 px-4">
        <Link to="/" className="flex min-h-11 items-center gap-2 font-bold text-ink no-underline">
          <Film aria-hidden="true" className="size-5 text-accent" />
          <span>blog2shorts</span>
          {USE_MOCK && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">mock</span>
          )}
        </Link>
        <Stepper current={step} projectId={projectId} busy={busy} reached={reached} />
      </div>
    </header>
  )
}
