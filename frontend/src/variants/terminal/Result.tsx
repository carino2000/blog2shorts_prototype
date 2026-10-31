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
import { Alert, Block, Log, Out, Screen } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Done project={project} video={project.video} /> : <Render project={project} />)}
    </Shell>
  )
}

function Render({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <>
      <Block cmd="b2s render" label="렌더 로그">
        <Out>
          <h1 className="m-0 mb-2 text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-ink">{v.failed ? '렌더가 중단되었습니다.' : '영상을 만드는 중입니다.'}</h1>
          <p className="m-0 mb-3 text-[14px]" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
          </p>
          <Log items={v.items} />
        </Out>
      </Block>

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
    </>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
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

      <div className="flex min-w-0 flex-col gap-8">
        <Block cmd="b2s render --done" label="결과">
          <Out className="flex flex-col gap-3">
            <h1 id="done-title" className="m-0 text-[clamp(1.5rem,3.6vw,2.25rem)] font-bold text-accent">
              [ OK ] 영상이 완성되었습니다
            </h1>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5 text-[14px]">
              <dt>resolution</dt>
              <dd className="m-0 tabular-nums text-ink">
                {VIDEO_WIDTH}×{VIDEO_HEIGHT}
              </dd>
              <dt>format</dt>
              <dd className="m-0 text-ink">MP4</dd>
              <dt>duration</dt>
              <dd className="m-0 tabular-nums text-ink">{formatSec(v.durationSec)}</dd>
            </dl>
          </Out>
        </Block>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <Block cmd="b2s save">
          <Out className="flex flex-wrap items-center gap-x-5 gap-y-3">
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
          </Out>
        </Block>

        <Block cmd={`b2s render --quality ${v.other}`}>
          <Out className="flex flex-col gap-3">
            <p className="m-0 text-[14px] leading-[1.65]">
              {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
            </p>
            <button type="button" data-act="remake" className={cx(btn.ghost, 'self-start')} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
            </button>
            {v.remakeError && <Alert>{v.remakeError}</Alert>}
            <p className="m-0 text-[13px] leading-[1.7]"># 휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
          </Out>
        </Block>
      </div>
    </div>
  )
}
