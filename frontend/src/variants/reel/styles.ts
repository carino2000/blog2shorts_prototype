import { cx } from '../../lib/ui'

const focus = 'focus-visible:outline-[3px] focus-visible:outline-offset-3 focus-visible:outline-ink'
const base = `inline-flex min-h-14 items-center justify-center gap-3 px-8 font-display text-[22px] leading-none no-underline whitespace-nowrap transition-transform duration-150 active:translate-y-0.5 ${focus}`

export const btn = {
  primary: cx(base, 'bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40'),
  ghost: cx(base, 'border-[3px] border-ink bg-transparent text-ink hover:bg-ink hover:text-bg disabled:cursor-not-allowed disabled:opacity-40'),
  /** 반전 상자(오류) 안의 버튼 */
  onInk: cx(base, 'border-[3px] border-bg bg-transparent text-bg hover:bg-bg hover:text-ink'),
  link: cx('inline-flex min-h-12 items-center gap-2 font-display text-[20px] text-ink underline decoration-[3px] underline-offset-[6px] hover:no-underline disabled:opacity-40', focus),
}

export const field =
  'w-full border-0 border-b-[5px] border-ink bg-transparent px-0 py-3 text-ink placeholder:text-placeholder focus:border-b-[10px] focus:outline-none aria-invalid:border-dashed'

export const TONE = { hook: 'coral', body: 'cobalt', cta: 'lime' } as const
