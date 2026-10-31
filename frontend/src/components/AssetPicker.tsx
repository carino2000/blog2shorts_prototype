import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/** 좁은 화면용 이미지 선택 시트. 네이티브 dialog라 Esc·포커스 가두기를 브라우저가 처리한다 */
export function AssetPicker({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // 바깥(배경) 누르면 닫기
      }}
      aria-label={title}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-[16px] border-0 bg-surface p-0 text-ink backdrop:bg-black/50 md:m-auto md:max-w-lg md:rounded-card"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-1">
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-control text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent-bright"
          aria-label="닫기"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-4">{children}</div>
    </dialog>
  )
}
