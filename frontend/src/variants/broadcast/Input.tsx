import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Room } from './Shell'
import { btn, field } from './styles'
import { Alert, Monitor, Mono, Tally } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string; ch: string }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl, ch: 'SRC 1' },
    { key: 'text', label: '글 붙여넣기', id: f.ids.tabText, ch: 'SRC 2' },
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
  const take = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.take, 'shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      {f.pending ? 'Sending' : 'Take'}
    </button>
  )

  return (
    <Room steps={inputSteps()}>
      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-labelledby="bc-title" className="flex min-w-0 flex-col gap-5">
          {f.backendDown && (
            <Alert icon={ServerOff} title="NO SIGNAL · 백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <div className="overflow-hidden rounded-card border border-edge bg-panel">
            <div className="flex items-center justify-between gap-3 border-b border-edge bg-panel-2 px-4 py-2">
              <Mono className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">Source select</Mono>
              <Mono className="text-[12px] text-muted">BUS A</Mono>
            </div>
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <h1 id="bc-title" className="m-0 font-display text-[clamp(2.25rem,5.5vw,4rem)] font-bold uppercase leading-[0.95] tracking-[0.02em]">
                글을 넣으면
                <br />
                <span className="text-accent-bright">영상이 송출됩니다.</span>
              </h1>
              <p className="m-0 max-w-xl text-[15px] leading-[1.7] text-muted">네이버 블로그 글을 소스로 선택하면 30~60초 세로 영상 초안이 만들어집니다. 송출 전에 장면 문구와 이미지를 직접 확인합니다.</p>

              <div role="tablist" aria-label="소스 선택" onKeyDown={onTabKey} className="grid grid-cols-2 gap-2 sm:max-w-md">
                {tabs.map((t) => {
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
                        'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-control border px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hi',
                        on ? 'border-hi bg-hi text-on-hi' : 'border-edge bg-panel-2 text-ink hover:border-muted',
                      )}
                    >
                      <Mono className={cx('text-[11px] font-semibold tracking-[0.14em]', on ? 'text-on-hi' : 'text-muted')}>{t.ch}</Mono>
                      <span className="text-[14px] font-semibold leading-tight">{t.label}</span>
                    </button>
                  )
                })}
              </div>

              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="font-display text-[19px] font-semibold uppercase tracking-[0.08em]">
                      글 주소
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
                        className={cx(field, 'min-h-14 flex-1 font-mono text-[16px]')}
                      />
                      {take}
                    </div>
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-5 font-mono text-[12px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                      {f.urlError ?? '모바일 주소(m.blog.naver.com)도 입력할 수 있습니다.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="font-display text-[19px] font-semibold uppercase tracking-[0.08em]">
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
                        <div className="flex h-2 gap-px" aria-hidden="true">
                          {Array.from({ length: 20 }, (_, i) => (
                            <i key={i} className={cx('h-full flex-1', i < Math.round(pct / 5) ? (pct >= 100 ? 'bg-hi' : 'bg-hook') : 'bg-line')} />
                          ))}
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 font-mono text-[12px]', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                          LEVEL {f.chars.toLocaleString()} / MIN {f.minChars}
                          {f.textTooShort && ' · 본문이 너무 짧습니다'}
                        </p>
                      </div>
                      {take}
                    </div>
                  </>
                )}
              </form>
            </div>
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

          <ol className="m-0 grid list-none gap-px overflow-hidden rounded-card border border-edge bg-edge p-0 sm:grid-cols-3">
            {[
              ['CH01', '글 읽기', '문단과 사진을 순서대로 읽습니다.'],
              ['CH02', '대본·장면', 'Hook 1 · 본문 · CTA 1로 나눕니다.'],
              ['CH03', '영상 송출', '음성·자막을 입혀 MP4로 만듭니다.'],
            ].map(([ch, t, d]) => (
              <li key={ch} className="bg-panel p-4">
                <Mono className="text-[12px] font-semibold text-hi">{ch}</Mono>
                <p className="m-0 mt-1 text-[15px] font-semibold">{t}</p>
                <p className="m-0 mt-1 text-[13px] leading-[1.6] text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[17rem] lg:mx-0">
          <Monitor tag={<Tally tone="pvw">PVW · 샘플</Tally>} info="샘플 미리보기 · 1080×1920">
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Monitor>
        </aside>
      </main>
    </Room>
  )
}
