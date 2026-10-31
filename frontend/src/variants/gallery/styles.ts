import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink'

export const btn = {
  /** 작은 검은 직사각형 하나 */
  primary: cx('inline-flex min-h-12 items-center justify-center gap-3 bg-ink px-7 text-[15px] font-medium no-underline whitespace-nowrap text-bg transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-25', focus),
  /** 글자에 밑줄만 */
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-[15px] font-medium text-ink underline decoration-1 underline-offset-[6px] hover:decoration-2 disabled:cursor-not-allowed disabled:text-muted disabled:no-underline', focus),
  quiet: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-[14px] text-muted no-underline hover:text-ink disabled:opacity-30', focus),
}

export const WALL = 'text-[11px] font-medium uppercase leading-snug tracking-[0.14em]'
