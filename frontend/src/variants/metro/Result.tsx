import { Download, Pencil, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { formatSec } from '../../lib/duration'
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../lib/render'
import { cx } from '../../lib/ui'
import { VLink } from '../shared/VLink'
import { resultMode, useDoneView, useRenderingView } from '../shared/useResultView'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Route, Screen, Sign } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Arrived project={project} video={project.video} /> : <Running project={project} />)}
    </Shell>
  )
}

function Running({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <section aria-labelledby="mt-run" className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 id="mt-run" className="m-0 font-display text-[clamp(2rem,4.6vw,3rem)] font-normal leading-[1.15]">
          {v.failed ? '열차가 멈췄습니다.' : '종착역을 향해 달리는 중입니다.'}
        </h1>
        <p className="m-0 text-[16px] leading-[1.75] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <Alert
          title={`${v.failedLabel} 단계 중단`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {v.retryPending ? '요청 중' : `${v.failedLabel}부터 다시`}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
                장면 편집으로
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Alert>
      )}
      {v.retryError && <Alert>{v.retryError}</Alert>}

      <Route items={v.items} />
    </section>
  )
}

function Arrived({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside aria-label="완성 영상" className="mx-auto w-full max-w-[15rem] lg:mx-0">
        <Screen>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Screen>
      </aside>

      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-6">
        <Sign className="flex flex-col gap-3">
          <p className="m-0 text-[13px] font-bold text-white/80">종착역 · 도착</p>
          <h1 id="done-title" className="m-0 font-display text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.15]">
            영상이 도착했습니다
          </h1>
          <p className="m-0 text-[15px] tabular-nums text-white/90">
            {VIDEO_WIDTH}×{VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
          </p>
        </Sign>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-14 px-8 text-[18px]', v.videoFailed && 'pointer-events-none opacity-40')}
          >
            <Download aria-hidden="true" className="size-5" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            <Pencil aria-hidden="true" className="size-4" />
            장면 편집으로
          </VLink>
        </div>

        <div className="flex max-w-xl flex-col gap-3 rounded-card border-[3px] border-ink p-4">
          <p className="m-0 text-[15px] leading-[1.65] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <button type="button" data-act="remake" className={cx(btn.ghost, 'self-start')} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 max-w-xl text-[14px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>
    </div>
  )
}
