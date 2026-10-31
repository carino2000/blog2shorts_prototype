// 버튼·입력 공통 클래스. 주 버튼(accent 채움)은 한 화면에 하나만 쓴다(5장).

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimary = `${base} bg-accent text-on-accent hover:brightness-110 disabled:hover:brightness-100`

export const btnSecondary = `${base} border border-line bg-surface text-ink hover:border-accent hover:text-accent disabled:hover:border-line disabled:hover:text-ink`

export const btnDanger = `${base} border border-danger bg-surface text-danger-ink hover:bg-danger/10`

export const inputBase =
  'min-h-11 w-full rounded-control border border-line bg-surface px-3 text-base text-ink placeholder:text-muted ' +
  'focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
