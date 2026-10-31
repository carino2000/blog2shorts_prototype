const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
const base = `inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold no-underline whitespace-nowrap transition-colors duration-150 ${focus}`

export const btn = {
  primary: `${base} bg-accent text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted`,
  ghost: `${base} border border-edge bg-transparent text-ink hover:bg-panel-2 disabled:cursor-not-allowed disabled:text-muted`,
  danger: `${base} border border-danger-line bg-danger-soft text-danger-ink hover:border-danger disabled:opacity-60`,
}

export const field =
  'w-full rounded-control border border-edge bg-bg px-3.5 text-[15px] text-ink placeholder:text-placeholder transition-colors hover:border-[#3a4150] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 aria-invalid:border-danger'

/** mm:ss (소수 없이) */
export function tc(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** 영상 화면 겉틀: 얇은 테두리와 깊은 그림자(모니터) */
export function monitorClass(): string {
  return 'rounded-[6px] ring-1 ring-edge shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)]'
}
