import { ServerOff } from 'lucide-react'
import { useHealth } from '../api/queries/useHealth'
import { ErrorBanner } from './ErrorBanner'

/** 로컬 개발용: /api/health가 실패하면 백엔드를 켜라고 안내한다 */
export function BackendDownNotice() {
  const health = useHealth()
  if (!health.isError) return null
  return (
    <ErrorBanner
      icon={ServerOff}
      title="백엔드 서버가 꺼져 있습니다"
      message="백엔드를 실행한 뒤 새로고침하세요."
    />
  )
}
