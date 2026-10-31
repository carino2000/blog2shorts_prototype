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
import { Alert, Bubble, Glass, Pills } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Working project={project} />}
    </Shell>
  )
}

function Working({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const first = v.images[0]

  return (
    <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <section aria-labelledby="sf-proc" className="flex min-w-0 flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h1 id="sf-proc" className="m-0 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-normal leading-[1.15]">
            {v.failed ? '여기서 잠깐 멈췄어요.' : '글을 천천히 읽고 있어요.'}
          </h1>
          <p className="m-0 max-w-lg text-[16px] leading-[1.8] text-muted" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중이에요.')}
          </p>
        </div>

        {v.error && (
          <Alert
            title={v.action === 'text' ? '글을 읽어 오지 못했어요' : v.action === 'retry' ? '대본을 만들지 못했어요' : '처리하지 못했어요'}
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

        <Pills items={v.stages} />

        <Glass className="flex flex-col gap-4 p-6">
          {v.extractDone ? (
            <>
              <h2 className="m-0 text-[20px] font-bold leading-snug">{v.title}</h2>
              <p className="m-0 text-[14px] tabular-nums text-muted">
                문단 {v.paragraphs}개 · 사진 {v.images.length}장
              </p>
              {v.images.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {v.images.map((a) => (
                    <li key={a.id} className="size-16 overflow-hidden rounded-2xl border-2 border-white shadow-sm">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[14px] text-muted">사진이 없어요. 장면 편집에서 올릴 수 있어요.</p>
              )}
              {!v.failed && (
                <button type="button" className={`${btn.link} self-start`} onClick={() => navigate('/?tab=text')}>
                  본문으로 다시 시작
                </button>
              )}
            </>
          ) : (
            <p className="m-0 text-[15px] leading-[1.7] text-muted">글을 다 읽으면 제목과 사진이 여기에 나타나요.</p>
          )}
        </Glass>
      </section>

      <aside aria-label="첫 사진" className="mx-auto w-full max-w-[16rem] lg:mx-0">
        <div className={v.failed ? undefined : 'sf-float'}>
          <Bubble>{first ? <SceneFrame src={assetUrl(first)} subtitle="" /> : <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#ffe0d1] via-[#d3e9ff] to-[#cdeedd]" />}</Bubble>
        </div>
        <p className="m-0 mt-5 text-center text-[13px] text-muted">{first ? '글에서 읽은 첫 사진' : '사진을 기다리는 중'}</p>
      </aside>
    </div>
  )
}
