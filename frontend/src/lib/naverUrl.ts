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

/** 입력 즉시 보여 줄 안내. 비어 있거나 올바르면 null */
export function explainInvalidUrl(input: string): string | null {
  const raw = input.trim()
  if (!raw || parseNaverUrl(raw)) return null
  if (/(^|\/\/)naver\.me\//i.test(raw)) {
    return 'naver.me 단축 주소는 쓸 수 없습니다. 글을 열어 주소창의 전체 주소를 복사해 주세요.'
  }
  if (/(^|\/\/)(m\.)?blog\.naver\.com(\/|$)/i.test(raw)) {
    return '글 번호가 없는 주소입니다. 블로그 홈이 아니라 글 하나의 주소를 넣어 주세요.'
  }
  return '네이버 블로그 글 주소가 아닙니다. 다른 블로그 글은 "본문 직접 입력"을 써 주세요.'
}
