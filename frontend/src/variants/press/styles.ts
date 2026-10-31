import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink'
const base = `inline-flex min-h-11 items-center justify-center gap-2 px-5 text-[15px] font-semibold no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: cx(base, 'border border-ink bg-ink text-bg hover:bg-bg hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-muted'),
  ghost: cx(base, 'border border-ink bg-transparent text-ink hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:border-line disabled:text-muted'),
  /** 검은 바탕(오류 박스, 확인 단계) 위의 버튼 */
  onInk: cx(base, 'border border-bg bg-transparent text-bg hover:bg-bg hover:text-ink disabled:cursor-not-allowed disabled:opacity-60'),
  link: cx('inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-1 underline-offset-4 hover:decoration-2 disabled:text-muted', focus),
}

/** 밑줄만 있는 입력(투고란) */
export const field =
  'w-full border-0 border-b-2 border-ink bg-transparent px-0 py-2 font-serif text-ink placeholder:text-placeholder focus:border-b-[4px] focus:outline-none aria-invalid:border-dashed'

export const rule = 'border-t border-ink'
