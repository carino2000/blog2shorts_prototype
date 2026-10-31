import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Page } from './Shell'
import { area, btn, field } from './styles'
import { Alert, Bubble, Chip } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl },
    { key: 'text', label: '글 붙여넣기', id: f.ids.tabText },
  ]

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const next: InputTab = f.tab === 'url' ? 'text' : 'url'
    f.setTab(next)
    document.getElementById(next === 'url' ? f.ids.tabUrl : f.ids.tabText)?.focus()
  }

  const error = f.error
  const pct = Math.min(100, Math.round((f.chars / f.minChars) * 100))
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '영상 만들기'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )

  return (
    <Page steps={inputSteps()}>
      <main className="mx-auto grid max-w-[1180px] items-center gap-x-14 gap-y-12 px-5 pb-44 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section aria-labelledby="sf-title" className="flex min-w-0 flex-col gap-8">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있어요">
              백엔드를 실행한 뒤 새로고침해 주세요.
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <h1 id="sf-title" className="m-0 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[1.12]">
              블로그 글이
              <br />
              짧은 영상이 되는 <span className="text-accent">시간.</span>
            </h1>
            <p className="m-0 max-w-lg text-[17px] leading-[1.8] text-muted">네이버 블로그 글을 넣어 주세요. 30~60초 세로 영상 초안을 만들고, 문구와 이미지는 마음에 들 때까지 고칠 수 있어요.</p>
          </div>

          <div className="flex flex-col gap-3">
            <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="inline-flex w-fit rounded-full bg-ink/[0.07] p-1">
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
                  className={cx('min-h-11 rounded-full px-5 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', f.tab === t.key ? 'bg-white text-ink shadow-md' : 'text-muted hover:text-ink')}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3">
              {f.tab === 'url' ? (
                <>
                  <div className="sf-glass flex flex-col gap-2 rounded-[32px] p-2 sm:flex-row sm:items-center sm:rounded-full">
                    <label htmlFor={f.ids.url} className="sr-only">
                      글 주소
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
                      className={cx(field, 'min-h-14 min-w-0 flex-1 text-[17px]')}
                    />
                    {submit}
                  </div>
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-6 px-5 text-[14px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                    {f.urlError ?? '모바일 주소(m.blog.naver.com)도 괜찮아요.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="sr-only">
                    본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={8}
                    placeholder="본문을 붙여 넣어 주세요."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className={cx(area, 'text-[16px] leading-[1.75]')}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 px-2">
                      <div className="h-2.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
                        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <p id={f.ids.textHint} className={cx('m-0 text-[14px] tabular-nums', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                        {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 조금 더 붙여 넣어 주세요'}
                      </p>
                    </div>
                    {submit}
                  </div>
                </>
              )}
            </form>
          </div>

          {error && (
            <Alert
              icon={error.kind === 'input' ? undefined : ServerOff}
              title={error.kind === 'network' ? '서버에 연결하지 못했어요' : error.kind === 'server' ? '서버에서 오류가 났어요' : '입력을 확인해 주세요'}
              actions={
                error.canRetry ? (
                  <button type="button" className={btn.ghost} onClick={() => f.submit()}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    다시 시도
                  </button>
                ) : undefined
              }
            >
              {error.message}
            </Alert>
          )}

          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            <li>
              <Chip>1 글 읽기</Chip>
            </li>
            <li>
              <Chip>2 대본·장면 만들기</Chip>
            </li>
            <li>
              <Chip tone="accent">3 영상 완성</Chip>
            </li>
          </ul>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[16rem] lg:mx-0">
          <div className="sf-float">
            <Bubble>
              <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
            </Bubble>
          </div>
          <p className="m-0 mt-5 text-center text-[13px] text-muted">샘플 미리보기 · 1080×1920</p>
        </aside>
      </main>
    </Page>
  )
}
