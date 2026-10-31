import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-12 items-center justify-between gap-6 px-5 text-[16px] font-bold leading-none no-underline whitespace-nowrap transition-colors duration-100 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-ink disabled:cursor-not-allowed disabled:bg-line disabled:text-muted'),
  ghost: cx(base, 'border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:border-line disabled:text-muted'),
  link: cx('inline-flex min-h-11 items-center gap-2 text-[15px] font-bold text-ink underline decoration-2 underline-offset-[5px] hover:text-accent disabled:text-muted', focus),
}

export const field =
  'w-full border-2 border-ink bg-bg px-4 text-[18px] font-medium text-ink placeholder:font-normal placeholder:text-placeholder focus:border-accent focus:outline-none focus:ring-0 aria-invalid:border-accent aria-invalid:bg-accent-soft'
