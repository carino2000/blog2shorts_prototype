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
import { Checklist, Note, Question } from './ui'

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
    <div className="flex flex-col gap-12">
      <Question hint={v.failed ? `${v.failedLabel} 단계에서 멈췄어요. 그 단계부터 다시 해 볼 수 있어요.` : (v.message ?? '음성, 자막, 합치기 순서로 만들고 있어요. 잠시만 기다려 주세요.')}>
        {v.failed ? '앗, 영상을 만들다 멈췄어요.' : '영상을 만들고 있어요.'}
      </Question>

      {v.failed && v.errorMessage && (
        <Note
          title={`${v.failedLabel} 단계에서 문제가 생겼어요`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.retryPending ? '요청 중…' : '다시 해 볼게요'}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.secondary}>
                <Pencil aria-hidden="true" className="size-5" />
                장면 다시 고치기
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Note>
      )}
      {v.retryError && <Note>{v.retryError}</Note>}

      <Checklist items={v.items} />
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="flex flex-col gap-12">
      <Question hint={`${VIDEO_WIDTH}×${VIDEO_HEIGHT} 세로 영상, MP4 파일, 길이는 ${formatSec(v.durationSec)}예요.`}>영상이 다 만들어졌어요.</Question>

      <div className="mx-auto w-[240px] overflow-hidden rounded-[26px] border-[3px] border-ink sm:w-[270px]">
        <Stage>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Stage>
      </div>

      {v.videoFailed && <Note tone="info">영상을 불러오지 못했어요. 새로고침해 보거나, 장면을 고치는 곳에서 다시 만들어 주세요.</Note>}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
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
        <VLink to={`/projects/${project.id}/scenes`} className={btn.secondary}>
          <Pencil aria-hidden="true" className="size-5" />
          장면을 다시 고칠래요
        </VLink>
      </div>

      <section className="flex flex-col gap-4 border-t-2 border-line pt-10">
        <p className="m-0 text-[20px] font-bold">다른 방식으로 다시 만들어 볼까요?</p>
        <p className="m-0 text-[18px] leading-[1.75] text-muted">
          {v.other === 'smooth' ? '움직임이 더 매끄러운 영상으로 만들 수 있어요. 조금 더 걸려요.' : '더 빨리 만들 수 있어요. 움직임이 조금 떨릴 수 있어요.'} 음성은 다시 만들지 않아요.
        </p>
        <div>
          <button type="button" data-act="remake" className={btn.secondary} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중…' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
        </div>
        {v.remakeError && <Note>{v.remakeError}</Note>}
      </section>

      <p className="m-0 text-[16px] leading-[1.75] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 그대로 유지돼요.</p>
    </div>
  )
}
