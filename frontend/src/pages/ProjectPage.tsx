import { FileText, ImageIcon, RotateCcw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { assetUrl, isApiError } from '../api'
import { useRegenerate } from '../api/queries/useRegenerate'
import type { Project } from '../api/types'
import { ErrorBanner } from '../components/ErrorBanner'
import { ProjectShell } from '../components/ProjectShell'
import { StageList, type StageItem } from '../components/StageList'
import { btnPrimary, btnSecondary } from '../lib/ui'

/** /projects/:id — 처리 중(extracting·scripting)과 그 단계의 오류. 끝나면 ProjectShell이 알맞은 화면으로 보낸다 */
export function ProjectPage() {
  const { id = '' } = useParams()
  return <ProjectShell id={id} view="processing">{(project) => <Processing project={project} />}</ProjectShell>
}

function Processing({ project }: { project: Project }) {
  const navigate = useNavigate()
  const regenerate = useRegenerate(project.id)
  const { status, progress, error, source, assets } = project

  const extractDone = source.blocks.length > 0
  const failedStage = status === 'error' ? error?.stage : undefined

  const stages: StageItem[] = [
    {
      key: 'extract',
      label: extractDone || failedStage === 'extract' ? '글 구조 읽기' : '글 구조 읽는 중',
      state: failedStage === 'extract' ? 'failed' : extractDone ? 'done' : 'active',
      percent: progress?.stage === 'extract' ? progress.percent : undefined,
    },
    {
      key: 'script',
      label: status === 'scripting' ? '대본과 장면 만드는 중' : '대본과 장면 만들기',
      state: failedStage === 'script' ? 'failed' : status === 'scripting' ? 'active' : 'pending',
      percent: progress?.stage === 'script' ? progress.percent : undefined,
    },
  ]

  const paragraphs = source.blocks.filter((b) => b.type !== 'image').length
  const images = assets.filter((a) => a.origin === 'blog')

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="m-0 text-page font-bold">{status === 'error' ? '처리하지 못했습니다' : '영상 초안을 준비하고 있습니다'}</h1>
        <p className="m-0 mt-1 text-sm text-muted" aria-live="polite">
          {status === 'error' ? '아래 안내를 따라 다시 시작해 주세요.' : progress?.message ?? '잠시만 기다려 주세요.'}
        </p>
      </div>

      {error && (
        <ErrorBanner
          message={error.message}
          actions={<ErrorActions code={error.code} onRegenerate={() => regenerate.mutate()} pending={regenerate.isPending} />}
        />
      )}
      {regenerate.isError && (
        <ErrorBanner message={isApiError(regenerate.error) ? regenerate.error.message : '다시 시도하지 못했습니다.'} />
      )}

      <StageList items={stages} />

      {extractDone && (
        <section aria-labelledby="extracted-title" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <h2 id="extracted-title" className="m-0 text-note font-semibold text-muted">
            읽어 온 글
          </h2>
          <p className="m-0 text-card font-semibold">{source.title ?? '직접 입력한 본문'}</p>
          <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
            <span className="flex items-center gap-1">
              <FileText aria-hidden="true" className="size-4" /> 문단 {paragraphs}개
            </span>
            <span className="flex items-center gap-1">
              <ImageIcon aria-hidden="true" className="size-4" /> 이미지 {images.length}장
            </span>
          </p>
          {images.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0 sm:grid-cols-6">
              {images.map((a) => (
                <li key={a.id} className="aspect-square overflow-hidden rounded-small border border-line bg-bg">
                  <img src={assetUrl(a)} alt="" className="size-full object-cover" loading="lazy" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-sm text-muted">이 글에는 이미지가 없습니다. 장면 편집에서 이미지를 올릴 수 있어요.</p>
          )}
          <p className="m-0 text-xs text-muted">내 글이 제대로 읽혔는지 확인해 보세요. 이상하면 본문 직접 입력으로 다시 시작할 수 있습니다.</p>
          {status !== 'error' && (
            <div>
              <button type="button" className={btnSecondary} onClick={() => navigate('/?tab=text')}>
                본문 직접 입력으로 다시 시작
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function ErrorActions({ code, onRegenerate, pending }: { code: string; onRegenerate: () => void; pending: boolean }) {
  if (code === 'EXTRACT_FAILED' || code === 'POST_NOT_FOUND') {
    return (
      <Link to="/?tab=text" className={btnPrimary}>
        본문 직접 입력으로 다시 시작
      </Link>
    )
  }
  if (code === 'LLM_FAILED') {
    return (
      <button type="button" className={btnPrimary} onClick={onRegenerate} disabled={pending}>
        <RotateCcw aria-hidden="true" className="size-4" />
        {pending ? '요청 중…' : '다시 시도'}
      </button>
    )
  }
  return (
    <Link to="/" className={btnSecondary}>
      처음으로
    </Link>
  )
}
