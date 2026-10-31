import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Header } from './Shell'
import { btn } from './styles'
import { Notice, Wall } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '주소', id: f.ids.tabUrl },
    { key: 'text', label: '본문', id: f.ids.tabText },
  ]

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next: InputTab = f.tab === 'url' ? 'text' : 'url'
    f.setTab(next)
    document.getElementById(next === 'url' ? f.ids.tabUrl : f.ids.tabText)?.focus()
  }

  const error = f.error
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={btn.primary}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '시작'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )

  return (
    <div className="min-h-dvh">
      <Header steps={inputSteps()} />
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-[1500px] flex-col justify-between gap-24 px-5 pb-10 pt-16 sm:px-10 sm:pt-28">
        <section aria-labelledby="gal-title" className="flex max-w-[62rem] flex-col gap-14">
          {f.backendDown && (
            <Notice title="백엔드 서버가 꺼져 있습니다">백엔드를 실행한 뒤 새로고침하세요.</Notice>
          )}

          <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex items-center gap-7">
            {tabs.map((t) => (
              <button
                key={t.key}
                id={t.id}
                type="button"
                role="tab"
                aria-selected={f.tab === t.key}
                aria-controls={f.ids.panel}
                tabIndex={f.tab === t.key ? 0 : -1}
                onClick={() => f.setTab(t.key)}
                className={cx(
                  'min-h-11 min-w-11 text-[13px] font-medium uppercase tracking-[0.14em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink',
                  f.tab === t.key ? 'text-ink underline decoration-1 underline-offset-[8px]' : 'text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-8">
            {f.tab === 'url' ? (
              <>
                <h1 id="gal-title" className="sr-only">
                  블로그 글을 쇼츠 영상으로
                </h1>
                <label htmlFor={f.ids.url} className="text-[clamp(2rem,6.2vw,5.25rem)] font-extralight leading-[1.1] tracking-[-0.04em] text-muted">
                  글의 주소를 놓아 주세요.
                </label>
                <input
                  id={f.ids.url}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="blog.naver.com/아이디/글번호"
                  value={f.url}
                  onChange={(e) => f.setUrl(e.target.value)}
                  aria-invalid={f.urlError ? true : undefined}
                  aria-describedby={f.ids.urlHint}
                  className="min-h-16 w-full border-0 border-b border-ink bg-transparent px-0 text-[clamp(1.25rem,3vw,2rem)] font-light text-ink placeholder:text-placeholder focus:border-b-2 focus:outline-none aria-invalid:border-dashed"
                />
                <p id={f.ids.urlHint} className={cx('m-0 min-h-6 text-[14px]', f.urlError ? 'font-semibold text-ink' : 'text-muted')}>
                  {f.urlError ? `△ ${f.urlError}` : 'm.blog.naver.com 주소도 됩니다. 다른 블로그의 글은 본문으로 놓아 주세요.'}
                </p>
              </>
            ) : (
              <>
                <h1 id="gal-title" className="sr-only">
                  블로그 글을 쇼츠 영상으로
                </h1>
                <label htmlFor={f.ids.text} className="text-[clamp(2rem,6.2vw,5.25rem)] font-extralight leading-[1.1] tracking-[-0.04em] text-muted">
                  글을 붙여 넣어 주세요.
                </label>
                <textarea
                  id={f.ids.text}
                  rows={7}
                  placeholder="본문"
                  value={f.text}
                  onChange={(e) => f.setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                  }}
                  aria-invalid={f.textTooShort ? true : undefined}
                  aria-describedby={f.ids.textHint}
                  className="w-full resize-y border-0 border-b border-ink bg-transparent px-0 py-3 text-[clamp(1.125rem,2.2vw,1.5rem)] font-light leading-[1.7] text-ink placeholder:text-placeholder focus:border-b-2 focus:outline-none aria-invalid:border-dashed"
                />
                <p id={f.ids.textHint} className={cx('m-0 text-[14px] tabular-nums', f.textTooShort ? 'font-semibold text-ink' : 'text-muted')}>
                  {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · △ 너무 짧습니다'}
                </p>
              </>
            )}
            <div>{submit}</div>
          </form>

          {error && (
            <Notice
              tone={error.kind === 'input' ? 'note' : 'error'}
              title={error.kind === 'network' ? '서버에 연결하지 못했습니다' : error.kind === 'server' ? '서버에서 오류가 났습니다' : '입력을 확인해 주세요'}
              actions={
                error.canRetry ? (
                  <button type="button" className={btn.link} onClick={() => f.submit()}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    다시 시도
                  </button>
                ) : undefined
              }
            >
              {error.kind !== 'input' && <ServerOff aria-hidden="true" className="mr-2 inline size-4" />}
              {error.message}
            </Notice>
          )}
        </section>

        <footer className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <ol className="m-0 flex list-none flex-wrap gap-x-12 gap-y-3 p-0 text-[14px] text-muted" aria-label="작업 순서">
            {['읽는다', '나눈다', '고친다', '내보낸다'].map((t, i) => (
              <li key={t}>
                <span className="mr-2 text-[11px] tabular-nums text-ink">{String(i + 1).padStart(2, '0')}</span>
                {t}
              </li>
            ))}
          </ol>
          <figure aria-label="결과 예시" className="m-0 flex items-end gap-4">
            <div className="w-[88px]">
              <Stage>
                <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
              </Stage>
            </div>
            <figcaption>
              <Wall>샘플 미리보기</Wall>
              <p className="m-0 mt-1 text-[12px] tabular-nums text-muted">1080 × 1920, 9:16</p>
            </figcaption>
          </figure>
        </footer>
      </main>
    </div>
  )
}
