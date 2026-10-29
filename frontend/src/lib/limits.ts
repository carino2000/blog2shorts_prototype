// 입력 제한값. 백엔드 검사와 같은 값(통합기획서 6-2, frontend/CLAUDE.md 6장)

/** 🟡 본문 직접 입력 최소 글자 수 */
export const MIN_TEXT_CHARS = 200

/** 업로드: jpg/png/webp, 10MB */
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024

/** 클라이언트에서 먼저 검사. 문제가 없으면 null */
export function checkUpload(file: { type: string; size: number }): string | null {
  if (!(UPLOAD_TYPES as readonly string[]).includes(file.type)) return 'jpg, png, webp 이미지만 올릴 수 있습니다.'
  if (file.size > UPLOAD_MAX_BYTES) return '10MB 이하 이미지만 올릴 수 있습니다.'
  return null
}
