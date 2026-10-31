import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-center gap-3 px-8 font-display text-[18px] font-bold leading-none tracking-[0.04em] no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted'),
  ghost: cx(base, 'border border-accent/70 bg-transparent text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:border-edge disabled:text-muted'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-[15px] text-accent underline decoration-1 underline-offset-[6px] hover:text-accent-hover disabled:text-muted disabled:no-underline', focus),
}

export const field =
  'w-full border-0 border-b border-accent/60 bg-transparent px-1 text-ink placeholder:text-placeholder focus:border-b-2 focus:border-accent focus:outline-none aria-invalid:border-danger'

export const LABEL = 'font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-accent'
