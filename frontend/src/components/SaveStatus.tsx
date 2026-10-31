import { Check, CircleAlert, Loader2 } from 'lucide-react'
import type { SaveState } from '../api/queries/useUpdateScenes'

/** 자동 저장 상태: 저장 중 / 저장됨 / 실패 */
export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  return (
    <p className="m-0 flex min-h-11 items-center gap-1.5 text-sm" role="status" aria-live="polite">
      {(state === 'pending' || state === 'saving') && (
        <>
          <Loader2 aria-hidden="true" className="size-4 text-muted motion-safe:animate-spin" />
          <span className="text-muted">저장 중</span>
        </>
      )}
      {state === 'saved' && (
        <>
          <Check aria-hidden="true" className="size-4 text-cta" />
          <span className="text-muted">저장됨</span>
        </>
      )}
      {state === 'error' && (
        <>
          <CircleAlert aria-hidden="true" className="size-4 text-danger-ink" />
          <span className="text-danger-ink">저장 실패</span>
          <button type="button" onClick={onRetry} className="min-h-11 px-1 text-sm font-medium text-accent underline">
            다시 저장
          </button>
        </>
      )}
    </p>
  )
}
