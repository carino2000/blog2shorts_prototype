import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-11 items-center justify-center gap-2 border px-4 font-mono text-[13px] font-semibold uppercase leading-none tracking-[0.1em] no-underline whitespace-nowrap transition-colors duration-100 ${focus}`

export const btn = {
  primary: cx(base, 'border-accent bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-placeholder'),
  ghost: cx(base, 'border-edge bg-transparent text-ink hover:bg-panel-2 disabled:cursor-not-allowed disabled:text-placeholder'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-mono text-[13px] font-semibold uppercase tracking-[0.06em] text-hi underline underline-offset-[5px] hover:text-ink disabled:text-placeholder disabled:no-underline', focus),
}

export const field =
  'w-full border border-edge bg-bg px-3 text-ink placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent aria-invalid:border-danger'
