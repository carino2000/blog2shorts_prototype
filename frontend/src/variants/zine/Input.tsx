import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Page, Top } from './Shell'
import { BOX, btn, field } from './styles'
import { Alert, Hl, Shout } from './ui'

const STEPS: { tilt: string; bg: string; head: string; body: string }[] = [
  { tilt: '-rotate-1', bg: 'bg-hi', head: '1 읽는다', body: '문단과 사진을 순서대로 긁어 온다.' },
  { tilt: 'rotate-1', bg: 'bg-surface', head: '2 쪼갠다', body: 'Hook·본문·CTA로 장면 4~6개를 쓴다.' },
  { tilt: '-rotate-1', bg: 'bg-accent', head: '3 다듬는다', body: '문구와 사진을 고쳐서 MP4로 뽑는다.' },
]

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '주소로', id: f.ids.tabUrl },
    { key: 'text', label: '본문으로', id: f.ids.tabText },
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
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-14 shrink-0 text-[26px]')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '던지기!'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-6" />}
    </button>
  )

  return (
    <div className="min-h-dvh">
      <Top steps={inputSteps()} />
      <Page>
        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-labelledby="zine-title" className="flex min-w-0 flex-col gap-10">
            {f.backendDown && (
              <Alert icon={ServerOff} title="백엔드가 꺼져 있다">
                백엔드를 켜고 새로고침하자.
              </Alert>
            )}

            <div className="flex flex-col gap-6">
              <Shout id="zine-title">
                <Hl>글</Hl>을 던지면
                <br />
                <Hl>영상</Hl>이 튀어나온다!
              </Shout>
              <p className="m-0 max-w-[32rem] text-[19px] font-semibold leading-[1.7]">네이버 블로그 글의 주소나 본문을 던져라. 30~60초 세로 영상 초안이 장면별로 나온다. 문구와 사진은 그다음에 마음대로 갈아 끼운다.</p>
            </div>

            <div>
              <div role="tablist" aria-label="던지는 방법" onKeyDown={onTabKey} className="flex gap-3">
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
                      'min-h-12 border-[3px] border-b-0 border-ink px-5 font-display text-[24px] leading-none focus-visible:outline-[4px] focus-visible:outline-offset-2 focus-visible:outline-ink',
                      f.tab === t.key ? 'bg-hi' : 'bg-surface hover:bg-panel-2',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className={cx(BOX, 'flex flex-col gap-4 p-5 sm:p-7')}>
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="font-display text-[24px] leading-none">
                      글 주소
                    </label>
                    <div className="flex flex-col gap-5 sm:flex-row">
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
                        className={cx(field, 'min-h-14 flex-1')}
                      />
                      {submit}
                    </div>
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-6 text-[16px] font-bold', f.urlError ? 'text-danger-ink' : 'text-muted')}>
                      {f.urlError ? `▲ ${f.urlError}` : '모바일 주소(m.blog.naver.com)도 받는다. 다른 블로그는 본문으로!'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="font-display text-[24px] leading-none">
                      글 본문
                    </label>
                    <textarea
                      id={f.ids.text}
                      rows={8}
                      placeholder="본문을 통째로 붙여 넣어라."
                      value={f.text}
                      onChange={(e) => f.setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                      }}
                      aria-invalid={f.textTooShort ? true : undefined}
                      aria-describedby={f.ids.textHint}
                      className={cx(field, 'resize-y py-3 leading-relaxed')}
                    />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="h-5 border-[3px] border-ink bg-surface" aria-hidden="true">
                          <div className="zine-stripes h-full transition-[width] duration-200" style={{ width: `${pct}%` }} />
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 text-[16px] font-bold tabular-nums', f.textTooShort && 'text-danger-ink')}>
                          {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' ▲ 너무 짧다!'}
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
                title={error.kind === 'network' ? '서버에 못 붙었다' : error.kind === 'server' ? '서버가 뻗었다' : '입력을 확인해라'}
                actions={
                  error.canRetry ? (
                    <button type="button" className={btn.onInk} onClick={() => f.submit()}>
                      <RotateCcw aria-hidden="true" className="size-5" />
                      다시!
                    </button>
                  ) : undefined
                }
              >
                {error.message}
              </Alert>
            )}

            <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-3" aria-label="작업 순서">
              {STEPS.map((s) => (
                <li key={s.head} className={cx('border-[3px] border-ink p-4 shadow-[5px_5px_0_#0a0a0a] motion-reduce:rotate-0', s.tilt, s.bg)}>
                  <p className="m-0 font-display text-[26px] leading-tight">{s.head}</p>
                  <p className="m-0 mt-1 text-[16px] font-semibold leading-[1.55]">{s.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <aside aria-label="결과 예시" className="mx-auto w-full max-w-[280px] lg:mx-0">
            <div className="relative">
              <div className="rotate-2 border-[3px] border-ink bg-ink shadow-[9px_9px_0_var(--accent)] motion-reduce:rotate-0">
                <Stage>
                  <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
                </Stage>
              </div>
              <span className="absolute -left-4 -top-4 -rotate-12 border-[3px] border-ink bg-hi px-3 py-1 font-display text-[22px] leading-none shadow-[3px_3px_0_#0a0a0a] motion-reduce:rotate-0">샘플!</span>
            </div>
            <p className="m-0 mt-6 font-sans text-[15px] font-bold">샘플 미리보기 · 1080×1920</p>
          </aside>
        </div>
      </Page>
    </div>
  )
}
