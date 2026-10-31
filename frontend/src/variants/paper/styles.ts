import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-center gap-2 rounded-[12px] px-6 font-display text-[22px] font-bold leading-none no-underline whitespace-nowrap transition-[transform,background-color] duration-150 active:translate-y-px ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent shadow-[0_3px_0_#7d3818] hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted disabled:shadow-none'),
  ghost: cx(base, 'border-2 border-dashed border-ink/60 bg-transparent text-ink hover:border-solid hover:bg-panel-2 disabled:cursor-not-allowed disabled:text-muted'),
  quiet: cx('inline-flex min-h-11 items-center gap-1.5 px-2 font-display text-[20px] font-bold leading-none text-muted underline decoration-dotted decoration-2 underline-offset-[6px] hover:text-ink disabled:opacity-50', focus),
}

/** 줄 공책에 쓰듯 밑줄만 있는 입력 */
export const field =
  'w-full border-0 border-b-2 border-dashed border-ink/50 bg-transparent px-1 py-2 text-ink placeholder:text-placeholder focus:border-solid focus:border-accent focus:outline-none aria-invalid:border-danger'

export const NOTE = 'paper-note relative rounded-[4px]'
