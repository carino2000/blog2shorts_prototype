// 시안 전용 웹폰트(Google Fonts <link>). 그 시안을 처음 열 때만 불러온다.
const loaded = new Set<string>()

export function loadFonts(...families: string[]): void {
  if (typeof document === 'undefined') return
  for (const family of families) {
    if (loaded.has(family)) continue
    loaded.add(family)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
    document.head.appendChild(link)
  }
}
