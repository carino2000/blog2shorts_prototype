import { Check, Palette } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { VARIANTS, findVariant } from './registry'
import { switchVariantHref } from './url'
import { useVariantId } from './useVariant'

/**
 * 왼쪽 아래 작은 전환 패널(회의용). 시안과 상관없이 같은 모양으로 보이게 자체 색을 쓴다.
 * 접힌 모습은 44px 버튼 하나라 시안의 아래 고정 바는 왼쪽을 `sw-inset`만큼 비운다.
 */
export function VariantSwitcher() {
  const current = useVariantId()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const entry = findVariant(current)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  return (
    <div ref={root} className="switcher fixed bottom-3 left-3 z-[60] flex flex-col items-start gap-2 font-sans text-[#f3f4f6]">
      {open && (
        <nav
          id={panelId}
          aria-label="디자인 시안"
          className="max-h-[min(70dvh,34rem)] w-[min(17.5rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-[#343942] bg-[#14161a] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
        >
          <p className="m-0 px-2.5 pb-1 pt-1.5 text-xs text-[#aab0bb]">디자인 시안 · 주소의 ?v=로 공유됩니다</p>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {VARIANTS.map((v) => (
              <li key={v.id}>
                <Link
                  to={switchVariantHref(location.pathname, location.search, v.id)}
                  aria-current={v.id === current ? 'true' : undefined}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2.5 py-1.5 text-[#f3f4f6] no-underline hover:bg-[#23262d] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#7fa8ff] aria-[current=true]:bg-[#23262d]"
                >
                  <span aria-hidden="true" className="flex h-6 w-9 shrink-0 overflow-hidden rounded-md border border-[#4a505b]">
                    {v.swatch.map((c, i) => (
                      <span key={i} className="flex-1" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight">{v.name}</span>
                    <span className="block text-xs leading-tight text-[#aab0bb]">{v.mood}</span>
                  </span>
                  {v.id === current && <Check aria-hidden="true" className="size-4 shrink-0 text-[#7fa8ff]" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`디자인 시안 전환, 지금 ${entry?.name ?? ''}`}
        title={`시안: ${entry?.name ?? ''}`}
        onClick={() => setOpen((o) => !o)}
        className="flex size-11 items-center justify-center rounded-xl border border-[#343942] bg-[#14161a] text-[#f3f4f6] shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:bg-[#23262d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7fa8ff]"
      >
        <Palette aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
