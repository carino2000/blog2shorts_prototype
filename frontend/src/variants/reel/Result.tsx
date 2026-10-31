import { Download, Pencil, RotateCcw } from 'lucide-react'
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
import { Alert, Giant, Words } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result" tone={(p) => (resultMode(p) === 'done' ? 'lime' : p.status === 'error' ? 'coral' : 'cobalt')}>
      {(project) => (resultMode(project) === 'done' && project.video ? <Premiere project={project} video={project.video} /> : <Rendering project={project} />)}
    </Shell>
  )
}

function Rendering({ project }: { project: Project }) {
  const v = useRenderingView(project)
  const active = v.items.find((i) => i.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <Giant>{v.failed ? '멈췄다.' : '뽑는 중.'}</Giant>
        {!v.failed && pct !== null && <p className="m-0 font-display text-[clamp(4rem,14vw,9rem)] leading-none tabular-nums">{pct}%</p>}
      </div>
      <p className="m-0 max-w-xl text-[20px] font-semibold leading-[1.55]" aria-live="polite">
        {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 할 수 있습니다.` : (v.message ?? '음성, 자막, 합치기 순서로 뽑고 있습니다.')}
      </p>

      {v.failed && v.errorMessage && (
        <Alert
          title={`${v.failedLabel} 단계 실패`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.onInk} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.retryPending ? '요청 중' : `${v.failedLabel}부터 다시`}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.onInk}>
                <Pencil aria-hidden="true" className="size-5" />
                편집으로
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Alert>
      )}
      {v.retryError && <Alert>{v.retryError}</Alert>}

      <div className="max-w-3xl">
        <Words items={v.items} />
      </div>
    </div>
  )
}

function Premiere({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-9">
        <Giant id="done-title">완성.</Giant>
        <p className="m-0 font-display text-[clamp(1.5rem,3.4vw,2.5rem)] leading-tight tabular-nums">
          {VIDEO_WIDTH}×{VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
        </p>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침해 보거나 편집에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-16 px-10 text-[28px]', v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-6" />
            MP4 받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            <Pencil aria-hidden="true" className="size-5" />
            다시 편집하기
          </VLink>
        </div>

        <div className="flex flex-col gap-3 border-t-[3px] border-ink pt-6">
          <p className="m-0 max-w-xl text-[19px] font-semibold leading-[1.6]">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 뽑을 수 있어요. 조금 더 걸립니다.' : '더 빠르게 다시 뽑을 수 있어요. 움직임이 조금 떨릴 수 있습니다.'} 음성은 그대로 씁니다.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 뽑기`}
            </button>
          </div>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 max-w-xl text-[16px] leading-[1.6]">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>

      <div className="mx-auto w-full max-w-[320px] border-[6px] border-ink bg-ink shadow-[14px_14px_0_#0a0a0a] lg:mx-0">
        <Stage>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Stage>
      </div>
    </div>
  )
}
