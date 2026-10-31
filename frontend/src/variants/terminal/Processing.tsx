import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Block, Log, Out } from './ui'

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
    <>
      <Block cmd="b2s run" label="실행 로그">
        <Out>
          <h1 className="m-0 mb-2 text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-ink">{v.failed ? '작업이 중단되었습니다.' : '글을 읽고 대본을 만드는 중입니다.'}</h1>
          <p className="m-0 mb-3 text-[14px]" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          </p>
          <Log items={v.stages} />
        </Out>
      </Block>

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

      <Block cmd="b2s inspect source" label="원문 정보">
        <Out>
          {v.extractDone ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 text-[15px] font-semibold text-ink">title: {v.title}</p>
              <p className="m-0 text-[13px] tabular-nums">
                paragraphs: {v.paragraphs} · images: {v.images.length}
              </p>
              {v.images.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {v.images.map((a, i) => (
                    <li key={a.id} className="relative aspect-[3/4] w-14 overflow-hidden rounded-small border border-edge">
                      <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                      <span className="absolute left-0 top-0 bg-bg px-1 text-[11px] text-accent">{i + 1}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[13px]"># 사진이 없습니다. 장면 편집에서 올릴 수 있습니다.</p>
              )}
              {!v.failed && (
                <button type="button" className={`${btn.link} self-start !px-0`} onClick={() => navigate('/?tab=text')}>
                  본문으로 다시 시작
                </button>
              )}
            </div>
          ) : (
            <p className="m-0 text-[14px]"># 글을 다 읽으면 제목과 사진이 여기에 출력됩니다.</p>
          )}
        </Out>
      </Block>
    </>
  )
}
