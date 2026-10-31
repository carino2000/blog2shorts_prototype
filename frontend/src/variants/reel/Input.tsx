import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Field } from './Shell'
import { btn, field } from './styles'
import { Alert, Giant } from './ui'

const WORDS = ['읽기', '나누기', '고치기', '내보내기']

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
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-16 shrink-0 px-10 text-[26px]')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-6 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '릴 만들기'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-6" />}
    </button>
  )

  return (
    <Field tone="coral" steps={inputSteps()}>
      <main className="mx-auto grid max-w-[1280px] gap-x-16 gap-y-14 px-5 pb-24 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section aria-labelledby="reel-title" className="flex min-w-0 flex-col gap-10">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <div className="flex flex-col gap-7">
            <Giant id="reel-title">
              글 하나,
              <br />
              릴 하나.
            </Giant>
            <p className="m-0 max-w-[30rem] text-[21px] font-semibold leading-[1.55]">블로그 글을 넣으면 30~60초짜리 세로 영상 초안이 나옵니다. 장면마다 문구와 사진은 직접 바꿉니다.</p>
          </div>

          <div className="flex flex-col gap-6">
            <div role="tablist" aria-label="넣는 방법" onKeyDown={onTabKey} className="flex gap-3">
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
                    'min-h-12 px-5 font-display text-[28px] leading-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ink',
                    f.tab === t.key ? 'bg-ink text-on-accent' : 'border-[3px] border-ink hover:bg-panel-2',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-4">
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="sr-only">
                    네이버 블로그 글 주소
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
                    className={cx(field, 'min-h-16 text-[clamp(1.375rem,3.4vw,2.5rem)] font-bold')}
                  />
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-6 text-[17px] font-semibold', !f.urlError && 'text-muted')}>
                    {f.urlError ? `▲ ${f.urlError}` : 'm.blog.naver.com 주소도 됩니다. 다른 블로그는 본문으로 넣어 주세요.'}
                  </p>
                  <div>{submit}</div>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="sr-only">
                    글 본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={7}
                    placeholder="글 본문을 붙여 넣으세요."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className={cx(field, 'resize-y text-[22px] font-semibold leading-[1.6]')}
                  />
                  <p id={f.ids.textHint} className={cx('m-0 text-[17px] font-semibold', !f.textTooShort && 'text-muted')}>
                    <span className="tabular-nums">{f.chars.toLocaleString()}</span>자 · {f.textTooShort ? `▲ 너무 짧습니다. 최소 ${f.minChars}자` : `최소 ${f.minChars}자`}
                    <span className="max-sm:hidden"> · Ctrl+Enter</span>
                  </p>
                  <div>{submit}</div>
                </>
              )}
            </form>

            {error && (
              <Alert
                icon={error.kind === 'input' ? undefined : ServerOff}
                title={error.kind === 'network' ? '서버에 연결하지 못했습니다' : error.kind === 'server' ? '서버에서 오류가 났습니다' : '입력을 확인해 주세요'}
                actions={
                  error.canRetry ? (
                    <button type="button" className={btn.onInk} onClick={() => f.submit()}>
                      <RotateCcw aria-hidden="true" className="size-5" />
                      다시 시도
                    </button>
                  ) : undefined
                }
              >
                {error.message}
              </Alert>
            )}
          </div>
        </section>

        <aside aria-label="결과 예시" className="mx-auto flex w-full max-w-[300px] flex-col gap-5 lg:mx-0 lg:pt-6">
          <div className="-rotate-3 border-[6px] border-ink bg-ink shadow-[12px_12px_0_#0a0a0a] motion-reduce:rotate-0">
            <Stage>
              <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
            </Stage>
          </div>
          <p className="m-0 mt-2 font-display text-[18px] leading-tight">샘플 미리보기 · 1080×1920</p>
        </aside>

        <div aria-hidden="true" className="-mx-5 overflow-hidden bg-ink py-3 text-on-accent lg:col-span-2">
          <div className="reel-marquee flex w-max gap-10 whitespace-nowrap font-display text-[clamp(1.5rem,4vw,2.75rem)] leading-none">
            {[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => (
              <span key={i}>
                {w} <span className="mx-4 opacity-60">●</span>
              </span>
            ))}
          </div>
        </div>
      </main>
    </Field>
  )
}
