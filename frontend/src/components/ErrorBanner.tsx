import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/** 화면 상단 오류 안내. 백엔드가 준 message를 그대로 보여 준다 */
export function ErrorBanner({ title, message, actions }: { title?: string; message: string; actions?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-card border border-danger-line bg-danger-soft p-4 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-ink" />
        <div className="min-w-0">
          {title && <p className="m-0 font-semibold text-danger-ink">{title}</p>}
          <p className="m-0 text-sm text-ink">{message}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
