import { Download, Pencil, RotateCcw, Sparkles, Zap } from 'lucide-react'
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
import { btn, monitorClass } from './styles'
import { Alert, Eyebrow, Queue } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Screening project={project} video={project.video} /> : <RenderQueue project={project} />)}
    </Shell>
  )
}

function RenderQueue({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Eyebrow step={4}>{v.failed ? '중단' : '렌더 중'}</Eyebrow>
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.01em]">{v.failed ? '렌더가 멈췄습니다.' : '영상을 뽑고 있습니다.'}</h1>
        <p className="m-0 text-sm leading-relaxed text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <Alert
          title={`${v.failedLabel} 단계 실패`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {v.retryPending ? '요청 중…' : `${v.failedLabel}부터 다시`}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.ghost}>
                <Pencil aria-hidden="true" className="size-4" />
                편집실로
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Alert>
      )}
      {v.retryError && <Alert>{v.retryError}</Alert>}

      <Queue items={v.items} />
    </div>
  )
}

function Screening({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  const OtherIcon = v.other === 'smooth' ? Sparkles : Zap

  const specs: [string, string][] = [
    ['해상도', `${VIDEO_WIDTH} × ${VIDEO_HEIGHT} (9:16)`],
    ['형식', 'MP4'],
    ['길이', formatSec(v.durationSec)],
    ['장면', `${project.scenes.length}개`],
  ]

  return (
    <div className="grid items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
      <div className="mx-auto w-full max-w-[300px] md:mx-0 md:w-[min(340px,38vw)] md:max-w-none">
        <div className={cx('overflow-hidden bg-black p-1.5', monitorClass())}>
          <Stage className="rounded-[3px]">
            {v.videoFailed ? (
              <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
            ) : (
              <video
                key={v.videoKey}
                src={v.videoSrc}
                poster={v.poster}
                controls
                playsInline
                preload="metadata"
                onError={() => v.setVideoFailed(true)}
                className="absolute inset-0 size-full bg-black object-contain"
              />
            )}
          </Stage>
        </div>
      </div>

      <section aria-labelledby="done-title" className="flex max-w-xl flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Eyebrow step={4} tone="cta">완성</Eyebrow>
          <h1 id="done-title" className="m-0 text-[32px] font-bold leading-tight tracking-[-0.02em]">
            영상이 완성되었습니다.
          </h1>
        </div>

        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 border-y border-edge py-4 text-sm">
          {specs.map(([k, val]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="m-0 tabular-nums text-ink">{val}</dd>
            </div>
          ))}
        </dl>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침해 보거나 편집실에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-12 px-6', v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-4" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.ghost, 'min-h-12 px-5')}>
            <Pencil aria-hidden="true" className="size-4" />
            편집실로 돌아가기
          </VLink>
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-edge bg-panel p-4">
          <p className="m-0 text-sm leading-relaxed">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 뽑을 수 있어요. 시간이 조금 더 걸립니다.' : '더 빨리 다시 뽑을 수 있어요. 움직임이 조금 떨릴 수 있습니다.'}{' '}
            <span className="text-muted">음성은 다시 만들지 않습니다.</span>
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
              <OtherIcon aria-hidden="true" className="size-4" />
              {v.remakePending ? '요청 중…' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 뽑기`}
            </button>
          </div>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 text-[13px] leading-relaxed text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>
    </div>
  )
}
