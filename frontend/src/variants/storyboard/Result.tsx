import { Download, Pencil as PencilIcon, RotateCcw } from 'lucide-react'
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
import { Alert, Cell, Checklist, Frame, FormHead, Pencil } from './ui'

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
    <>
      <FormHead title="영상 제작 진행표" no="B2S-05">
        <Cell label="상태">{v.failed ? '중단' : '제작 중'}</Cell>
        <Cell label="해상도">
          {VIDEO_WIDTH}×{VIDEO_HEIGHT}
        </Cell>
        <Cell label="형식">MP4</Cell>
      </FormHead>
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <p className="m-0 flex flex-wrap items-center gap-x-4 text-[14px] leading-[1.7] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
          {!v.failed && <Pencil>조금만 기다려 주세요</Pencil>}
        </p>

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
                  콘티 수정으로
                </VLink>
              </>
            }
          >
            {v.errorMessage}
          </Alert>
        )}
        {v.retryError && <Alert>{v.retryError}</Alert>}

        <div className="border-2 border-ink">
          <Checklist items={v.items} />
        </div>
      </div>
    </>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <>
      <FormHead title="영상 제작 완료 확인서" no="B2S-05">
        <Cell label="해상도">
          {VIDEO_WIDTH}×{VIDEO_HEIGHT}
        </Cell>
        <Cell label="형식">MP4</Cell>
        <Cell label="길이">{formatSec(v.durationSec)}</Cell>
      </FormHead>

      <div className="grid gap-x-8 gap-y-6 p-4 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside aria-label="완성 영상" className="mx-auto w-full max-w-[14rem] md:mx-0">
          <Frame>
            {v.videoFailed ? (
              <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
            ) : (
              <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
            )}
          </Frame>
        </aside>

        <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-5">
          <h2 id="done-title" className="m-0 text-[22px] font-extrabold">
            영상이 완성되었습니다 <Pencil className="ml-2">확인 완료 ✓</Pencil>
          </h2>

          {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 콘티 수정에서 다시 만들어 주세요.</Alert>}

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
              <PencilIcon aria-hidden="true" className="size-4" />
              콘티 수정으로
            </VLink>
          </div>

          <div className="flex max-w-xl flex-col gap-3 border-2 border-ink p-4">
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
    </>
  )
}
