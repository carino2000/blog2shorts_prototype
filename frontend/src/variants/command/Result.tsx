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
import { Body, Shell, Topbar } from './Shell'
import { btn } from './styles'
import { Alert, Mono, Panel, StageTable } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Output project={project} video={project.video} /> : <Run project={project} />)}
    </Shell>
  )
}

function Run({ project }: { project: Project }) {
  const v = useRenderingView(project)
  const title = project.source.title ?? '직접 입력한 본문'
  return (
    <>
      <Topbar crumbs={['작업', title, v.failed ? '렌더 중단' : '렌더 중']} />
      <Body className="max-w-3xl">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em]">{v.failed ? '렌더가 중단되었습니다' : '영상을 만드는 중'}</h1>
          <p className="m-0 text-[13px] text-muted" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성 → 자막 → 합성 순서로 진행합니다.')}
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
                  장면 편집
                </VLink>
              </>
            }
          >
            {v.errorMessage}
          </Alert>
        )}
        {v.retryError && <Alert>{v.retryError}</Alert>}

        <StageTable items={v.items} />
      </Body>
    </>
  )
}

function Output({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  const title = project.source.title ?? '직접 입력한 본문'
  const specs: [string, string][] = [
    ['형식', 'MP4'],
    ['해상도', `${VIDEO_WIDTH} × ${VIDEO_HEIGHT} (9:16)`],
    ['길이', formatSec(v.durationSec)],
    ['장면', `${project.scenes.length}개`],
  ]
  return (
    <>
      <Topbar
        crumbs={['작업', title, '영상']}
        actions={
          <>
            <VLink to={`/projects/${project.id}/scenes`} className={btn.ghost}>
              <Pencil aria-hidden="true" className="size-4" />
              장면 편집
            </VLink>
            <a
              data-act="download"
              href={v.videoFailed ? undefined : v.downloadHref}
              download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
              aria-disabled={v.videoFailed || undefined}
              className={cx(btn.primary, v.videoFailed && 'pointer-events-none opacity-50')}
            >
              <Download aria-hidden="true" className="size-4" />
              MP4 내려받기
            </a>
          </>
        }
      />
      <Body className="max-w-[1100px]">
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em]">영상이 완성되었습니다</h1>
        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침해 보거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <div className="grid items-start gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
          <Panel title="미리보기">
            <div className="p-3.5">
              <div className="mx-auto w-[11.5rem] overflow-hidden rounded-[6px] border border-edge shadow-[0_8px_22px_rgba(15,23,42,0.14)] md:w-full">
                <Stage>
                  {v.videoFailed ? (
                    <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
                  ) : (
                    <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
                  )}
                </Stage>
              </div>
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title="출력 정보">
              <dl className="m-0">
                {specs.map(([k, val]) => (
                  <div key={k} className="grid grid-cols-[6rem_1fr] border-b border-line px-3.5 py-2.5 text-[13px] last:border-b-0">
                    <dt className="text-muted">{k}</dt>
                    <dd className="m-0 font-semibold">
                      <Mono>{val}</Mono>
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel title="다시 만들기">
              <div className="flex flex-col gap-2.5 p-3.5">
                <p className="m-0 text-[13px] leading-relaxed">
                  {v.other === 'smooth' ? '움직임을 더 매끄럽게 합성합니다. 시간이 조금 더 걸립니다.' : '더 빠르게 합성합니다. 움직임이 조금 떨릴 수 있습니다.'} <span className="text-muted">음성은 다시 만들지 않습니다.</span>
                </p>
                <div>
                  <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
                    {v.remakePending ? '요청 중…' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 합성`}
                  </button>
                </div>
                {v.remakeError && <Alert>{v.remakeError}</Alert>}
              </div>
            </Panel>

            <p className="m-0 text-[12px] leading-relaxed text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
          </div>
        </div>
      </Body>
    </>
  )
}
