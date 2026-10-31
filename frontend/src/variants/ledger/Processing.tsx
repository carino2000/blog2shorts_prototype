import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Checklist, Note, Question } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Reading project={project} />}
    </Shell>
  )
}

function Reading({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="flex flex-col gap-12">
      <Question hint={v.failed ? '괜찮아요, 아래 방법으로 다시 해 볼 수 있어요.' : (v.message ?? '글을 읽고 장면으로 나누는 동안 잠시만 기다려 주세요.')}>
        {v.failed ? '앗, 여기서 멈췄어요.' : '글을 읽고 있어요.'}
      </Question>

      {v.error && (
        <Note
          title={v.action === 'text' ? '글을 읽어 오지 못했어요' : v.action === 'retry' ? '대본을 쓰지 못했어요' : '처리하지 못했어요'}
          actions={
            v.action === 'text' ? (
              <VLink to="/?tab=text" className={btn.primary}>
                글을 붙여 넣어서 해 볼게요
              </VLink>
            ) : v.action === 'retry' ? (
              <button type="button" data-act="retry" className={btn.primary} onClick={v.retry} disabled={v.retryPending}>
                <RotateCcw aria-hidden="true" className="size-5" />
                {v.retryPending ? '요청 중…' : '다시 해 볼게요'}
              </button>
            ) : (
              <VLink to="/" className={btn.secondary}>
                처음으로 돌아가기
              </VLink>
            )
          }
        >
          {v.error.message}
        </Note>
      )}
      {v.retryError && <Note>{v.retryError}</Note>}

      <Checklist items={v.stages} />

      {v.extractDone && (
        <section aria-labelledby="read-title" className="flex flex-col gap-5 border-t-2 border-line pt-10">
          <p id="read-title" className="m-0 text-[17px] text-muted">
            이 글을 읽었어요
          </p>
          <p className="m-0 text-[26px] font-bold leading-snug tracking-[-0.01em]">{v.title}</p>
          <p className="m-0 text-[18px] text-muted">
            문단 {v.paragraphs}개, 사진 {v.images.length}장이에요.
          </p>
          {v.images.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
              {v.images.map((a) => (
                <li key={a.id} className="size-20 overflow-hidden rounded-[14px] border-2 border-line sm:size-24">
                  <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                </li>
              ))}
            </ul>
          )}
          <p className="m-0 text-[17px] leading-[1.75] text-muted">{v.images.length === 0 ? '사진이 없는 글이에요. 장면을 고칠 때 사진을 올려 주시면 돼요. ' : ''}내 글이 맞게 읽혔는지 봐 주세요. 이상하면 글을 직접 붙여 넣어 다시 시작할 수 있어요.</p>
          {!v.failed && (
            <div>
              <button type="button" className={btn.quiet} onClick={() => navigate('/?tab=text')}>
                글을 붙여 넣어서 다시 시작하기
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
