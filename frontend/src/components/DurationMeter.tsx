import { TriangleAlert } from 'lucide-react'
import { MAX_VIDEO_SEC, MIN_VIDEO_SEC, durationRange, formatSec } from '../lib/duration'
import { cx } from '../lib/ui'

const SCALE_MAX = 75

/** 전체 예상 길이와 30~60초 권장 구간 막대. 범위를 벗어나면 경고 색 + 안내 */
export function DurationMeter({ seconds, actual = false }: { seconds: number; actual?: boolean }) {
  const range = durationRange(seconds)
  const pos = (s: number) => `${(Math.min(s, SCALE_MAX) / SCALE_MAX) * 100}%`
  const warn = range !== 'ok'

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="m-0 text-sm">
          <span className="text-muted">{actual ? '전체 길이' : '전체 예상 길이'} </span>
          <span className={cx('font-semibold tabular-nums', warn ? 'text-danger' : 'text-ink')}>{formatSec(seconds)}</span>
        </p>
        <p className="m-0 text-xs text-muted tabular-nums">
          권장 {MIN_VIDEO_SEC}~{MAX_VIDEO_SEC}초
        </p>
      </div>
      <div className="relative h-2 rounded-full bg-line" aria-hidden="true">
        <div
          className="absolute inset-y-0 rounded-full bg-cta/30"
          style={{ left: pos(MIN_VIDEO_SEC), width: `calc(${pos(MAX_VIDEO_SEC)} - ${pos(MIN_VIDEO_SEC)})` }}
        />
        <div
          className={cx('absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full', warn ? 'bg-danger' : 'bg-accent')}
          style={{ left: pos(seconds) }}
        />
      </div>
      {warn && (
        <p className="m-0 flex items-center gap-1.5 text-sm text-danger">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {range === 'short' ? `${MIN_VIDEO_SEC}초보다 짧습니다. 문구를 늘리세요.` : `${MAX_VIDEO_SEC}초를 넘습니다. 문구를 줄이세요.`}
        </p>
      )}
    </div>
  )
}
