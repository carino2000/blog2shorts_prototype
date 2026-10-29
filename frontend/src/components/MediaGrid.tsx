import { Check, Loader2, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { assetUrl, isApiError } from '../api'
import { useUploadAsset } from '../api/queries/useUploadAsset'
import type { Asset, Scene } from '../api/types'
import { UPLOAD_ACCEPT, checkUpload } from '../lib/limits'
import { cx } from '../lib/ui'

/**
 * 이 프로젝트의 이미지 격자 + 업로드 칸. 누르면 선택 장면의 이미지가 바뀐다.
 * 선택 장면에 쓰인 이미지는 테두리 강조, 다른 장면에 쓰인 이미지는 장면 번호 배지.
 */
export function MediaGrid({
  projectId,
  assets,
  scenes,
  selectedScene,
  onPick,
}: {
  projectId: string
  assets: Asset[]
  scenes: Scene[]
  selectedScene: Scene | undefined
  onPick: (assetId: string) => void
}) {
  const upload = useUploadAsset(projectId)
  const [clientError, setClientError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const ids = { input: useId(), err: useId() }

  const usedBy = (assetId: string) => scenes.filter((s) => s.assetId === assetId && s.id !== selectedScene?.id).map((s) => s.order)

  function onFile(file: File | undefined) {
    if (!file) return
    upload.reset()
    const problem = checkUpload(file)
    setClientError(problem)
    if (problem) return
    upload.mutate(file, { onSuccess: (asset) => onPick(asset.id) })
  }

  const error = clientError ?? (upload.isError ? (isApiError(upload.error) ? upload.error.message : '업로드하지 못했습니다.') : null)

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-xs text-muted">
        {selectedScene ? `장면 #${selectedScene.order}에 쓸 이미지를 고르세요.` : '장면을 먼저 고르세요.'}
      </p>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
        {assets.map((asset) => {
          const current = asset.id === selectedScene?.assetId
          const others = usedBy(asset.id)
          return (
            <li key={asset.id}>
              <button
                type="button"
                disabled={!selectedScene}
                onClick={() => onPick(asset.id)}
                aria-pressed={current}
                aria-label={`${asset.origin === 'blog' ? '블로그' : '업로드'} 이미지 ${asset.width}×${asset.height}${others.length ? `, 장면 ${others.join(', ')}에서 사용 중` : ''}`}
                className={cx(
                  'relative block aspect-square w-full overflow-hidden rounded-control border-2 bg-bg',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                  current ? 'border-accent' : 'border-transparent hover:border-line',
                )}
              >
                <img src={assetUrl(asset)} alt="" className="size-full object-cover" loading="lazy" />
                <span className="absolute left-1 top-1 rounded bg-black/55 px-1 py-px text-[10px] font-medium text-white">
                  {asset.origin === 'blog' ? '블로그' : '업로드'}
                </span>
                {current && (
                  <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-accent text-white">
                    <Check aria-hidden="true" className="size-3" />
                  </span>
                )}
                {others.length > 0 && (
                  <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1 text-[10px] font-semibold text-ink tabular-nums">
                    {others.map((o) => `#${o}`).join(' ')}
                  </span>
                )}
              </button>
            </li>
          )
        })}
        <li>
          <label
            htmlFor={ids.input}
            className={cx(
              'flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed text-xs',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
              error ? 'border-danger text-danger' : 'border-line text-muted hover:border-accent hover:text-accent',
            )}
          >
            {upload.isPending ? (
              <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="size-5" />
            )}
            {upload.isPending ? '올리는 중' : '업로드'}
            <input
              ref={fileRef}
              id={ids.input}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              aria-describedby={ids.err}
              disabled={upload.isPending || !selectedScene}
              onChange={(e) => {
                onFile(e.target.files?.[0])
                if (fileRef.current) fileRef.current.value = ''
              }}
            />
          </label>
        </li>
      </ul>
      <p id={ids.err} className={cx('m-0 text-xs', error ? 'text-danger' : 'text-muted')} role={error ? 'alert' : undefined}>
        {error ?? 'jpg·png·webp, 10MB 이하. 올린 이미지는 선택한 장면에 바로 들어갑니다.'}
      </p>
    </div>
  )
}
