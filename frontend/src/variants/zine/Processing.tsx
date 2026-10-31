import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { cx } from '../../lib/ui'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { BOX, btn } from './styles'
import { Alert, Bars, Hl, Shout } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Copier project={project} />}
    </Shell>
  )
}

function Copier({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid items-start gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-9">
        <div className="flex flex-col gap-5">
          <Shout>{v.failed ? <Hl>망했다!</Hl> : <>복사기 돌리는 중<Hl>!</Hl></>}</Shout>
          <p className="m-0 max-w-xl text-[19px] font-semibold leading-[1.65]" aria-live="polite">
            {v.failed ? '아래에서 다시 시작하자.' : (v.message ?? '글을 긁어 오고 장면으로 쪼개는 중이다. 끝나면 대본으로 넘어간다.')}
          </p>
        </div>

        {v.error && (
          <Alert
            title={v.action === 'text' ? '글을 못 읽었다' : v.action === 'retry' ? '대본이 안 나왔다' : '처리 실패'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.onInk}>
                  본문으로 다시
                </VLink>
              ) : v.action === 'retry' ? (
                <button type="button" data-act="retry" className={btn.onInk} onClick={v.retry} disabled={v.retryPending}>
                  <RotateCcw aria-hidden="true" className="size-5" />
                  {v.retryPending ? '요청 중' : '다시!'}
                </button>
              ) : (
                <VLink to="/" className={btn.onInk}>
                  처음으로
                </VLink>
              )
            }
          >
            {v.error.message}
          </Alert>
        )}
        {v.retryError && <Alert>{v.retryError}</Alert>}

        <Bars items={v.stages} />
      </div>

      <section aria-labelledby="read-title" className={cx(BOX, 'flex min-w-0 flex-col gap-5 p-6 lg:-rotate-1 motion-reduce:rotate-0')}>
        <p className="m-0 font-display text-[22px] leading-none">
          <Hl>긁어 온 글</Hl>
        </p>
        {v.extractDone ? (
          <>
            <h2 id="read-title" className="m-0 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-normal leading-[1.2]">
              {v.title}
            </h2>
            <p className="m-0 text-[18px] font-extrabold tabular-nums">
              문단 {v.paragraphs} · 사진 {v.images.length}
            </p>
            {v.images.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
                {v.images.map((a, i) => (
                  <li key={a.id} className={cx('border-[3px] border-ink shadow-[4px_4px_0_#0a0a0a]', i % 2 ? 'rotate-2' : '-rotate-2', 'motion-reduce:rotate-0')}>
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-20 object-cover sm:size-24" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[17px] font-semibold">사진이 없다. 편집할 때 올리자.</p>
            )}
            <p className="m-0 text-[16px] font-semibold leading-[1.65] text-muted">제대로 읽혔는지 보자. 이상하면 본문을 붙여 넣어 다시 시작한다.</p>
            {!v.failed && (
              <div>
                <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                  본문으로 다시 시작
                </button>
              </div>
            )}
          </>
        ) : (
          <p id="read-title" className="m-0 border-[3px] border-dashed border-ink p-5 text-[17px] font-bold leading-snug">
            다 읽으면 제목과 사진이 여기에 철썩 붙는다.
          </p>
        )}
      </section>
    </div>
  )
}
