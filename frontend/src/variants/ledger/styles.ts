import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-14 items-center justify-center gap-2.5 rounded-[16px] px-8 text-[18px] font-semibold no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-muted'),
  secondary: cx(base, 'border-2 border-edge bg-surface text-ink hover:border-ink disabled:cursor-not-allowed disabled:text-muted'),
  quiet: cx('inline-flex min-h-12 items-center gap-2 rounded-[12px] px-3 text-[17px] font-semibold text-muted no-underline hover:bg-panel-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50', focus),
}

export const field =
  'w-full rounded-[16px] border-2 border-edge bg-surface px-5 text-[20px] text-ink placeholder:text-placeholder transition-colors hover:border-[#b9b3a6] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 aria-invalid:border-danger'
