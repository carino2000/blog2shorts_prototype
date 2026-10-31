import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Route, Sign } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Travel project={project} />}
    </Shell>
  )
}

function Travel({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="mt-proc" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 id="mt-proc" className="m-0 font-display text-[clamp(2rem,4.6vw,3rem)] font-normal leading-[1.15]">
            {v.failed ? '열차가 멈췄습니다.' : '열차가 달리는 중입니다.'}
          </h1>
          <p className="m-0 max-w-lg text-[16px] leading-[1.75] text-muted" aria-live="polite">
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

        <Route items={v.stages} />
      </section>

      <Sign className="flex flex-col gap-3">
        <p className="m-0 text-[13px] font-bold text-white/80">역 안내 · 원문 정보</p>
        {v.extractDone ? (
          <>
            <h2 className="m-0 font-display text-[24px] font-normal leading-snug">{v.title}</h2>
            <p className="m-0 text-[14px] tabular-nums text-white/90">
              문단 {v.paragraphs}개 · 사진 {v.images.length}장
            </p>
            {v.images.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {v.images.map((a) => (
                  <li key={a.id} className="aspect-[3/4] w-14 overflow-hidden rounded-small border-2 border-white">
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[14px] text-white/90">사진이 없습니다. 장면 편집에서 올릴 수 있습니다.</p>
            )}
            {!v.failed && (
              <button type="button" className="inline-flex min-h-11 items-center self-start text-[14px] font-bold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={() => navigate('/?tab=text')}>
                본문으로 다시 시작
              </button>
            )}
          </>
        ) : (
          <p className="m-0 text-[14px] leading-[1.7] text-white/90">글을 다 읽으면 제목과 사진이 이 안내판에 표시됩니다.</p>
        )}
      </Sign>
    </div>
  )
}
