import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `dk-key inline-flex min-h-11 items-center justify-center gap-2 px-5 text-[14px] font-semibold leading-none no-underline whitespace-nowrap ${focus}`

export const btn = {
  primary: cx(base, '!bg-accent !text-on-accent !shadow-[inset_1px_1px_0_#6a7bb0,inset_-1px_-1px_0_#141c36] hover:!bg-accent-hover disabled:cursor-not-allowed disabled:!bg-panel-2 disabled:!text-placeholder disabled:!shadow-none'),
  ghost: cx(base, 'text-ink hover:bg-white disabled:cursor-not-allowed disabled:text-placeholder'),
  link: cx('inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-[14px] font-semibold text-accent underline underline-offset-[5px] hover:text-accent-hover disabled:text-placeholder disabled:no-underline', focus),
}

export const field = 'dk-sunk w-full px-3 text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-1 focus:outline-accent aria-invalid:border-danger'
