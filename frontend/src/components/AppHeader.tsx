import { Film } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../lib/ui'
import { Stepper, type StepKey } from './Stepper'

export function AppHeader({
  step,
  projectId,
  busy,
  reached,
  wide = false,
}: {
  step: StepKey
  projectId?: string
  busy?: boolean
  reached?: StepKey
  /** 장면 편집처럼 넓은 본문과 기준선을 맞출 때 */
  wide?: boolean
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className={cx('mx-auto flex min-h-16 flex-wrap items-center justify-between gap-x-4 px-5', wide ? 'max-w-[1440px]' : 'max-w-[1140px]')}>
        <Link to="/" className="flex min-h-11 items-center gap-2 text-card font-semibold text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright">
          <Film aria-hidden="true" className="size-5 text-accent-bright" />
          <span>blog2shorts</span>
        </Link>
        <Stepper current={step} projectId={projectId} busy={busy} reached={reached} />
      </div>
    </header>
  )
}
