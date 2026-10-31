import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Cap, Head, Num, Rows } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Run project={project} />}
    </Shell>
  )
}

function Run({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid-12 gap-y-10">
      <div className="col-span-12 md:col-span-3">
        <Num n={2} className="text-[clamp(5.5rem,13vw,10rem)] text-accent" />
      </div>

      <div className="col-span-12 flex min-w-0 flex-col gap-10 md:col-span-9 lg:col-span-8">
        <div className="flex flex-col gap-5">
          <Head>{v.failed ? '중단되었다.' : '읽고 나누는 중.'}</Head>
          <p className="m-0 max-w-xl text-[18px] leading-[1.7]" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작한다.' : (v.message ?? '추출과 대본 생성이 끝나면 대본 화면으로 넘어간다.')}
          </p>
        </div>

        {v.error && (
          <Alert
            title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 만들지 못했습니다' : '처리하지 못했습니다'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.primary}>
                  본문으로 다시 시작 <span aria-hidden="true">→</span>
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

        <Rows items={v.stages} />

        <section aria-labelledby="read-title" className="flex flex-col gap-4">
          <Cap>
            <span id="read-title">추출 결과</span>
          </Cap>
          {v.extractDone ? (
            <>
              <p className="m-0 text-[clamp(1.5rem,3vw,2.25rem)] font-black leading-[1.15] tracking-[-0.03em]">{v.title}</p>
              <p className="m-0 text-[15px] font-bold tabular-nums">
                문단 {v.paragraphs} · 사진 {v.images.length}
              </p>
              {v.images.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {v.images.map((a, i) => (
                    <li key={a.id} className="relative aspect-[3/4] w-[5.5rem] overflow-hidden border-2 border-ink sm:w-24">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                      <span className="absolute left-0 top-0 bg-ink px-1 text-[11px] font-black text-bg tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[16px]">사진이 없다. 편집 단계에서 올린다.</p>
              )}
              <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted">읽힌 내용이 원문과 다르면 본문을 붙여 넣어 다시 시작한다.</p>
              {!v.failed && (
                <div>
                  <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                    본문으로 다시 시작
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="m-0 border-y border-ink py-6 text-[16px] text-muted">추출이 끝나면 제목과 사진이 이 자리에 나타난다.</p>
          )}
        </section>
      </div>
    </div>
  )
}
