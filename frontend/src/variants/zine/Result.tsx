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
import { BOX, btn } from './styles'
import { Alert, Bars, Hl, Shout } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Poster project={project} video={project.video} /> : <Printing project={project} />)}
    </Shell>
  )
}

function Printing({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="flex max-w-3xl flex-col gap-9">
      <div className="flex flex-col gap-5">
        <Shout>{v.failed ? <Hl>멈췄다!</Hl> : <>영상 뽑는 중<Hl>!</Hl></>}</Shout>
        <p className="m-0 text-[19px] font-semibold leading-[1.65]" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄다. 그 단계부터 다시 돌릴 수 있다.` : (v.message ?? '음성, 자막, 합치기 순서로 돌린다.')}
        </p>
      </div>

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

      <Bars items={v.items} />
    </div>
  )
}

function Poster({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-9">
        <Shout id="done-title">
          <Hl>완성!</Hl>
        </Shout>
        <p className="m-0 flex flex-wrap gap-3 font-display text-[22px] leading-none tabular-nums">
          {[`${VIDEO_WIDTH}×${VIDEO_HEIGHT}`, 'MP4', formatSec(v.durationSec)].map((t, i) => (
            <span key={t} className={cx('border-[3px] border-ink px-3 py-2 shadow-[4px_4px_0_#0a0a0a]', ['bg-hi', 'bg-surface', 'bg-accent'][i])}>
              {t}
            </span>
          ))}
        </p>

        {v.videoFailed && <Alert tone="warn">영상을 못 불러왔다. 새로고침하거나 편집에서 다시 만들자.</Alert>}

        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-14 text-[28px]', v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-6" />
            MP4 받기!
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            <Pencil aria-hidden="true" className="size-5" />
            다시 편집하기
          </VLink>
        </div>

        <div className={cx(BOX, 'flex max-w-xl flex-col gap-4 p-6')}>
          <p className="m-0 text-[18px] font-semibold leading-[1.65]">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 뽑을 수 있다. 조금 더 걸린다.' : '더 빨리 다시 뽑을 수 있다. 움직임이 조금 떨릴 수 있다.'} 음성은 그대로 쓴다.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 뽑기`}
            </button>
          </div>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 max-w-xl text-[16px] font-bold leading-[1.65] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 산다.</p>
      </section>

      <div className="mx-auto w-full max-w-[320px] border-[3px] border-ink bg-ink shadow-[12px_12px_0_var(--accent)] lg:mx-0">
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
