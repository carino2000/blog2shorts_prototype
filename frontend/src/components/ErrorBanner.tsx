import { CircleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** 오류 패널. 백엔드가 준 message를 그대로 보여 준다. 서버 연결 오류는 icon으로 입력 오류와 구분한다 */
export function ErrorBanner({
  title,
  message,
  actions,
  icon: Icon = CircleAlert,
}: {
  title?: string
  message: string
  actions?: ReactNode
  icon?: LucideIcon
}) {
  return (
    <div
      role="alert"
      className="appear flex flex-col gap-3 rounded-control border border-danger-line bg-danger-soft p-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0">
          {title && <p className="m-0 text-card font-semibold text-danger-ink">{title}</p>}
          <p className="m-0 text-sm text-ink">{message}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
