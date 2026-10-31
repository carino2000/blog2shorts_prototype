import { RotateCcw } from 'lucide-react'
import { useParams } from 'react-router'
import { assetUrl } from '../../api'
import type { Project } from '../../api/types'
import { useProcessing } from '../shared/useProcessing'
import { VLink } from '../shared/VLink'
import { useVariantNavigate } from '../useVariant'
import { Shell } from './Shell'
import { btn } from './styles'
import { Credits, Label, Notice } from './ui'

export function Processing() {
  const { id = '' } = useParams()
  return (
    <Shell id={id} view="processing">
      {(project) => <Leader project={project} />}
    </Shell>
  )
}

function Leader({ project }: { project: Project }) {
  const v = useProcessing(project)
  const navigate = useVariantNavigate()
  const active = v.stages.find((s) => s.state === 'active')
  const pct = active?.percent !== undefined ? Math.round(active.percent) : null
  const r = 88
  const c = 2 * Math.PI * r

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col items-center gap-16 px-5 pt-14 sm:px-10 sm:pt-20">
      <div className="flex flex-col items-center gap-8 text-center">
        <Label>{v.failed ? 'Intermission' : 'Please stand by'}</Label>
        <div className="relative grid size-52 place-items-center" aria-hidden={pct === null ? undefined : true}>
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="100" cy="100" r={r} fill="none" stroke="var(--edge)" strokeWidth="2" />
            <circle cx="100" cy="100" r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeDasharray={c} strokeDashoffset={c * (1 - (pct ?? 12) / 100)} className="transition-[stroke-dashoffset] duration-500" />
            <line x1="100" y1="6" x2="100" y2="194" stroke="var(--edge)" strokeWidth="1" transform="rotate(90 100 100)" />
            <line x1="100" y1="6" x2="100" y2="194" stroke="var(--edge)" strokeWidth="1" />
          </svg>
          <p className="m-0 font-display text-[56px] font-bold leading-none tabular-nums">{v.failed ? '!' : pct !== null ? pct : '…'}</p>
        </div>
        <h1 className="m-0 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-tight">{v.failed ? '상영이 중단되었습니다.' : '곧 상영을 시작합니다.'}</h1>
        <p className="m-0 max-w-md text-[17px] leading-[1.8] text-muted" aria-live="polite">
          {v.failed ? '아래 안내에 따라 다시 시작해 주세요.' : (v.message ?? '글을 읽고 장면으로 나누는 중입니다.')}
        </p>
      </div>

      {v.error && (
        <div className="w-full max-w-2xl">
          <Notice
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
          </Notice>
        </div>
      )}
      {v.retryError && (
        <div className="w-full max-w-2xl">
          <Notice>{v.retryError}</Notice>
        </div>
      )}

      <Credits items={v.stages} />

      <section aria-labelledby="read-title" className="flex w-full max-w-2xl flex-col items-center gap-5 border-t border-edge pt-12 text-center">
        <Label>원작</Label>
        {v.extractDone ? (
          <>
            <h2 id="read-title" className="m-0 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.3]">
              {v.title}
            </h2>
            <p className="m-0 text-[15px] tabular-nums text-muted">
              문단 {v.paragraphs} · 사진 {v.images.length}
            </p>
            {v.images.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0">
                {v.images.map((a) => (
                  <li key={a.id} className="aspect-[3/4] w-[4.5rem] overflow-hidden border border-edge sm:w-24">
                    <img src={assetUrl(a)} alt="" loading="lazy" className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-[15px] text-muted">사진이 없습니다. 편집에서 올릴 수 있습니다.</p>
            )}
            {!v.failed && (
              <button type="button" className={btn.link} onClick={() => navigate('/?tab=text')}>
                본문으로 다시 시작
              </button>
            )}
          </>
        ) : (
          <p id="read-title" className="m-0 text-[15px] text-muted">
            다 읽으면 원작의 제목과 사진이 여기에 걸립니다.
          </p>
        )}
      </section>
    </main>
  )
}
