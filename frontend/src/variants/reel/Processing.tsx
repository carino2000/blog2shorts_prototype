import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Giant, Label, Words } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing" tone={(p) => (p.status === 'error' ? 'coral' : 'cobalt')}>
      {(project) => <Cut project={project} />}
    </Shell>
  )
}

function Cut({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const active = v.stages.find((s) => s.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <Giant>{v.failed ? '멈췄다.' : '읽는 중.'}</Giant>
        {!v.failed && pct !== null && <p className="m-0 font-display text-[clamp(4rem,14vw,9rem)] leading-none tabular-nums">{pct}%</p>}
      </div>
      <p className="m-0 max-w-xl text-[20px] font-semibold leading-[1.55]" aria-live="polite">
        {v.failed ? '아래에서 다시 시작하세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다. 끝나면 대본으로 넘어갑니다.')}
      </p>

      {v.error && (
        <Alert
          title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 만들지 못했습니다' : '처리하지 못했습니다'}
          actions={
            v.action === 'text' ? (
              <VLink to="/?tab=text" className={btn.onInk}>
                본문으로 다시 시작
              </VLink>
            ) : v.action === 'retry' ? (
              <button type="button" data-act="retry" className={btn.onInk} onClick={v.retry} disabled={v.retryPending}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.retryPending ? '요청 중' : '다시 시도'}
              </button>
            ) : (
              <VLink to="/" className={btn.onInk}>
                처음으로
              </VLink>
            )
          }
        >
          {v.error.message}
        </Alert>
      )}
      {v.retryError && <Alert>{v.retryError}</Alert>}

      <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Words items={v.stages} />

        <section aria-labelledby="read-title" className="flex min-w-0 flex-col gap-5">
          <Label>읽어 온 글</Label>
          {v.extractDone ? (
            <>
              <h2 id="read-title" className="m-0 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15]">
                {v.title}
              </h2>
              <p className="m-0 font-display text-[22px] leading-none tabular-nums">
                문단 {v.paragraphs} · 사진 {v.images.length}
              </p>
              {v.images.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                  {v.images.map((a) => (
                    <li key={a.id} className="aspect-[3/4] w-[5.5rem] overflow-hidden border-[3px] border-ink sm:w-28">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[18px] font-semibold">사진이 없는 글입니다. 편집에서 올릴 수 있습니다.</p>
              )}
              <p className="m-0 text-[17px] leading-[1.65] text-muted">내 글이 맞게 읽혔는지 보세요. 이상하면 본문을 붙여 넣어 다시 시작할 수 있습니다.</p>
              {!v.failed && (
                <div>
                  <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                    본문으로 다시 시작
                  </button>
                </div>
              )}
            </>
          ) : (
            <p id="read-title" className="m-0 border-[3px] border-dashed border-ink p-6 text-[18px] font-semibold leading-snug">
              글 구조를 읽으면 제목과 사진이 여기에 먼저 뜹니다.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
