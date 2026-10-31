import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'
const base = `inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-3.5 text-[13px] font-semibold no-underline whitespace-nowrap transition-colors duration-100 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-muted'),
  ghost: cx(base, 'border border-edge bg-surface text-ink hover:bg-panel-2 disabled:cursor-not-allowed disabled:text-muted'),
  danger: cx(base, 'border border-danger-line bg-danger-soft text-danger-ink hover:border-danger disabled:opacity-60'),
  quiet: cx(base, 'text-muted hover:bg-segment hover:text-ink disabled:opacity-50'),
}

export const field =
  'w-full rounded-control border border-edge bg-surface px-3 text-[14px] text-ink placeholder:text-placeholder transition-colors hover:border-[#b7bec8] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 aria-invalid:border-danger'
