import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { useVariantNavigate } from '../useVariant'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Kicker, Notice, Process } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Typesetting project={project} />}
    </Shell>
  )
}

function Typesetting({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Kicker>{v.failed ? '조판 중단' : '조판 중'}</Kicker>
          <h1 className="m-0 font-serif text-[34px] font-black leading-[1.15] tracking-[-0.03em] sm:text-[46px]">{v.failed ? '조판이 중단되었습니다.' : '원고를 조판하고 있습니다.'}</h1>
          <p className="m-0 font-serif text-[17px] leading-[1.8] text-muted" aria-live="polite">
            {v.failed ? '아래 안내를 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 동안 잠시 기다려 주세요.')}
          </p>
        </div>

        {v.error && (
          <Notice
            title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 쓰지 못했습니다' : '처리하지 못했습니다'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.onInk}>
                  본문으로 투고하기
                </VLink>
              ) : v.action === 'retry' ? (
                <button type="button" data-act="retry" className={btn.onInk} onClick={v.retry} disabled={v.retryPending}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  {v.retryPending ? '요청 중…' : '다시 시도'}
                </button>
              ) : (
                <VLink to="/" className={btn.onInk}>
                  처음으로
                </VLink>
              )
            }
          >
            {v.error.message}
          </Notice>
        )}
        {v.retryError && <Notice>{v.retryError}</Notice>}

        <Process items={v.stages} />
      </div>

      <section aria-labelledby="typeset-title" className="flex min-w-0 flex-col gap-5 lg:border-l lg:border-ink lg:pl-14">
        <Kicker>읽어 온 글</Kicker>
        {v.extractDone ? (
          <>
            <h2 id="typeset-title" className="m-0 font-serif text-[26px] font-black leading-snug tracking-[-0.02em]">
              {v.title}
            </h2>
            <p className="m-0 font-sans text-sm text-muted">
              문단 <b className="text-ink tabular-nums">{v.paragraphs}</b> · 사진 <b className="text-ink tabular-nums">{v.images.length}</b>
            </p>
            {v.images.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-4 gap-2 border-y border-ink py-3 p-0 sm:grid-cols-6">
                {v.images.map((a) => (
                  <li key={a.id} className="aspect-[3/4] overflow-hidden border border-ink">
                    <img src={assetUrl(a)} alt="" loading="lazy" className="press-photo size-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 font-serif text-[15px] leading-relaxed text-muted">이 글에는 사진이 없습니다. 장면을 고칠 때 사진을 올릴 수 있습니다.</p>
            )}
            <p className="m-0 font-serif text-[15px] leading-[1.8] text-muted">내 글이 제대로 읽혔는지 살펴보세요. 이상하면 본문을 붙여 넣어 처음부터 다시 시작할 수 있습니다.</p>
            {!v.failed && (
              <div>
                <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                  본문으로 다시 투고하기
                </button>
              </div>
            )}
          </>
        ) : (
          <p id="typeset-title" className="m-0 border-y border-line py-8 font-serif text-[16px] leading-[1.8] text-muted">
            글의 구조를 읽으면 제목과 사진이 이 자리에 먼저 실립니다.
          </p>
        )}
      </section>
    </div>
  )
}
