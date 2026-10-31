import { FileText, ImageIcon, RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useVariantNavigate } from '../useVariant'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { Shell } from './Shell'
import { btn } from './styles'
import { Alert, Eyebrow, Mono, Queue } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Ingest project={project} />}
    </Shell>
  )
}

function Ingest({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Eyebrow step={2}>{v.failed ? '중단' : '소스 읽는 중'}</Eyebrow>
          <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.01em]">
            {v.failed ? '여기서 멈췄습니다.' : '편집실을 준비하고 있습니다.'}
          </h1>
          <p className="m-0 text-sm leading-relaxed text-muted" aria-live="polite">
            {v.failed ? '아래 안내를 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 대본과 장면을 만드는 동안 잠시 기다려 주세요.')}
          </p>
        </div>

        {v.error && (
          <Alert
            title={v.action === 'text' ? '글을 읽어 오지 못했습니다' : v.action === 'retry' ? '대본을 만들지 못했습니다' : '처리하지 못했습니다'}
            actions={
              v.action === 'text' ? (
                <VLink to="/?tab=text" className={btn.primary}>
                  본문 붙여넣기로 시작
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

        <Queue items={v.stages} />
      </div>

      <section aria-labelledby="ingest-title" className="min-w-0">
        {v.extractDone ? (
          <div className="flex flex-col gap-5 rounded-card border border-edge bg-panel p-5 sm:p-6">
            <div className="flex flex-col gap-2">
              <p className="m-0 text-xs text-muted">읽어 온 글</p>
              <h2 id="ingest-title" className="m-0 text-xl font-semibold leading-snug">
                {v.title}
              </h2>
              <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <FileText aria-hidden="true" className="size-4" />
                  문단 <Mono>{v.paragraphs}</Mono>개
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ImageIcon aria-hidden="true" className="size-4" />
                  이미지 <Mono>{v.images.length}</Mono>장
                </span>
              </p>
            </div>
            {v.images.length > 0 ? (
              <ul className="m-0 grid list-none grid-cols-4 gap-1.5 p-0 sm:grid-cols-6">
                {v.images.map((a, i) => (
                  <li key={a.id} className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-edge bg-bg">
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                    <Mono className="absolute bottom-0.5 left-1 text-[10px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)]">{String(i + 1).padStart(2, '0')}</Mono>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-muted">이 글에는 이미지가 없습니다. 편집실에서 이미지를 올려 장면에 넣을 수 있습니다.</p>
            )}
            <p className="m-0 text-[13px] leading-relaxed text-muted">내 글이 제대로 읽혔는지 확인해 보세요. 이상하면 본문을 붙여 넣어 다시 시작할 수 있습니다.</p>
            {!v.failed && (
              <div>
                <button type="button" className={btn.ghost} onClick={() => navigate('/?tab=text')}>
                  본문 붙여넣기로 다시 시작
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid min-h-48 place-items-center rounded-card border border-dashed border-edge p-8 text-center">
            <p className="m-0 max-w-xs text-sm leading-relaxed text-muted">
              글 구조를 읽으면 제목과 사진이 이곳에 먼저 나타납니다. 읽는 동안 내 글이 맞는지 확인할 수 있어요.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
