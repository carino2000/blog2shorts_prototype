import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Sheet } from './Shell'
import { btn, field } from './styles'
import { Alert, Dimensioned, Mono, Tag } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string; code: string }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl, code: 'A' },
    { key: 'text', label: '글 붙여넣기', id: f.ids.tabText, code: 'B' },
  ]

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const next: InputTab = f.tab === 'url' ? 'text' : 'url'
    f.setTab(next)
    document.getElementById(next === 'url' ? f.ids.tabUrl : f.ids.tabText)?.focus()
  }

  const error = f.error
  const pct = Math.min(100, Math.round((f.chars / f.minChars) * 100))
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-12 shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? '접수 중' : '설계 시작'}
    </button>
  )

  return (
    <Sheet steps={inputSteps()} title="블로그 글 → 세로 영상 설계도">
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="bp-title" className="flex min-w-0 flex-col gap-8">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <header className="flex flex-col gap-3">
            <Tag>도면 번호 B2S-001 · 입력</Tag>
            <h1 id="bp-title" className="m-0 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05]">
              글 한 편을
              <br />
              <span className="text-accent">영상 한 편의 도면</span>으로.
            </h1>
            <p className="m-0 max-w-xl text-[15px] leading-[1.75] text-muted">네이버 블로그 글을 입력하면 장면 구성이 도면처럼 정리되고, 30~60초 세로 영상으로 조립됩니다. 조립 전에 모든 부품(문구·이미지)을 직접 확인합니다.</p>
          </header>

          <div className="border border-edge">
            <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="grid grid-cols-2 border-b border-edge">
              {tabs.map((t, i) => {
                const on = f.tab === t.key
                return (
                  <button
                    key={t.key}
                    id={t.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls={f.ids.panel}
                    tabIndex={on ? 0 : -1}
                    onClick={() => f.setTab(t.key)}
                    className={cx(
                      'flex min-h-12 flex-col justify-center gap-0 px-4 text-left sm:flex-row sm:items-center sm:gap-3 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                      i === 0 && 'border-r border-edge',
                      on ? 'bg-accent text-on-accent' : 'text-ink hover:bg-panel-2',
                    )}
                  >
                    <Mono className="text-[13px] font-semibold">방식 {t.code}</Mono>
                    <span className="text-[14px] font-semibold">{t.label}</span>
                  </button>
                )
              })}
            </div>

            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3 p-5">
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-hi">
                    글 주소
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
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
                      className={cx(field, 'min-h-12 flex-1 font-mono text-[15px]')}
                    />
                    {submit}
                  </div>
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[13px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                    {f.urlError ?? '모바일 주소(m.blog.naver.com)도 쓸 수 있습니다.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-hi">
                    본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={8}
                    placeholder="본문을 붙여 넣으세요."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className={cx(field, 'resize-y py-2 text-[15px] leading-[1.7]')}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="relative h-3 border border-edge" aria-hidden="true">
                        <div className={cx('h-full transition-[width] duration-200', pct >= 100 ? 'bg-cta' : 'bg-accent')} style={{ width: `${pct}%` }} />
                      </div>
                      <p id={f.ids.textHint} className={cx('m-0 font-mono text-[12px]', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                        {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 본문이 너무 짧습니다'}
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
              title={error.kind === 'network' ? '서버에 연결하지 못했습니다' : error.kind === 'server' ? '서버에서 오류가 났습니다' : '입력을 확인해 주세요'}
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

          <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
            {[
              ['1', '글 읽기', '문단과 사진을 순서대로 읽습니다.'],
              ['2', '장면 설계', 'Hook 1 · 본문 · CTA 1로 나눕니다.'],
              ['3', '영상 조립', '음성·자막을 입혀 MP4로 만듭니다.'],
            ].map(([n, t, d]) => (
              <li key={n} className="bp-dash flex gap-3 border-t pt-3">
                <Mono className="text-[13px] font-semibold text-accent">{n}</Mono>
                <div>
                  <p className="m-0 text-[15px] font-semibold">{t}</p>
                  <p className="m-0 mt-1 text-[13px] leading-[1.6] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[18rem] lg:mx-0">
          <Tag className="mb-3 block">완성 예시 · 샘플 미리보기</Tag>
          <Dimensioned>
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Dimensioned>
        </aside>
      </div>
    </Sheet>
  )
}
