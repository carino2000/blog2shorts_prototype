import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold leading-none no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/60'),
  ghost: cx(base, 'border border-white/40 bg-black/40 text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:text-white/50'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 text-[14px] font-semibold text-accent underline underline-offset-[5px] hover:text-accent-hover disabled:text-white/50 disabled:no-underline', focus),
}

export const field = 'w-full rounded-2xl border border-white/30 bg-black/60 px-4 text-white placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 aria-invalid:border-danger'
