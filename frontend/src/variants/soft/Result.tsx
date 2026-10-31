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
import { Alert, Bubble, Chip, Glass, Pills } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Done project={project} video={project.video} /> : <Making project={project} />)}
    </Shell>
  )
}

function Making({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section aria-labelledby="sf-make" className="flex min-w-0 flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h1 id="sf-make" className="m-0 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-normal leading-[1.15]">
            {v.failed ? '영상 만들기가 멈췄어요.' : '영상을 만들고 있어요.'}
          </h1>
          <p className="m-0 max-w-lg text-[16px] leading-[1.8] text-muted" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄어요. 그 단계부터 다시 시도할 수 있어요.` : (v.message ?? '음성, 자막, 합성 순서로 진행해요.')}
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

        <Pills items={v.items} />
      </section>

      <aside aria-hidden="true" className="mx-auto w-full max-w-[16rem] lg:mx-0">
        <div className={v.failed ? undefined : 'sf-float'}>
          <Bubble>
            <div className="absolute inset-0 bg-gradient-to-b from-[#ffe0d1] via-[#d3e9ff] to-[#cdeedd]" />
          </Bubble>
        </div>
      </aside>
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-center gap-x-14 gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside aria-label="완성 영상" className="mx-auto w-full max-w-[16rem] lg:mx-0">
        <Bubble>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Bubble>
      </aside>

      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-7">
        <div className="flex flex-col gap-4">
          <h1 id="done-title" className="m-0 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.1]">
            영상이 <span className="text-accent">완성</span>됐어요.
          </h1>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <Chip>
                {VIDEO_WIDTH}×{VIDEO_HEIGHT}
              </Chip>
            </li>
            <li>
              <Chip>MP4</Chip>
            </li>
            <li>
              <Chip tone="accent">{formatSec(v.durationSec)}</Chip>
            </li>
          </ul>
        </div>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했어요. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-14 px-8 text-[16px]', v.videoFailed && 'pointer-events-none opacity-40')}
          >
            <Download aria-hidden="true" className="size-5" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            <Pencil aria-hidden="true" className="size-4" />
            장면 편집으로
          </VLink>
        </div>

        <Glass className="flex max-w-xl flex-col gap-3 p-6">
          <p className="m-0 text-[14px] leading-[1.7] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있어요. 시간이 조금 더 걸려요.' : '더 빠르게 다시 만들 수 있어요. 움직임이 조금 떨릴 수 있어요.'} 음성은 다시 만들지 않아요.
          </p>
          <button type="button" data-act="remake" className={cx(btn.ghost, 'self-start')} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </Glass>

        <p className="m-0 max-w-xl text-[13px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지돼요.</p>
      </section>
    </div>
  )
}
