import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-6 text-[16px] font-extrabold leading-none no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-placeholder'),
  ghost: cx(base, 'border-2 border-ink bg-white text-ink hover:bg-panel disabled:cursor-not-allowed disabled:border-line disabled:text-placeholder'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-[15px] font-bold text-accent underline underline-offset-[5px] hover:text-accent-hover disabled:text-placeholder disabled:no-underline', focus),
}

export const field = 'w-full rounded-control border-2 border-ink bg-white px-4 text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-2 focus:outline-accent aria-invalid:border-danger'
