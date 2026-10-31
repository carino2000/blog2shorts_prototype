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
import { NOTE, btn } from './styles'
import { Hand, Memo, Polaroid, Todo } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Framed project={project} video={project.video} /> : <Making project={project} />)}
    </Shell>
  )
}

function Making({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Hand className="text-[clamp(2.25rem,5vw,3.25rem)]">{v.failed ? '영상 만들기가 막혔어요.' : '영상을 정성껏 만들고 있어요.'}</Hand>
        <p className="m-0 text-[18px] leading-[1.75] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄어요. 그 단계부터 다시 해 볼 수 있어요.` : (v.message ?? '음성, 자막, 합치기 순서로 만들어요. 조금만 기다려 주세요.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <Memo
          title={`${v.failedLabel} 단계에서 막혔어요`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.retryPending ? '요청 중…' : '다시 해 볼게요'}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.ghost}>
                <Pencil aria-hidden="true" className="size-5" />
                장면 다시 고치기
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Memo>
      )}
      {v.retryError && <Memo>{v.retryError}</Memo>}

      <div className={cx(NOTE, 'bg-surface p-6 sm:p-8')} style={{ ['--note' as string]: '#fffdf7' }}>
        <Todo items={v.items} />
      </div>
    </div>
  )
}

function Framed({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid items-center gap-x-16 gap-y-12 md:grid-cols-[320px_minmax(0,1fr)]">
      <Polaroid className="mx-auto w-full max-w-[320px] md:mx-0" caption={`${formatSec(v.durationSec)}짜리 영상`} tilt="rotate-0">
        <Stage>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Stage>
      </Polaroid>

      <section aria-labelledby="done-title" className="flex max-w-xl flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Hand id="done-title" className="text-[clamp(2.5rem,6vw,4rem)]">
            다 만들어졌어요!
          </Hand>
          <p className="m-0 text-[18px] leading-[1.75] text-muted">
            {VIDEO_WIDTH}×{VIDEO_HEIGHT} 세로 영상, MP4 파일이에요. 재생해 보고 마음에 들면 내려받아 주세요.
          </p>
        </div>

        {v.videoFailed && <Memo tone="note">영상을 불러오지 못했어요. 새로고침해 보거나 장면 고치는 곳에서 다시 만들어 주세요.</Memo>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-5" />
            영상 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.quiet}>
            <Pencil aria-hidden="true" className="size-4" />
            장면 다시 고치기
          </VLink>
        </div>

        <div data-note="cta" className={cx(NOTE, 'paper-tape flex flex-col gap-3 p-6 motion-reduce:rotate-0 -rotate-1')}>
          <p className="m-0 text-[17px] leading-[1.7]">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있어요. 조금 더 걸려요.' : '더 빨리 다시 만들 수 있어요. 움직임이 조금 떨릴 수 있어요.'} 음성은 그대로 써요.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중…' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
            </button>
          </div>
          {v.remakeError && <Memo>{v.remakeError}</Memo>}
        </div>

        <p className="m-0 text-[16px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 그대로 유지돼요.</p>
      </section>
    </div>
  )
}
