import { ArrowRight, Clapperboard, FileText, Link2, ListTree, Loader2, RotateCcw, ScrollText, ServerOff } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { isApiError, isConnectionError } from '../api'
import { useCreateProject } from '../api/queries/useCreateProject'
import { AppHeader } from '../components/AppHeader'
import { BackendDownNotice } from '../components/BackendDownNotice'
import { ErrorBanner } from '../components/ErrorBanner'
import { PhoneFrame } from '../components/PhoneFrame'
import { SceneFrame } from '../components/SceneFrame'
import { countChars } from '../lib/duration'
import { explainInvalidUrl, isNaverPostUrl } from '../lib/naverUrl'
import { MIN_TEXT_CHARS } from '../lib/limits'
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../lib/render'
import { btnPrimary, btnSecondary, cardHover, cx, inputBase } from '../lib/ui'

type Tab = 'url' | 'text'

const EXAMPLE_IMAGE = '/mock/sample-preview.svg'

export function InputPage() {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'text' ? 'text' : 'url'
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const create = useCreateProject()
  const navigate = useNavigate()
  const ids = { url: useId(), text: useId(), urlHint: useId(), textHint: useId(), tabUrl: useId(), tabText: useId(), panel: useId() }

  const urlError = explainInvalidUrl(url)
  const chars = countChars(text)
  const textTooShort = chars > 0 && chars < MIN_TEXT_CHARS
  const canSubmit =
    !create.isPending && (tab === 'url' ? isNaverPostUrl(url) : chars >= MIN_TEXT_CHARS)

  function selectTab(next: Tab) {
    create.reset()
    setParams(next === 'text' ? { tab: 'text' } : {}, { replace: true })
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!canSubmit) return
    create.mutate(tab === 'url' ? { type: 'url', url: url.trim() } : { type: 'text', text }, {
      onSuccess: ({ id }) => navigate(`/projects/${id}`),
    })
  }

  const serverError = create.error
  const errorMessage = isApiError(serverError) ? serverError.message : serverError ? '요청을 보내지 못했습니다.' : null

  return (
    <div className="min-h-dvh">
      <AppHeader step="input" />
      <main className="mx-auto flex max-w-[1140px] flex-col gap-12 px-5 py-8 sm:gap-16 sm:py-14">
        <BackendDownNotice />

        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_240px] lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-[72px]">
          <section className="flex flex-col gap-7" aria-labelledby="input-title">
            <div className="flex flex-col gap-2">
              <h1 id="input-title" className="m-0 text-title font-bold tracking-tight">
                블로그 글을 쇼츠 영상으로
              </h1>
              <p className="m-0 max-w-[560px] text-sm text-muted">
                네이버 블로그 글 주소나 본문을 넣으면 30~60초 세로 영상 초안을 만듭니다. 장면별 문구와 이미지는 직접 고칠 수 있어요.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="입력 방식"
              className="flex gap-1 rounded-control bg-segment p-1 sm:w-fit"
              onKeyDown={(e) => {
                // 탭 패턴: 좌우 화살표로 옮기고 포커스도 따라간다
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.preventDefault()
                const next: Tab = tab === 'url' ? 'text' : 'url'
                selectTab(next)
                document.getElementById(ids[next === 'url' ? 'tabUrl' : 'tabText'])?.focus()
              }}
            >
              <TabButton id={ids.tabUrl} panelId={ids.panel} active={tab === 'url'} onClick={() => selectTab('url')} icon={<Link2 className="size-4" />}>
                블로그 URL
              </TabButton>
              <TabButton id={ids.tabText} panelId={ids.panel} active={tab === 'text'} onClick={() => selectTab('text')} icon={<FileText className="size-4" />}>
                본문 직접 입력
              </TabButton>
            </div>

            <form
              id={ids.panel}
              role="tabpanel"
              aria-labelledby={tab === 'url' ? ids.tabUrl : ids.tabText}
              onSubmit={submit}
              className="flex flex-col gap-3"
              noValidate
            >
              {tab === 'url' ? (
                <>
                  <label htmlFor={ids.url} className="text-sm font-medium">
                    네이버 블로그 글 주소
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id={ids.url}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="https://blog.naver.com/아이디/글번호"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        if (create.isError) create.reset()
                      }}
                      aria-invalid={urlError ? true : undefined}
                      aria-describedby={ids.urlHint}
                      className={cx(inputBase, 'flex-1')}
                    />
                    <SubmitButton disabled={!canSubmit} pending={create.isPending} />
                  </div>
                  <p id={ids.urlHint} className={cx('m-0 min-h-5 text-note', urlError ? 'text-danger-ink' : 'text-muted')}>
                    {urlError ?? '모바일 주소(m.blog.naver.com)도 됩니다. 다른 블로그는 본문 직접 입력을 써 주세요.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={ids.text} className="text-sm font-medium">
                    블로그 본문
                  </label>
                  <textarea
                    id={ids.text}
                    rows={9}
                    placeholder="글 본문을 붙여 넣어 주세요. 문단은 빈 줄로 나누면 좋습니다."
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      if (create.isError) create.reset()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit()
                    }}
                    aria-invalid={textTooShort ? true : undefined}
                    aria-describedby={ids.textHint}
                    className={cx(inputBase, 'resize-y py-3 leading-relaxed')}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p id={ids.textHint} className={cx('m-0 text-note tabular-nums', textTooShort ? 'text-danger-ink' : 'text-muted')}>
                      {chars.toLocaleString()}자
                      {textTooShort ? ` · 본문이 너무 짧습니다 (최소 ${MIN_TEXT_CHARS}자)` : ` · 최소 ${MIN_TEXT_CHARS}자`}
                      <span className="max-sm:hidden"> · Ctrl+Enter로 제출</span>
                    </p>
                    <SubmitButton disabled={!canSubmit} pending={create.isPending} />
                  </div>
                </>
              )}
            </form>

            {errorMessage && (
              <ErrorBanner
                title={isConnectionError(serverError) ? '서버에 연결하지 못했습니다' : '입력을 확인해 주세요'}
                icon={isConnectionError(serverError) ? ServerOff : undefined}
                message={errorMessage}
                actions={
                  isConnectionError(serverError) ? (
                    <button type="button" className={btnSecondary} onClick={() => submit()}>
                      <RotateCcw aria-hidden="true" className="size-4" />
                      다시 시도
                    </button>
                  ) : undefined
                }
              />
            )}
          </section>

          <aside className="mx-auto w-full max-w-[280px] md:max-w-none" aria-label="결과 예시">
            <PhoneFrame badge="샘플 미리보기" label="샘플 미리보기: 9:16 세로 화면에 블로그 사진과 자막">
              <SceneFrame src={EXAMPLE_IMAGE} subtitle="제주 해안 길, 3시간 걸어 봤어요" />
            </PhoneFrame>
            <p className="m-0 mt-3 text-center text-xs text-muted tabular-nums">
              {VIDEO_WIDTH} × {VIDEO_HEIGHT} · 9:16 세로 영상
            </p>
          </aside>
        </div>

        <section aria-labelledby="how-title">
          <h2 id="how-title" className="m-0 mb-4 text-section font-semibold">
            이렇게 만들어집니다
          </h2>
          <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
            <HowStep n={1} icon={<ListTree className="size-5" />} title="구조 추출">
              글의 문단과 사진을 원문 순서대로 읽습니다.
            </HowStep>
            <HowStep n={2} icon={<ScrollText className="size-5" />} title="대본·장면">
              핵심을 요약하고 Hook·본문·CTA 장면 4~6개로 나눕니다.
            </HowStep>
            <HowStep n={3} icon={<Clapperboard className="size-5" />} title="영상">
              장면을 고친 뒤 음성·자막을 입혀 MP4로 만듭니다.
            </HowStep>
          </ol>
        </section>
      </main>
    </div>
  )
}

function TabButton({
  id,
  panelId,
  active,
  onClick,
  icon,
  children,
}: {
  id: string
  panelId: string
  active: boolean
  onClick: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cx(
        'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-small px-4 text-sm font-medium transition duration-200 ease-out sm:flex-none',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-bright',
        active ? 'bg-surface font-semibold text-ink shadow-segment' : 'text-muted hover:text-ink',
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  )
}

function SubmitButton({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  return (
    <button type="submit" disabled={disabled} className={cx(btnPrimary, 'shrink-0 whitespace-nowrap sm:w-auto')}>
      {pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {pending ? '보내는 중…' : '대본 만들기'}
      {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )
}

function HowStep({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className={cx('flex flex-col gap-3 rounded-card border border-line bg-surface p-5', cardHover)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-bright" aria-hidden="true">
        {icon}
      </span>
      <div>
        <p className="m-0 text-card font-semibold">
          <span className="text-muted tabular-nums">{n}. </span>
          {title}
        </p>
        <p className="m-0 mt-1 text-note text-muted">{children}</p>
      </div>
    </li>
  )
}
