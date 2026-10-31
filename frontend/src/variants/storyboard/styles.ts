import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-11 items-center justify-center gap-2 border px-5 text-[14px] font-bold leading-none no-underline whitespace-nowrap ${focus}`

export const btn = {
  primary: cx(base, 'border-accent bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-panel-2 disabled:text-placeholder'),
  ghost: cx(base, 'border-ink bg-surface text-ink hover:bg-panel-2 disabled:cursor-not-allowed disabled:border-line disabled:text-placeholder'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-[14px] font-bold text-accent underline underline-offset-[5px] hover:text-accent-hover disabled:text-placeholder disabled:no-underline', focus),
}

export const field = 'w-full border border-ink bg-surface px-3 text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-1 focus:outline-accent aria-invalid:border-danger'
