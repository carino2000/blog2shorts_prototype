import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { SceneFrame } from '../../components/SceneFrame'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Bars, Pane } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Loading project={project} />}
    </Shell>
  )
}

function Loading({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const first = v.images[0]
  const active = v.stages.find((s) => s.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null

  return (
    <div className="flex flex-col gap-4">
      <Pane label="처리 중">
        {first && (
          <div className="absolute inset-0 opacity-45">
            <SceneFrame src={assetUrl(first)} subtitle="" />
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />

        <div className="absolute inset-x-0 top-0 p-4">
          <Bars states={v.stages.map((s) => s.state)} />
        </div>

        <div className="absolute inset-x-0 top-10 flex flex-col gap-2 px-5">
          <ol className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
            {v.stages.map((s, i) => (
              <li key={s.key} aria-current={s.state === 'active' ? 'step' : undefined} className={s.state === 'active' ? 'font-extrabold text-accent' : s.state === 'pending' ? 'text-white/70' : s.state === 'failed' ? 'font-bold text-danger-ink' : 'text-white'}>
                {i + 1}. {s.label}
                {s.state === 'done' && ' ✓'}
                {s.state === 'failed' && ' — 중단'}
              </li>
            ))}
          </ol>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
          <p className="m-0 text-[56px] font-black leading-none tabular-nums text-white" role="progressbar" aria-label="진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? undefined}>
            {v.failed ? '!' : pct !== null ? `${pct}%` : '…'}
          </p>
          <p className="m-0 text-[15px] leading-[1.6] text-white" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          </p>
          {v.extractDone && (
            <div className="flex flex-col gap-2">
              <p className="m-0 line-clamp-2 text-[16px] font-extrabold leading-snug text-white">{v.title}</p>
              <p className="m-0 text-[12px] tabular-nums text-white/85">
                문단 {v.paragraphs}개 · 사진 {v.images.length}장
              </p>
              {v.images.length === 0 && <p className="m-0 text-[12px] text-white/85">사진이 없습니다. 장면 편집에서 올릴 수 있습니다.</p>}
              {!v.failed && (
                <button type="button" className={`${btn.link} self-start !px-0`} onClick={() => navigate('/?tab=text')}>
                  본문으로 다시 시작
                </button>
              )}
            </div>
          )}
        </div>
      </Pane>

      {(v.error || v.retryError) && (
        <div className="st-stage mx-auto flex flex-col gap-3">
          {v.error && (
            <Alert
              title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 만들지 못했습니다' : '처리하지 못했습니다'}
              actions={
                v.action === 'text' ? (
                  <VLink to="/?tab=text" className={btn.primary}>
                    본문으로 다시 시작
                  </VLink>
                ) : v.action === 'retry' ? (
                  <button type="button" data-act="retry" className={btn.primary} onClick={v.retry} disabled={v.retryPending}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {v.retryPending ? '요청 중' : '다시 시도'}
                  </button>
                ) : (
                  <VLink to="/" className={btn.ghost}>
                    처음으로
                  </VLink>
                )
              }
            >
              {v.error.message}
            </Alert>
          )}
          {v.retryError && <Alert>{v.retryError}</Alert>}
        </div>
      )}
    </div>
  )
}
