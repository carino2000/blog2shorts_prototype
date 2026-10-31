import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Body, Shell, Topbar } from './Shell'
import { btn } from './styles'
import { Alert, Mono, Panel, StageTable } from './ui'

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
      <Topbar crumbs={['작업', v.title, v.failed ? '중단' : '실행 중']} />
      <Body>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.01em]">{v.failed ? '작업이 중단되었습니다' : '초안을 만드는 중'}</h1>
          <p className="m-0 text-[13px] text-muted" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작하세요.' : (v.message ?? '추출과 대본 생성이 끝나면 대본 화면으로 이동합니다.')}
          </p>
        </div>

        {v.error && (
          <Alert
            title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본 생성에 실패했습니다' : '처리하지 못했습니다'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.primary}>
                  본문으로 다시 시작
                </VLink>
              ) : v.action === 'retry' ? (
                <button type="button" data-act="retry" className={btn.primary} onClick={v.retry} disabled={v.retryPending}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {v.retryPending ? '요청 중…' : '다시 시도'}
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

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <StageTable items={v.stages} />

          <Panel title="추출 결과">
            {v.extractDone ? (
              <div className="flex flex-col gap-3 p-3.5">
                <p className="m-0 text-[15px] font-semibold leading-snug">{v.title}</p>
                <dl className="m-0 flex gap-6 text-[12px]">
                  <div>
                    <dt className="cmd-th">문단</dt>
                    <dd className="m-0 text-[14px] font-semibold">
                      <Mono>{v.paragraphs}</Mono>
                    </dd>
                  </div>
                  <div>
                    <dt className="cmd-th">사진</dt>
                    <dd className="m-0 text-[14px] font-semibold">
                      <Mono>{v.images.length}</Mono>
                    </dd>
                  </div>
                </dl>
                {v.images.length > 0 ? (
                  <ul className="m-0 grid list-none grid-cols-5 gap-1.5 p-0 sm:grid-cols-8">
                    {v.images.map((a, i) => (
                      <li key={a.id} className="relative aspect-square overflow-hidden rounded-[4px] border border-edge bg-bg">
                        <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                        <Mono className="absolute bottom-0 left-0 bg-black/70 px-1 text-[10px] text-white">{String(i + 1).padStart(2, '0')}</Mono>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 text-[13px] text-muted">사진이 없습니다. 장면 편집에서 업로드할 수 있습니다.</p>
                )}
                <p className="m-0 text-[12px] leading-relaxed text-muted">읽힌 내용이 원문과 다르면 본문을 붙여 넣어 다시 시작하세요.</p>
                {!v.failed && (
                  <div>
                    <button type="button" className={btn.ghost} onClick={() => navigate('/?tab=text')}>
                      본문으로 다시 시작
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="m-0 p-3.5 text-[13px] text-muted">추출이 끝나면 제목과 사진이 여기에 표시됩니다.</p>
            )}
          </Panel>
        </div>
      </Body>
    </>
  )
}
