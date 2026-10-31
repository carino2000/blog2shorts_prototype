// 버튼·입력 공통 클래스. 주 버튼(accent 채움)은 한 화면에 하나만 쓴다(5장). 상태: hover·active·focus·disabled, 입력은 invalid까지.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright'

const base =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-control px-5 text-card font-semibold no-underline ' +
  'transition duration-200 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0 ' +
  focusRing

export const btnPrimary = `${base} bg-accent text-on-accent hover:bg-accent-hover disabled:bg-line disabled:text-muted`

export const btnSecondary = `${base} border border-line bg-surface text-ink hover:border-muted/50 hover:bg-bg disabled:text-muted disabled:hover:border-line disabled:hover:bg-surface`

export const btnDanger = `${base} border border-danger-line bg-surface text-danger-ink hover:border-danger hover:bg-danger-soft disabled:opacity-60`

/** 입력 15px(휴대폰은 iOS 입력 확대를 막으려고 16px), 높이는 버튼과 같은 48px */
export const inputBase =
  'min-h-12 w-full rounded-control border border-line bg-surface px-3.5 text-base text-ink transition duration-200 ease-out sm:text-card ' +
  'placeholder:text-placeholder hover:border-muted/50 focus:border-accent-bright focus:outline-none focus:ring-3 focus:ring-accent-bright/15 ' +
  'disabled:cursor-not-allowed disabled:bg-bg disabled:text-muted ' +
  'aria-invalid:border-danger aria-invalid:focus:border-danger aria-invalid:focus:ring-danger/15'

/** 움직이는 카드: 살짝 뜨고 테두리가 진해진다. 그림자는 hover에서만 */
export const cardHover =
  'transition duration-200 ease-out hover:-translate-y-0.5 hover:border-muted/40 hover:shadow-card'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
