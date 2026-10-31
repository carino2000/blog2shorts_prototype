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
import { Alert, Dimensioned, Flow, Tag } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result" title="완성도 · 영상 출력">
      {(project) => (resultMode(project) === 'done' && project.video ? <Done project={project} video={project.video} /> : <Building project={project} />)}
    </Shell>
  )
}

function Building({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section aria-labelledby="bp-build" className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Tag>조립 공정 · 도면 번호 B2S-005</Tag>
          <h1 id="bp-build" className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">
            {v.failed ? '조립이 중단되었습니다.' : '영상을 조립하고 있습니다.'}
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
          </p>
        </header>

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

        <Flow items={v.items} />
      </section>

      <aside aria-label="출력 사양" className="bp-dash h-fit border p-4">
        <Tag className="mb-3 block">출력 사양</Tag>
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[13px]">
          <dt className="text-muted">해상도</dt>
          <dd className="m-0 tabular-nums">
            {VIDEO_WIDTH}×{VIDEO_HEIGHT}
          </dd>
          <dt className="text-muted">형식</dt>
          <dd className="m-0">MP4</dd>
        </dl>
      </aside>
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section aria-labelledby="done-title" className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Tag>완성도 · 도면 번호 B2S-005</Tag>
          <h1 id="done-title" className="m-0 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05]">
            조립이 끝났습니다.
          </h1>
        </header>

        <dl className="m-0 grid max-w-md grid-cols-[7rem_1fr] border border-edge font-mono text-[13px]">
          {[
            ['해상도', `${VIDEO_WIDTH}×${VIDEO_HEIGHT}`],
            ['형식', 'MP4'],
            ['길이', formatSec(v.durationSec)],
          ].map(([k, val], i) => (
            <div key={k} className={cx('col-span-2 grid grid-cols-subgrid', i > 0 && 'border-t border-line')}>
              <dt className="border-r border-line bg-panel-2 px-3 py-2 text-muted">{k}</dt>
              <dd className="m-0 px-3 py-2 tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
        </div>

        <div className="bp-dash flex max-w-xl flex-col gap-3 border p-4">
          <Tag>다시 만들기</Tag>
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

      <aside aria-label="완성 영상" className="mx-auto w-full max-w-[17rem] lg:mx-0">
        <Dimensioned>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Dimensioned>
      </aside>
    </div>
  )
}
