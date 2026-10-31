import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold leading-none no-underline whitespace-nowrap transition-[background-color,transform,box-shadow] duration-200 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent shadow-[0_10px_22px_-10px_rgba(14,117,102,0.7)] hover:-translate-y-0.5 hover:bg-accent-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink/50 disabled:shadow-none'),
  ghost: cx(base, 'border border-edge bg-white/70 text-ink hover:bg-white disabled:cursor-not-allowed disabled:text-ink/45'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-[14px] font-semibold text-accent underline underline-offset-[5px] hover:text-accent-hover disabled:text-ink/45 disabled:no-underline', focus),
}

export const field =
  'w-full rounded-full border border-transparent bg-transparent px-5 text-ink placeholder:text-placeholder focus:outline-none aria-invalid:text-danger-ink'

export const area =
  'w-full resize-y rounded-[20px] border border-edge bg-white/80 px-4 py-3 text-ink placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 aria-invalid:border-danger'
