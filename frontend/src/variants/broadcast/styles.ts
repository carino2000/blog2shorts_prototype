import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi'
const base = `inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 font-display text-[18px] font-semibold uppercase leading-none tracking-[0.08em] no-underline whitespace-nowrap transition-colors duration-100 ${focus}`

export const btn = {
  /** 송출(TAKE) 버튼 */
  take: cx(base, 'min-h-14 bg-accent px-7 py-1 text-[22px] text-on-accent shadow-[0_0_0_1px_#000,0_4px_0_#7d1a12] hover:bg-accent-hover active:translate-y-px active:shadow-[0_0_0_1px_#000,0_3px_0_#7d1a12] disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted disabled:shadow-none'),
  primary: cx(base, 'bg-hi text-on-hi hover:brightness-110 disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted'),
  ghost: cx(base, 'border border-edge bg-panel-2 text-ink hover:border-muted disabled:cursor-not-allowed disabled:text-muted'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-sans text-[14px] font-semibold text-hi underline underline-offset-[5px] hover:text-ink disabled:text-muted disabled:no-underline', focus),
}

export const field =
  'w-full rounded-control border border-edge bg-bg px-3 text-[15px] text-ink placeholder:text-placeholder focus:border-hi focus:outline-none focus:ring-1 focus:ring-hi aria-invalid:border-danger'
