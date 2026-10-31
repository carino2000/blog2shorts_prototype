import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { cx } from '../../lib/ui'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { NOTE, btn } from './styles'
import { Hand, Memo, Todo } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Notebook project={project} />}
    </Shell>
  )
}

function Notebook({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Hand className="text-[clamp(2.25rem,5vw,3.25rem)]">{v.failed ? '여기서 잠깐 막혔어요.' : '글을 천천히 읽고 있어요.'}</Hand>
          <p className="m-0 text-[18px] leading-[1.75] text-muted" aria-live="polite">
            {v.failed ? '괜찮아요. 아래 방법으로 다시 해 볼 수 있어요.' : (v.message ?? '읽고 나서 장면으로 나눠 대본을 써 드릴게요. 조금만 기다려 주세요.')}
          </p>
        </div>

        {v.error && (
          <Memo
            title={v.action === 'text' ? '글을 읽어 오지 못했어요' : v.action === 'retry' ? '대본을 쓰지 못했어요' : '처리하지 못했어요'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.primary}>
                  글을 붙여 넣어 볼게요
                </VLink>
              ) : v.action === 'retry' ? (
                <button type="button" data-act="retry" className={btn.primary} onClick={v.retry} disabled={v.retryPending}>
                  <RotateCcw aria-hidden="true" className="size-5" />
                  {v.retryPending ? '요청 중…' : '다시 해 볼게요'}
                </button>
              ) : (
                <VLink to="/" className={btn.ghost}>
                  처음으로
                </VLink>
              )
            }
          >
            {v.error.message}
          </Memo>
        )}
        {v.retryError && <Memo>{v.retryError}</Memo>}

        <div className={cx(NOTE, 'bg-surface p-6 sm:p-8')} style={{ ['--note' as string]: '#fffdf7' }}>
          <Todo items={v.stages} />
        </div>
      </div>

      <section aria-labelledby="read-title" className="flex min-w-0 flex-col gap-5">
        {v.extractDone ? (
          <div data-note="body" className={cx(NOTE, 'paper-tape flex flex-col gap-4 p-6 sm:p-8')}>
            <p className="m-0 text-[16px] text-muted">이 글을 읽었어요</p>
            <Hand as="h2" id="read-title" className="text-[34px]">
              {v.title}
            </Hand>
            <p className="m-0 text-[17px]">
              문단 {v.paragraphs}개 · 사진 {v.images.length}장
            </p>
            {v.images.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                {v.images.map((a, i) => (
                  <li key={a.id} className={cx('bg-surface p-1.5 pb-4 shadow-[0_2px_6px_rgba(58,47,38,0.3)]', i % 2 ? 'rotate-2' : '-rotate-2', 'motion-reduce:rotate-0')}>
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-20 object-cover sm:size-24" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[17px]">사진이 없는 글이에요. 편집할 때 사진을 올려 주세요.</p>
            )}
            <p className="m-0 text-[16px] leading-[1.7] text-muted">내 글이 맞게 읽혔는지 봐 주세요. 이상하면 글을 직접 붙여 넣어 다시 시작할 수 있어요.</p>
            {!v.failed && (
              <div>
                <button type="button" className={btn.quiet} onClick={() => navigate('/?tab=text')}>
                  글을 붙여 넣어서 다시 시작
                </button>
              </div>
            )}
          </div>
        ) : (
          <p id="read-title" className="m-0 rounded-[4px] border-2 border-dashed border-ink/40 p-8 font-display text-[24px] leading-snug text-muted">
            다 읽으면 제목과 사진이 이곳에 붙을 거예요.
          </p>
        )}
      </section>
    </div>
  )
}
