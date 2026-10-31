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
import { Alert, Heading, Screen, Tasks, Win } from './ui'

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
    <div className="flex max-w-3xl flex-col gap-5">
      <Heading>{v.failed ? '영상 만들기가 멈췄습니다' : '영상을 만드는 중입니다…'}</Heading>

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

      <Win title="진행 상황" bodyClassName="flex flex-col gap-4">
        <p className="m-0 text-[14px] leading-[1.7] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
        <Tasks items={v.items} />
      </Win>
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <Win title="완성.mp4" className="mx-auto w-full max-w-[17rem] lg:mx-0" bodyClassName="!p-3">
        <Screen>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Screen>
      </Win>

      <div className="flex min-w-0 flex-col gap-5">
        <h1 id="done-title" className="dk-win m-0 inline-block self-start bg-surface px-3 py-1 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight">
          영상이 완성되었습니다
        </h1>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <Win title="파일 정보" bodyClassName="flex flex-col gap-4">
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[13px]">
            <dt className="text-muted">해상도</dt>
            <dd className="m-0 tabular-nums">
              {VIDEO_WIDTH}×{VIDEO_HEIGHT}
            </dd>
            <dt className="text-muted">형식</dt>
            <dd className="m-0">MP4</dd>
            <dt className="text-muted">길이</dt>
            <dd className="m-0 tabular-nums">{formatSec(v.durationSec)}</dd>
          </dl>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              data-act="download"
              href={v.videoFailed ? undefined : v.downloadHref}
              download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
              aria-disabled={v.videoFailed || undefined}
              className={cx(btn.primary, 'min-h-12 px-6', v.videoFailed && 'pointer-events-none opacity-40')}
            >
              <Download aria-hidden="true" className="size-4" />
              MP4 내려받기
            </a>
            <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
              <Pencil aria-hidden="true" className="size-4" />
              장면 편집으로
            </VLink>
          </div>
        </Win>

        <Win title="다시 만들기" bodyClassName="flex flex-col gap-3">
          <p className="m-0 text-[14px] leading-[1.65] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <button type="button" data-act="remake" className={cx(btn.ghost, 'self-start')} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </Win>

        <p className="dk-win m-0 max-w-xl bg-surface px-4 py-3 text-[13px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </div>
    </div>
  )
}
