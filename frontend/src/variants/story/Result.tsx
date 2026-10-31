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
import { Alert, Bars, Pane } from './ui'

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
  const active = v.items.find((s) => s.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null
  return (
    <div className="flex flex-col gap-4">
      <Pane label="영상 만드는 중">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#0d2a33] via-black to-black" />
        <div className="absolute inset-x-0 top-0 p-4">
          <Bars states={v.items.map((s) => s.state)} />
        </div>
        <div className="absolute inset-x-0 top-10 px-5">
          <ol className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
            {v.items.map((s, i) => (
              <li key={s.key} aria-current={s.state === 'active' ? 'step' : undefined} className={s.state === 'active' ? 'font-extrabold text-accent' : s.state === 'pending' ? 'text-white/70' : s.state === 'failed' ? 'font-bold text-danger-ink' : 'text-white'}>
                {i + 1}. {s.label}
                {s.state === 'done' && ' ✓'}
                {s.state === 'failed' && ' — 중단'}
              </li>
            ))}
          </ol>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
          <p className="m-0 text-[56px] font-black leading-none tabular-nums" role="progressbar" aria-label="진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
            {v.failed ? '!' : pct !== null ? `${pct}%` : '…'}
          </p>
          <p className="m-0 text-[15px] leading-[1.6]" aria-live="polite">
            {v.failed ? `${v.failedLabel} 단계에서 멈췄습니다. 그 단계부터 다시 시도할 수 있습니다.` : (v.message ?? '음성, 자막, 합성 순서로 진행합니다.')}
          </p>
        </div>
      </Pane>

      {((v.failed && v.errorMessage) || v.retryError) && (
        <div className="st-stage mx-auto flex flex-col gap-3">
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
        </div>
      )}
    </div>
  )
}

function Done({ project, video }: { project: Project; video: NonNullable<Project['video']> }) {
  const v = useDoneView(project, video)
  return (
    <div className="flex flex-col gap-5">
      <Pane label="완성 영상">
        {v.videoFailed ? (
          <SceneFrame src={v.poster ?? null} subtitle={v.firstSubtitle} />
        ) : (
          <video key={v.videoKey} src={v.videoSrc} poster={v.poster} controls playsInline preload="metadata" onError={() => v.setVideoFailed(true)} className="absolute inset-0 size-full bg-black object-contain" />
        )}
      </Pane>

      <section aria-labelledby="done-title" className="st-stage mx-auto flex flex-col gap-4">
        <h1 id="done-title" className="m-0 text-[28px] font-black leading-[1.2]">
          영상이 완성되었습니다
        </h1>
        <p className="m-0 text-[13px] tabular-nums text-muted">
          {VIDEO_WIDTH}×{VIDEO_HEIGHT} · MP4 · {formatSec(v.durationSec)}
        </p>

        {v.videoFailed && <Alert tone="warn">영상을 불러오지 못했습니다. 새로고침하거나 장면 편집에서 다시 만들어 주세요.</Alert>}

        <a
          data-act="download"
          href={v.videoFailed ? undefined : v.downloadHref}
          download={v.videoFailed ? undefined : 'blog2shorts.mp4'}
          aria-disabled={v.videoFailed || undefined}
          className={cx(btn.primary, 'w-full', v.videoFailed && 'pointer-events-none opacity-40')}
        >
          <Download aria-hidden="true" className="size-4" />
          MP4 내려받기
        </a>
        <VLink to={`/projects/${project.id}/scenes`} className={cx(btn.ghost, 'w-full')}>
          <Pencil aria-hidden="true" className="size-4" />
          장면 편집으로
        </VLink>

        <div className="flex flex-col gap-3 rounded-3xl bg-panel p-4">
          <p className="m-0 text-[13px] leading-[1.65] text-muted">
            {v.other === 'smooth' ? '움직임을 더 매끄럽게 다시 만들 수 있습니다. 시간이 조금 더 걸립니다.' : '더 빠르게 다시 만들 수 있습니다. 움직임이 조금 떨릴 수 있습니다.'} 음성은 다시 만들지 않습니다.
          </p>
          <button type="button" data-act="remake" className={btn.ghost} disabled={v.remakePending} onClick={v.remake}>
            {v.remakePending ? '요청 중' : `${v.other === 'smooth' ? '부드럽게' : '빠르게'} 다시 만들기`}
          </button>
          {v.remakeError && <Alert>{v.remakeError}</Alert>}
        </div>

        <p className="m-0 text-[12px] leading-[1.7] text-muted">휴대폰으로 옮길 때는 메신저의 ‘동영상’이 아니라 ‘파일’로 보내야 화질이 유지됩니다.</p>
      </section>
    </div>
  )
}
