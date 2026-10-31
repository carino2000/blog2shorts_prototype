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
import { Alert, Master, Monitor, Mono, Tally } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Program project={project} video={project.video} /> : <OnAir project={project} />)}
    </Shell>
  )
}

function OnAir({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section aria-labelledby="bc-air" className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Program out</Mono>
          <h1 id="bc-air" className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-none tracking-[0.02em]">
            {v.failed ? '송출이 중단되었습니다.' : '영상을 송출하고 있습니다.'}
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted" aria-live="polite">
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

        <Master items={v.items} />
      </section>

      <aside aria-label="송출 모니터" className="mx-auto w-full max-w-[17rem] lg:mx-0">
        <Monitor
          tag={
            <Tally tone={v.failed ? 'idle' : 'pgm'} live={!v.failed}>
              {v.failed ? 'FAULT' : 'PGM · 렌더 중'}
            </Tally>
          }
          info="1080×1920 · MP4"
        >
          <div aria-hidden="true" className="bc-bars absolute inset-0" />
        </Monitor>
      </aside>
    </div>
  )
}

function Program({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="송출 화면" className="mx-auto w-full max-w-[17rem] lg:mx-0">
        <Monitor tag={<Tally tone="pgm">PGM · 완료</Tally>} info={`${VIDEO_WIDTH}×${VIDEO_HEIGHT} · MP4 · ${formatSec(v.durationSec)}`}>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Monitor>
      </aside>

      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-hi">Transmission complete</Mono>
          <h1 id="done-title" className="m-0 font-display text-[clamp(2.25rem,5.5vw,4rem)] font-bold uppercase leading-[0.95] tracking-[0.02em]">
            송출이 끝났습니다.
          </h1>
          <p className="m-0 font-mono text-[13px] tabular-nums text-muted">
            {VIDEO_WIDTH}×{VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
          </p>
        </div>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-14 px-6 text-[20px]', v.videoFailed && 'pointer-events-none opacity-40')}
          >
            <Download aria-hidden="true" className="size-5" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            <Pencil aria-hidden="true" className="size-4" />
            장면 편집으로
          </VLink>
        </div>

        <div className="flex max-w-xl flex-col gap-3 rounded-card border border-edge bg-panel p-4">
          <Mono className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Re-render</Mono>
          <p className="m-0 text-[14px] leading-[1.65] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <button type="button" data-act="remake" className={cx(btn.ghost, 'self-start')} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 max-w-xl text-[13px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>
    </div>
  )
}
