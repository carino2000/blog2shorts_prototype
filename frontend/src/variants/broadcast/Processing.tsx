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
import { Alert, Master, Monitor, Mono, Tally } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Control project={project} />}
    </Shell>
  )
}

function Control({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const first = v.images[0]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <section aria-labelledby="bc-proc" className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Master control</Mono>
          <h1 id="bc-proc" className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-none tracking-[0.02em]">
            {v.failed ? '송출이 중단되었습니다.' : '신호를 준비하고 있습니다.'}
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          </p>
        </div>

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

        <Master items={v.stages} />

        <section aria-labelledby="bc-src" className="rounded-card border border-edge bg-panel">
          <div className="border-b border-edge bg-panel-2 px-4 py-2">
            <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
              <span id="bc-src">Source log</span>
            </Mono>
          </div>
          <div className="flex flex-col gap-3 p-4">
            {v.extractDone ? (
              <>
                <h2 className="m-0 text-[18px] font-semibold leading-snug">{v.title}</h2>
                <p className="m-0 font-mono text-[12px] tabular-nums text-muted">
                  문단 {v.paragraphs} · 사진 {v.images.length}
                </p>
                {v.images.length > 0 ? (
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {v.images.map((a) => (
                      <li key={a.id} className="aspect-[3/4] w-16 overflow-hidden border border-edge">
                        <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-[14px] text-muted">사진이 없습니다. 장면 편집에서 올릴 수 있습니다.</p>
                )}
                {!v.failed && (
                  <button type="button" className={`${btn.link} self-start`} onClick={() => navigate('/?tab=text')}>
                    본문으로 다시 시작
                  </button>
                )}
              </>
            ) : (
              <p className="m-0 text-[14px] text-muted">글을 다 읽으면 제목과 사진이 여기에 기록됩니다.</p>
            )}
          </div>
        </section>
      </section>

      <aside aria-label="신호 모니터" className="mx-auto w-full max-w-[17rem] lg:mx-0">
        <Monitor
          tag={
            <Tally tone={v.failed ? 'idle' : 'pvw'} live={!v.failed}>
              {first ? 'PVW · 첫 사진' : 'NO SIGNAL'}
            </Tally>
          }
          info={first ? `${first.width}×${first.height}` : '입력 신호 없음'}
        >
          {first ? <SceneFrame src={assetUrl(first)} subtitle="" /> : <div aria-hidden="true" className="bc-bars absolute inset-0" />}
        </Monitor>
      </aside>
    </div>
  )
}
