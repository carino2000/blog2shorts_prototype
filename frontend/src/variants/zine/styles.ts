import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-[4px] focus-visible:outline-offset-4 focus-visible:outline-ink'
const press =
  'transition-[transform,box-shadow] duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#0a0a0a] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none motion-reduce:transition-none'
const base = `inline-flex min-h-12 items-center justify-center gap-2.5 border-[3px] border-ink px-6 font-display text-[22px] leading-none no-underline whitespace-nowrap shadow-[5px_5px_0_#0a0a0a] ${press} ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-muted disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0'),
  ghost: cx(base, 'bg-surface text-ink hover:bg-hi disabled:cursor-not-allowed disabled:text-muted disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0'),
  /** 검은 상자(오류) 안의 버튼 */
  onInk: cx(base, 'border-bg bg-transparent text-bg shadow-[5px_5px_0_var(--hi)] hover:bg-hi hover:text-ink'),
  link: cx('inline-flex min-h-11 items-center gap-2 font-display text-[20px] text-ink underline decoration-[4px] decoration-hi underline-offset-4 hover:bg-hi disabled:opacity-50', focus),
}

export const field =
  'w-full border-[3px] border-ink bg-surface px-4 text-[19px] font-semibold text-ink shadow-[5px_5px_0_#0a0a0a] placeholder:font-medium placeholder:text-placeholder focus:bg-[#fffbd0] focus:outline-none aria-invalid:bg-danger-soft'

export const BOX = 'border-[3px] border-ink bg-surface shadow-[6px_6px_0_#0a0a0a]'
