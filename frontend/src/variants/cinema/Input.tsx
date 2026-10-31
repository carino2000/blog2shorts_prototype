import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Page } from './Shell'
import { btn, field } from './styles'
import { Label, Notice, Poster } from './ui'

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
      {f.pending ? '보내는 중' : '상영 시작'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )

  return (
    <Page steps={inputSteps()}>
      <main className="mx-auto grid max-w-[1400px] items-center gap-x-16 gap-y-16 px-5 pb-8 pt-14 sm:px-10 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <section aria-labelledby="cin-title" className="flex min-w-0 flex-col gap-12">
          {f.backendDown && (
            <Notice icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Notice>
          )}

          <div className="flex flex-col gap-6">
            <Label>A blog2shorts feature presentation</Label>
            <Poster id="cin-title">
              한 편의 글,
              <br />
              <span className="text-accent">한 편의 영화.</span>
            </Poster>
            <p className="m-0 max-w-[32rem] font-display text-[19px] leading-[1.9] text-muted">네이버 블로그 글을 건네면 30~60초 세로 영상의 시사본이 나옵니다. 장면의 대사와 컷은 상영 전에 직접 다듬습니다.</p>
          </div>

          <div className="cin-ticket bg-panel-2 p-1">
            <div className="border border-dashed border-accent/50 p-6 sm:p-9">
              <div role="tablist" aria-label="입장 방법" onKeyDown={onTabKey} className="mb-6 flex gap-6">
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
                      'min-h-11 font-sans text-[12px] font-semibold uppercase tracking-[0.22em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                      f.tab === t.key ? 'border-b border-accent text-accent' : 'text-muted hover:text-ink',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-4">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="font-display text-[22px] font-bold">
                      글의 주소를 적어 주세요
                    </label>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
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
                        className={cx(field, 'min-h-12 flex-1 text-[19px]')}
                      />
                      {submit}
                    </div>
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-6 text-[15px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                      {f.urlError ?? '모바일 주소(m.blog.naver.com)도 입장할 수 있습니다.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="font-display text-[22px] font-bold">
                      글을 붙여 넣어 주세요
                    </label>
                    <textarea
                      id={f.ids.text}
                      rows={7}
                      placeholder="본문을 붙여 넣으세요."
                      value={f.text}
                      onChange={(e) => f.setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                      }}
                      aria-invalid={f.textTooShort ? true : undefined}
                      aria-describedby={f.ids.textHint}
                      className={cx(field, 'resize-y py-2 text-[17px] leading-[1.8]')}
                    />
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="h-px bg-edge" aria-hidden="true">
                          <div className="-mt-px h-[3px] bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 text-[14px] tabular-nums', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                          {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 대본이 너무 짧습니다'}
                        </p>
                      </div>
                      {submit}
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>

          {error && (
            <Notice
              icon={error.kind === 'input' ? undefined : ServerOff}
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
              {error.message}
            </Notice>
          )}
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[280px] lg:mx-0">
          <div className="border border-accent/50 bg-black p-3 shadow-[0_30px_80px_-30px_rgba(120,18,30,0.8)]">
            <Stage>
              <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
            </Stage>
            <p className="m-0 mt-3 text-center font-display text-[20px] font-bold tracking-[0.12em]">NOW SHOWING</p>
            <p className="m-0 mt-1 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">샘플 미리보기 · 1080×1920</p>
          </div>
        </aside>
      </main>
    </Page>
  )
}
