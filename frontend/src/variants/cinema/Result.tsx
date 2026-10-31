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
import { Credits, Label, Notice, Poster } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Premiere project={project} video={project.video} /> : <Projection project={project} />)}
    </Shell>
  )
}

function Projection({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col items-center gap-14 px-5 pt-14 text-center sm:px-10 sm:pt-20">
      <div className="flex flex-col items-center gap-6">
        <Label>{v.failed ? 'Intermission' : 'Now rendering'}</Label>
        <Poster className="text-[clamp(2.25rem,6.5vw,5rem)]">{v.failed ? '필름이 끊겼습니다.' : '곧 개봉합니다.'}</Poster>
        <p className="m-0 max-w-lg text-[17px] leading-[1.8] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <div className="w-full max-w-2xl text-left">
          <Notice
            title={`${v.failedLabel} 단계 중단`}
            actions={
              <>
                <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {v.retryPending ? '요청 중' : `${v.failedLabel}부터 다시`}
                </button>
                <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
                  편집실로
                </VLink>
              </>
            }
          >
            {v.errorMessage}
          </Notice>
        </div>
      )}
      {v.retryError && (
        <div className="w-full max-w-2xl text-left">
          <Notice>{v.retryError}</Notice>
        </div>
      )}

      <Credits items={v.items} />
    </main>
  )
}

function Premiere({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <main className="mx-auto flex max-w-[1400px] flex-col items-center gap-12 overflow-x-clip px-5 pt-12 text-center sm:px-10 sm:pt-16">
      <div className="flex flex-col items-center gap-5">
        <Label>Premiere</Label>
        <Poster id="done-title" className="text-[clamp(2.25rem,6.5vw,5rem)]">
          <span className="text-accent">완성.</span>
          <br />
          시사회를 시작합니다.
        </Poster>
        <p className="m-0 font-sans text-[12px] font-semibold uppercase tracking-[0.3em] tabular-nums text-muted">
          {VIDEO_WIDTH}×{VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <div aria-hidden="true" className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 bg-gradient-to-r from-[#4a0a12] via-transparent to-[#4a0a12] opacity-80 sm:-inset-x-24" />
        <div className="border border-accent/50 bg-black p-3 shadow-[0_40px_90px_-30px_rgba(232,200,114,0.35)]">
          <Stage>
            {v.videoFailed ? (
              <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
            ) : (
              <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
            )}
          </Stage>
        </div>
      </div>

      {v.videoFailed && (
        <div className="w-full max-w-2xl text-left">
          <Notice tone="note">영상을 불러오지 못했습니다. 새로고침하거나 편집실에서 다시 만들어 주세요.</Notice>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <a
          data-act="download"
          href={v.videoFailed ? undefined : v.downloadHref}
          download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
          aria-disabled={v.videoFailed || undefined}
          className={cx(btn.primary, v.videoFailed && 'pointer-events-none opacity-40')}
        >
          <Download aria-hidden="true" className="size-4" />
          MP4 내려받기
        </a>
        <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
          <Pencil aria-hidden="true" className="size-4" />
          편집실로 돌아가기
        </VLink>
      </div>

      <div className="flex max-w-lg flex-col items-center gap-4 border-t border-edge pt-10">
        <p className="m-0 text-[16px] leading-[1.8] text-muted">
          {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 현상할 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 현상할 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 녹음하지 않습니다.
        </p>
        <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
          {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 현상`}
        </button>
        {v.remakeError && <Notice>{v.remakeError}</Notice>}
        <p className="m-0 text-[13px] leading-[1.8] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </div>
    </main>
  )
}
