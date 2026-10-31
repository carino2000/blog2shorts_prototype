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
import { Alert, Cap, Head, Num, Rows } from './ui'

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
  return (
    <div className="grid-12 gap-y-10">
      <div className="col-span-12 md:col-span-3">
        <Num n={4} className="text-[clamp(5.5rem,13vw,10rem)] text-accent" />
      </div>
      <div className="col-span-12 flex min-w-0 flex-col gap-10 md:col-span-9 lg:col-span-8">
        <div className="flex flex-col gap-5">
          <Head>{v.failed ? '출력이 중단되었다.' : '출력하는 중.'}</Head>
          <p className="m-0 max-w-xl text-[18px] leading-[1.7]" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄다. 그 단계부터 다시 할 수 있다.` : (v.message ?? '음성, 자막, 합성 순서로 진행한다.')}
          </p>
        </div>

        {v.failed && v.errorMessage && (
          <Alert
            title={`${v.failedLabel} 단계 실패`}
            actions={
              <>
                <button type="button" data-act="retry" className={btn.primary} disabled={v.retryPending} onClick={v.retry}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {v.retryPending ? '요청 중' : `${v.failedLabel}부터 다시`}
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

        <Rows items={v.items} />
      </div>
    </div>
  )
}

function Output({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  const specs: [string, string][] = [
    ['형식', 'MP4'],
    ['해상도', `${VIDEO_WIDTH} × ${VIDEO_HEIGHT}`],
    ['화면비', '9:16'],
    ['길이', formatSec(v.durationSec)],
    ['장면', `${project.scenes.length}개`],
  ]
  return (
    <div className="grid-12 gap-y-10">
      <div className="col-span-12 flex items-end gap-6 sm:gap-10">
        <Num n={4} className="text-[clamp(4.5rem,11vw,8.5rem)] text-accent" />
        <Head className="pb-1">완성.</Head>
      </div>

      <figure className="col-span-12 m-0 flex flex-col gap-2 sm:col-span-6 md:col-span-4 lg:col-span-4">
        <div className="border-2 border-ink shadow-[10px_10px_0_var(--accent)]">
          <Stage>
            {v.videoFailed ? (
              <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
            ) : (
              <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
            )}
          </Stage>
        </div>
        <figcaption className="m-0 mt-3 text-[12px] font-bold">Fig. 2 완성본</figcaption>
      </figure>

      <section aria-label="출력 정보" className="col-span-12 flex min-w-0 flex-col gap-8 md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-6">
        <dl className="m-0 border-t-4 border-ink">
          {specs.map(([k, val]) => (
            <div key={k} className="grid grid-cols-[6rem_1fr] items-baseline gap-x-4 border-b border-ink py-3">
              <dt>
                <Cap>{k}</Cap>
              </dt>
              <dd className="m-0 text-[24px] font-black tracking-[-0.03em] tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만드세요.</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-14 px-6 text-[17px] sm:min-w-64', v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <span className="flex items-center gap-2">
              <Download aria-hidden="true" className="size-5" />
              MP4 내려받기
            </span>
            <span aria-hidden="true">→</span>
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            장면 편집으로
          </VLink>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink pt-5">
          <p className="m-0 max-w-lg text-[16px] leading-[1.7]">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 합성할 수 있다. 시간이 조금 더 걸린다.' : '더 빠르게 합성할 수 있다. 움직임이 조금 떨릴 수 있다.'} 음성은 다시 만들지 않는다.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 합성`}
            </button>
          </div>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 max-w-lg text-[14px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지된다.</p>
      </section>
    </div>
  )
}
