import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Cell, Checklist, FormHead, Pencil } from './ui'

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

  return (
    <>
      <FormHead title="콘티 작성 진행표" no="B2S-02">
        <Cell label="상태">{v.failed ? '중단' : '작성 중'}</Cell>
        <Cell label="원고 제목">{v.extractDone ? v.title : '읽는 중…'}</Cell>
        <Cell label="원고 구성">{v.extractDone ? `문단 ${v.paragraphs} · 사진 ${v.images.length}` : '—'}</Cell>
      </FormHead>

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <p className="m-0 flex flex-wrap items-center gap-x-4 text-[14px] leading-[1.7] text-muted" aria-live="polite">
          {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
          {!v.failed && <Pencil>잠시만 기다려 주세요</Pencil>}
        </p>

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

        <div className="border-2 border-ink">
          <Checklist items={v.stages} />
        </div>

        <section aria-label="원고 사진" className="flex flex-col gap-3">
          <h2 className="m-0 text-[15px] font-extrabold">원고에서 찾은 사진</h2>
          {v.extractDone ? (
            v.images.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                {v.images.map((a, i) => (
                  <li key={a.id} className="sb-frame relative aspect-[3/4] w-20 overflow-hidden">
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                    <span className="absolute left-0 top-0 bg-surface px-1 text-[11px] font-bold">{i + 1}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[14px] text-muted">사진이 없습니다. 장면 편집에서 올릴 수 있습니다.</p>
            )
          ) : (
            <p className="m-0 text-[14px] text-muted">원고를 다 읽으면 이곳에 사진이 붙습니다.</p>
          )}
          {v.extractDone && !v.failed && (
            <button type="button" className={`${btn.link} self-start`} onClick={() => navigate('/?tab=text')}>
              본문으로 다시 시작
            </button>
          )}
        </section>
      </div>
    </>
  )
}
