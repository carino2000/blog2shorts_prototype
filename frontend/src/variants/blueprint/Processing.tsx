import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Flow, Mono, Tag } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing" title="공정도 · 글 읽기와 장면 설계">
      {(project) => <Process project={project} />}
    </Shell>
  )
}

function Process({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <section aria-labelledby="bp-proc" className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Tag>공정도 · 도면 번호 B2S-002</Tag>
          <h1 id="bp-proc" className="m-0 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.05]">
            {v.failed ? '공정이 중단되었습니다.' : '도면을 그리고 있습니다.'}
          </h1>
          <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          </p>
        </header>

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

        <Flow items={v.stages} />
      </section>

      <section aria-labelledby="bp-parts" className="flex min-w-0 flex-col gap-4">
        <Tag>
          <span id="bp-parts">부품 목록 · 원문에서 읽은 것</span>
        </Tag>
        <div className="bp-dash border p-4">
          {v.extractDone ? (
            <div className="flex flex-col gap-4">
              <h2 className="m-0 text-[19px] font-semibold leading-snug">{v.title}</h2>
              <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[13px]">
                <dt className="text-muted">문단</dt>
                <dd className="m-0 tabular-nums">{v.paragraphs}개</dd>
                <dt className="text-muted">사진</dt>
                <dd className="m-0 tabular-nums">{v.images.length}장</dd>
              </dl>
              {v.images.length > 0 ? (
                <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0">
                  {v.images.map((a, i) => (
                    <li key={a.id} className="relative aspect-[3/4] overflow-hidden border border-edge">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                      <span className="absolute left-0 top-0 bg-bg px-1 font-mono text-[11px] text-accent">{i + 1}</span>
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
            </div>
          ) : (
            <p className="m-0 text-[14px] leading-[1.7] text-muted">
              <Mono>…</Mono> 글을 다 읽으면 제목과 사진이 여기에 기입됩니다.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
