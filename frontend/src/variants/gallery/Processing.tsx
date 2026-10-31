import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Huge, Lines, Notice, Wall } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Room project={project} />}
    </Shell>
  )
}

function Room({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const active = v.stages.find((s) => s.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null

  return (
    <main className="mx-auto flex max-w-[1500px] flex-col gap-20 px-5 pb-32 pt-16 sm:px-10 sm:pt-28">
      <div className="flex flex-col gap-8">
        <Huge>{v.failed ? '멈췄습니다.' : pct !== null ? `${pct}%` : '읽는 중.'}</Huge>
        <p className="m-0 max-w-lg text-[18px] font-light leading-[1.8] text-muted" aria-live="polite">
          {v.failed ? '아래에서 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
        </p>
      </div>

      {v.error && (
        <Notice
          title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 만들지 못했습니다' : '처리하지 못했습니다'}
          actions={
            v.action === 'text' ? (
              <VLink to="/?tab=text" className={btn.link}>
                본문으로 다시 시작
              </VLink>
            ) : v.action === 'retry' ? (
              <button type="button" data-act="retry" className={btn.link} onClick={v.retry} disabled={v.retryPending}>
                <RotateCcw aria-hidden="true" className="size-4" />
                {v.retryPending ? '요청 중' : '다시 시도'}
              </button>
            ) : (
              <VLink to="/" className={btn.link}>
                처음으로
              </VLink>
            )
          }
        >
          {v.error.message}
        </Notice>
      )}
      {v.retryError && <Notice>{v.retryError}</Notice>}

      <div className="grid gap-x-20 gap-y-16 lg:grid-cols-2">
        <Lines items={v.stages} />

        <section aria-labelledby="read-title" className="flex min-w-0 flex-col gap-5">
          <Wall>읽은 글</Wall>
          {v.extractDone ? (
            <>
              <h2 id="read-title" className="m-0 text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.3] tracking-[-0.03em]">
                {v.title}
              </h2>
              <p className="m-0 text-[14px] tabular-nums text-muted">
                문단 {v.paragraphs} · 사진 {v.images.length}
              </p>
              {v.images.length > 0 && (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {v.images.map((a) => (
                    <li key={a.id} className="aspect-[3/4] w-16 overflow-hidden bg-panel-2 sm:w-20">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover grayscale" />
                    </li>
                  ))}
                </ul>
              )}
              {v.images.length === 0 && <p className="m-0 text-[15px] text-muted">사진이 없습니다. 편집에서 올릴 수 있습니다.</p>}
              {!v.failed && (
                <div>
                  <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                    본문으로 다시 시작
                  </button>
                </div>
              )}
            </>
          ) : (
            <p id="read-title" className="m-0 text-[15px] text-muted">
              읽고 나면 제목과 사진이 여기에 놓입니다.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
