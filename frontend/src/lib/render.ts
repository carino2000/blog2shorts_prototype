import type { Scene } from '../api/types'

// 렌더 기준값. 백엔드 CLAUDE.md 5장 ⑥(자막)·⑦(렌더)과 같은 값이어야 미리보기가 결과물과 같다.
// 미리보기는 이 값을 프레임 크기에 대한 비율로 쓴다(1080×1920 기준 px).

export const VIDEO_WIDTH = 1080
export const VIDEO_HEIGHT = 1920

/** ⑥ 자막: 크기 88, 외곽선 5, 하단에서 360px 위, 좌우 여백 60, 가운데 정렬, 최대 2줄 */
export const SUBTITLE_FONT_PX = 88
/**
 * ASS의 크기 88은 글자 크기가 아니라 줄 높이(폰트 ascent + descent)다. Noto Sans KR은 그 값이 글자 크기의 1.448배라
 * 렌더 글자 크기는 약 61px이다. CSS는 글자 크기를 받으므로 나눠서 쓴다.
 */
export const SUBTITLE_LINE_RATIO = 1.448
export const SUBTITLE_GLYPH_PX = SUBTITLE_FONT_PX / SUBTITLE_LINE_RATIO
export const SUBTITLE_SIDE_PX = 60
export const SUBTITLE_OUTLINE_PX = 5
export const SUBTITLE_BOTTOM_PX = 360
export const SUBTITLE_MAX_LINES = 2
/** 자막 한 덩어리 최대 글자 수(⑥의 분할 기준, 공백 포함) */
export const SUBTITLE_CHUNK_CHARS = 14

/** ⑦ 흐린 배경 boxblur=20:2 (가로 1080 기준 반경) */
export const BG_BLUR_PX = 20

/** ⑦ 모션: zoom 1 → 1.12, pan은 1.12 배율에서 가로 이동 */
export const MOTION_ZOOM = 1.12

/** 1080×1920 기준 px → 프레임 높이 기준 cqh 값 (프레임에 container-type: size 필요) */
export function cqh(px: number): string {
  return `${(px / VIDEO_HEIGHT) * 100}cqh`
}

/** 1080×1920 기준 px → 프레임 너비 기준 cqw 값 */
export function cqw(px: number): string {
  return `${(px / VIDEO_WIDTH) * 100}cqw`
}

/**
 * 백엔드 split_chunks와 같은 규칙: 문장부호 뒤 공백에서 나누고(160,000은 안 나뉜다), 14자를 넘으면 어절로,
 * 어절 하나가 14자를 넘으면 글자 단위로 자른다.
 */
export function splitSubtitleChunks(text: string): string[] {
  const chunks: string[] = []
  const length = (s: string) => [...s].length
  for (const part of text.trim().split(/\s+/).join(' ').split(/(?<=[.?!,])\s+/)) {
    let current = ''
    for (const word of part.split(' ')) {
      const candidate = `${current} ${word}`.trim()
      if (current && length(candidate) > SUBTITLE_CHUNK_CHARS) {
        chunks.push(current)
        current = word
      } else {
        current = candidate
      }
      while (length(current) > SUBTITLE_CHUNK_CHARS) {
        const chars = [...current]
        chunks.push(chars.slice(0, SUBTITLE_CHUNK_CHARS).join(''))
        current = chars.slice(SUBTITLE_CHUNK_CHARS).join('')
      }
    }
    if (current) chunks.push(current)
  }
  return chunks
}

/** 렌더 전 미리보기 자막: 렌더했을 때 나올 첫 덩어리 */
export function previewSubtitle(text: string): string {
  return splitSubtitleChunks(text)[0] ?? ''
}

/** 미리보기 자막: 렌더 전엔 문구 앞부분, 렌더 후엔 첫 자막 덩어리(6-4) */
export function sceneSubtitle(scene: Pick<Scene, 'text' | 'subtitles'>): string {
  return scene.subtitles[0]?.text ?? previewSubtitle(scene.text)
}
