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
import { Alert, Heading, Screen, Tasks, Win } from './ui'

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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <Heading>{v.failed ? '작업이 멈췄습니다' : '작업 중입니다…'}</Heading>

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

        <Win title="진행 상황" bodyClassName="flex flex-col gap-4">
          <p className="m-0 text-[14px] leading-[1.7] text-muted" aria-live="polite">
            {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          </p>
          <Tasks items={v.stages} />
        </Win>

        <Win title="원문 정보" bodyClassName="flex flex-col gap-3">
          {v.extractDone ? (
            <>
              <p className="m-0 text-[17px] font-bold leading-snug">{v.title}</p>
              <p className="m-0 font-mono text-[12px] text-muted">
                문단 {v.paragraphs}개 · 사진 {v.images.length}장
              </p>
              {v.images.length > 0 ? (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {v.images.map((a) => (
                    <li key={a.id} className="dk-sunk size-16 overflow-hidden p-0.5">
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
            <p className="m-0 text-[14px] text-muted">글을 다 읽으면 제목과 사진이 여기에 표시됩니다.</p>
          )}
        </Win>
      </div>

      <Win title={first ? '첫 사진' : '신호 없음'} className="mx-auto w-full max-w-[17rem] lg:mx-0" bodyClassName="!p-3">
        <Screen>{first ? <SceneFrame src={assetUrl(first)} subtitle="" /> : <div aria-hidden="true" className="absolute inset-0 bg-[#2b3a67]" />}</Screen>
      </Win>
    </div>
  )
}
