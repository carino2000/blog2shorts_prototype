// 네이버 블로그 글 주소 검증 (frontend/CLAUDE.md 6-1, 백엔드 ① 1번과 같은 규칙)
// 허용: blog.naver.com/{id}/{logNo}, m.blog.naver.com/{id}/{logNo},
//       blog.naver.com/PostView.naver?blogId=&logNo= (.nhn 포함), https:// 생략
// 거부: naver.me 단축 링크, 글 번호 없는 블로그 홈, 타 도메인

export interface NaverPost {
  blogId: string
  logNo: string
}

const HOSTS = new Set(['blog.naver.com', 'm.blog.naver.com'])
const BLOG_ID = /^[A-Za-z0-9_-]+$/
const LOG_NO = /^\d+$/

export function parseNaverUrl(input: string): NaverPost | null {
  const raw = input.trim()
  if (!raw) return null

  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (!HOSTS.has(url.hostname.toLowerCase())) return null

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length === 1 && /^PostView\.(naver|nhn)$/i.test(segments[0] ?? '')) {
    const blogId = url.searchParams.get('blogId') ?? ''
    const logNo = url.searchParams.get('logNo') ?? ''
    return BLOG_ID.test(blogId) && LOG_NO.test(logNo) ? { blogId, logNo } : null
  }

  if (segments.length === 2) {
    const [blogId = '', logNo = ''] = segments
    return BLOG_ID.test(blogId) && LOG_NO.test(logNo) ? { blogId, logNo } : null
  }

  return null
}

export function isNaverPostUrl(input: string): boolean {
  return parseNaverUrl(input) !== null
}
