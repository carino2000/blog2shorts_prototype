/** 네트워크 지연 흉내. 화면의 로딩 상태가 보이도록 */
export function latency(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
