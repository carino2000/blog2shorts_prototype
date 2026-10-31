// 입력 화면의 동작(검증·제출·오류 종류). 모양은 시안이 정한다.
import { useId, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { isApiError, isConnectionError } from '../../api'
import { useCreateProject } from '../../api/queries/useCreateProject'
import { useHealth } from '../../api/queries/useHealth'
import { countChars } from '../../lib/duration'
import { MIN_TEXT_CHARS } from '../../lib/limits'
import { explainInvalidUrl, isNaverPostUrl } from '../../lib/naverUrl'
import { useVariantTo } from '../useVariant'

export type InputTab = 'url' | 'text'
/** network: 서버에 못 붙음 · server: 서버가 실패 · input: 입력을 고쳐야 함 */
export type InputErrorKind = 'network' | 'server' | 'input'

export function useInputForm() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const vto = useVariantTo()
  const create = useCreateProject()
  const health = useHealth()
  const [url, setUrlState] = useState('')
  const [text, setTextState] = useState('')
  const ids = { url: useId(), text: useId(), urlHint: useId(), textHint: useId(), tabUrl: useId(), tabText: useId(), panel: useId() }

  const tab: InputTab = params.get('tab') === 'text' ? 'text' : 'url'
  const urlError = explainInvalidUrl(url)
  const chars = countChars(text)
  const textTooShort = chars > 0 && chars < MIN_TEXT_CHARS
  const canSubmit = !create.isPending && (tab === 'url' ? isNaverPostUrl(url) : chars >= MIN_TEXT_CHARS)

  function setTab(next: InputTab) {
    create.reset()
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'text') p.set('tab', 'text')
        else p.delete('tab')
        return p
      },
      { replace: true },
    )
  }

  function setUrl(value: string) {
    setUrlState(value)
    if (create.isError) create.reset()
  }

  function setText(value: string) {
    setTextState(value)
    if (create.isError) create.reset()
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!canSubmit) return
    create.mutate(tab === 'url' ? { type: 'url', url: url.trim() } : { type: 'text', text }, {
      onSuccess: ({ id }) => navigate(vto(`/projects/${id}`)),
    })
  }

  const err = create.error
  const kind: InputErrorKind | null = !err
    ? null
    : isConnectionError(err)
      ? isApiError(err) && err.code === 'NETWORK'
        ? 'network'
        : 'server'
      : 'input'
  const error =
    err && kind ? { kind, message: isApiError(err) ? err.message : '요청을 보내지 못했습니다.', canRetry: kind !== 'input' } : null

  return {
    ids,
    tab,
    setTab,
    url,
    setUrl,
    text,
    setText,
    urlError,
    chars,
    minChars: MIN_TEXT_CHARS,
    textTooShort,
    canSubmit,
    pending: create.isPending,
    submit,
    error,
    /** /api/health 실패(백엔드가 꺼져 있음) */
    backendDown: health.isError,
  }
}
