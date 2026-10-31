import { Download, RotateCcw } from 'lucide-react'
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
import { Kicker, Notice, Plate, Process } from './ui'

export function Result() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="result">
      {(project) => (resultMode(project) === 'done' && project.video ? <Published project={project} video={project.video} /> : <Printing project={project} />)}
    </Shell>
  )
}

function Printing({ project }: { project: Project }) {
  const v = useRenderingView(project)
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Kicker>{v.failed ? '인쇄 중단' : '인쇄 중'}</Kicker>
        <h1 className="m-0 font-serif text-[34px] font-black leading-[1.15] tracking-[-0.03em] sm:text-[46px]">{v.failed ? '인쇄가 중단되었습니다.' : '영상을 찍어 내고 있습니다.'}</h1>
        <p className="m-0 font-serif text-[17px] leading-[1.8] text-muted" aria-live="polite">
          {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
        </p>
      </div>

      {v.failed && v.errorMessage && (
        <Notice
          title={`${v.failedLabel} 단계 실패`}
          actions={
            <>
              <button type="button" data-act="retry" className={btn.onInk} disabled={v.retryPending} onClick={v.retry}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {v.retryPending ? '요청 중…' : `${v.failedLabel}부터 다시`}
              </button>
              <VLink to={`/projects/${project.id}/scenes`} className={btn.onInk}>
                장면 교정으로
              </VLink>
            </>
          }
        >
          {v.errorMessage}
        </Notice>
      )}
      {v.retryError && <Notice>{v.retryError}</Notice>}

      <Process items={v.items} />
    </div>
  )
}

function Published({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  const specs: [string, string][] = [
    ['해상도', `${VIDEO_WIDTH} × ${VIDEO_HEIGHT} (9:16)`],
    ['형식', 'MP4'],
    ['길이', formatSec(v.durationSec)],
    ['장면', `${project.scenes.length}개`],
  ]

  return (
    <div className="grid items-start gap-x-16 gap-y-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <Plate className="mx-auto w-full max-w-[300px] md:mx-0 md:max-w-none" caption="도판 · 완성본. 아래의 재생 막대로 처음부터 끝까지 확인할 수 있습니다.">
        <Stage>
          {v.videoFailed ? (
            <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
          ) : (
            <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
          )}
        </Stage>
      </Plate>

      <section aria-labelledby="done-title" className="flex max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Kicker>발행</Kicker>
          <h1 id="done-title" className="m-0 font-serif text-[40px] font-black leading-[1.12] tracking-[-0.03em] sm:text-[54px]">
            영상이 나왔습니다.
          </h1>
        </div>

        <dl className="m-0 border-t-2 border-ink">
          {specs.map(([k, val]) => (
            <div key={k} className="grid grid-cols-[6rem_1fr] border-b border-line py-2.5 font-sans text-[15px]">
              <dt className="text-muted">{k}</dt>
              <dd className="m-0 font-semibold tabular-nums">{val}</dd>
            </div>
          ))}
        </dl>

        {v.videoFailed && <Notice tone="note">영상을 불러오지 못했습니다. 새로고침해 보거나 장면 교정에서 다시 만들어 주세요.</Notice>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <a
            data-act="download"
            href={v.videoFailed ? undefined : v.downloadHref}
            download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
            aria-disabled={v.videoFailed || undefined}
            className={cx(btn.primary, 'min-h-12 px-7 text-base', v.videoFailed && 'pointer-events-none opacity-50')}
          >
            <Download aria-hidden="true" className="size-4" />
            MP4 내려받기
          </a>
          <VLink to={`/projects/${project.id}/scenes`} className={btn.link}>
            장면 교정으로 돌아가기
          </VLink>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink pt-5">
          <p className="m-0 font-serif text-[16px] leading-[1.8]">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 찍을 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빨리 다시 찍을 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <div>
            <button type="button" data-act="remake" className={btn.link} disabled={v.remakePending} onClick={v.remake}>
              {v.remakePending ? '요청 중…' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 찍기`}
            </button>
          </div>
          {v.remakeError && <Notice>{v.remakeError}</Notice>}
        </div>

        <p className="m-0 font-sans text-[13px] leading-relaxed text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>
    </div>
  )
}
