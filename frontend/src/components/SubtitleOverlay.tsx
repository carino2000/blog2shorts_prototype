import {
  SUBTITLE_BOTTOM_PX,
  SUBTITLE_GLYPH_PX,
  SUBTITLE_LINE_RATIO,
  SUBTITLE_MAX_LINES,
  SUBTITLE_OUTLINE_PX,
  SUBTITLE_SIDE_PX,
  cqh,
  cqw,
} from '../lib/render'

/**
 * 렌더 자막과 같은 모양: Noto Sans KR Bold, 흰 글자 + 검은 외곽선, 가운데, 하단 360/1920, ASS 크기 64(글자 약 44px), 최대 2줄.
 * PhoneFrame 안(container-type: size)에서만 쓴다.
 */
export function SubtitleOverlay({ text }: { text: string }) {
  if (!text) return null
  return (
    <div
      className="pointer-events-none absolute text-center"
      style={{ bottom: cqh(SUBTITLE_BOTTOM_PX), left: cqw(SUBTITLE_SIDE_PX), right: cqw(SUBTITLE_SIDE_PX) }}
      aria-hidden="true"
    >
      <p
        className="m-0 font-bold break-keep text-white"
        style={{
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: cqh(SUBTITLE_GLYPH_PX),
          lineHeight: SUBTITLE_LINE_RATIO,
          // ASS 외곽선은 글자 바깥으로 4px. CSS stroke는 가운데 기준이라 2배로 그리고 글자를 위에 칠한다
          WebkitTextStroke: `calc(${cqh(SUBTITLE_OUTLINE_PX)} * 2) #000`,
          paintOrder: 'stroke fill',
          display: '-webkit-box',
          WebkitLineClamp: SUBTITLE_MAX_LINES,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </p>
    </div>
  )
}
