import { Download, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { formatSec } from '../../lib/duration'
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { VLink } from '../shared/VLink'
import { resultMode, useDoneView, useRenderingView } from '../shared/useResultView'
import { Shell } from './Shell'
import { btn } from './styles'
import { Huge, Lines, Notice, Wall } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Exhibit project={project} video={project.video} /> : <Hanging project={project} />)}
    </Shell>
  )
}

function Hanging({ project }: { project: Project }) {
  const v = useRenderingView(project)
  const active = v.items.find((i) => i.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null
  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-20 px-5 pb-32 pt-16 sm:px-10 sm:pt-28">
      <div className="flex flex-col gap-8">
        <Huge>{v.failed ? '멈췄습니다.' : pct !== null ? `${pct}%` : '만드는 중.'}</Huge>
        <p className="m-0 max-w-lg text-[18px] font-light leading-[1.8] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <Notice
          title={`${v.failedLabel} 단계 실패`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.link} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {v.retryPending ? '요청 중' : `${v.failedLabel}부터 다시`}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
                장면 편집
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Notice>
      )}
      {v.retryError && <Notice>{v.retryError}</Notice>}

      <div className="max-w-3xl">
        <Lines items={v.items} />
      </div>
    </main>
  )
}

function Exhibit({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <main className="mx-auto grid max-w-[1500px] items-center gap-x-24 gap-y-14 px-5 pb-32 pt-12 sm:px-10 sm:pt-20 lg:grid-cols-[minmax(0,min(26rem,calc((100dvh-9rem)*0.5625)))_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-[24rem] lg:mx-0">
        <Stage>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Stage>
      </div>

      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-12">
        <div className="flex flex-col gap-6">
          <Wall>
            {VIDEO_WIDTH} × {VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
          </Wall>
          <Huge id="done-title">완성.</Huge>
        </div>

        {v.videoFailed && <Notice tone="note">영상을 불러오지 못했습니다. 새로고침하거나 편집에서 다시 만들어 주세요.</Notice>}

        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, v.videoFailed && 'pointer-events-none opacity-25')}
          >
            <Download aria-hidden="true" className="size-4" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            장면 편집으로
          </VLink>
        </div>

        <div className="flex max-w-lg flex-col gap-4 border-t border-line pt-8">
          <p className="m-0 text-[16px] font-light leading-[1.8] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.link} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
            </button>
          </div>
          {v.remakeError && <Notice>{v.remakeError}</Notice>}
          <p className="m-0 text-[13px] leading-[1.8] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
        </div>
      </section>
    </main>
  )
}
