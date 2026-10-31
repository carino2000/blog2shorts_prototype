import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Header } from './Shell'
import { NOTE, btn, field } from './styles'
import { Hand, Memo, Polaroid } from './ui'

const FLOW: { role: 'hook' | 'body' | 'cta'; tilt: string; head: string; body: string }[] = [
  { role: 'hook', tilt: '-rotate-2', head: '1. 읽어요', body: '글의 문단과 사진을 차례대로 읽어 둬요.' },
  { role: 'body', tilt: 'rotate-1', head: '2. 나눠요', body: '장면 4~6개로 나눠 대본을 써 드려요.' },
  { role: 'cta', tilt: '-rotate-1', head: '3. 다듬어요', body: '문구와 사진을 함께 고친 뒤 MP4로 만들어요.' },
]

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
      {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중…' : '만들어 볼게요'}
      {!f.pending && <ArrowRight aria-hidden="true" className="size-5" />}
    </button>
  )

  return (
    <div className="min-h-dvh">
      <Header steps={inputSteps()} />
      <main className="mx-auto grid max-w-[1120px] gap-x-14 gap-y-12 px-5 pb-24 pt-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="paper-title" className="flex min-w-0 flex-col gap-10">
          {f.backendDown && (
            <Memo icon={ServerOff} title="백엔드 서버가 꺼져 있어요">
              백엔드를 실행한 뒤 새로고침해 주세요.
            </Memo>
          )}

          <div className={cx(NOTE, 'paper-tape flex flex-col gap-7 bg-surface p-6 sm:p-9')} style={{ ['--note' as string]: '#fffdf7' }}>
            <div className="flex flex-col gap-3">
              <Hand id="paper-title" className="text-[clamp(2.25rem,5.5vw,3.5rem)]">
                안녕하세요,
                <br />
                어떤 글을 영상으로 옮겨 볼까요?
              </Hand>
              <p className="m-0 max-w-[32rem] text-[18px] leading-[1.8] text-muted">네이버 블로그 글이면 주소만, 다른 곳의 글이면 본문을 붙여 넣어 주세요. 30~60초 세로 영상의 초안을 천천히 만들어 드릴게요.</p>
            </div>

            <div>
              <div role="tablist" aria-label="글을 가져오는 방법" onKeyDown={onTabKey} className="flex gap-2">
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
                      'min-h-12 whitespace-nowrap rounded-t-[10px] border-2 border-b-0 px-4 sm:px-5 font-display text-[22px] font-bold leading-none focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent',
                      f.tab === t.key ? 'border-ink/60 bg-panel-2 text-ink' : 'border-ink/20 text-muted hover:text-ink',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-4 border-2 border-ink/60 bg-panel-2 p-5 sm:p-6">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="font-display text-[22px] font-bold leading-none">
                      글 주소를 적어 주세요
                    </label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-6 text-[16px]', f.urlError ? 'font-bold text-danger-ink' : 'text-muted')}>
                      {f.urlError ?? '모바일 주소(m.blog.naver.com)도 괜찮아요.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="font-display text-[22px] font-bold leading-none">
                      글을 붙여 넣어 주세요
                    </label>
                    <textarea
                      id={f.ids.text}
                      rows={8}
                      placeholder="여기에 글 본문을 붙여 넣어 주세요."
                      value={f.text}
                      onChange={(e) => f.setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                      }}
                      aria-invalid={f.textTooShort ? true : undefined}
                      aria-describedby={f.ids.textHint}
                      className="paper-lined w-full resize-y border-0 bg-transparent px-1 text-[18px] text-ink placeholder:text-placeholder focus:outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-accent"
                    />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="h-2.5 rounded-full border-2 border-dashed border-ink/40" aria-hidden="true">
                          <div className={cx('h-full rounded-full transition-[width] duration-200', f.textTooShort ? 'bg-danger' : 'bg-accent')} style={{ width: `${pct}%` }} />
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 text-[16px]', f.textTooShort ? 'font-bold text-danger-ink' : 'text-muted')}>
                          {f.chars.toLocaleString()}자 · {f.textTooShort ? `조금만 더 써 주세요(최소 ${f.minChars}자)` : `최소 ${f.minChars}자`}
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
            <Memo
              icon={error.kind === 'input' ? undefined : ServerOff}
              title={error.kind === 'network' ? '서버에 연결하지 못했어요' : error.kind === 'server' ? '서버에 문제가 생겼어요' : '입력한 내용을 한 번만 확인해 주세요'}
              actions={
                error.canRetry ? (
                  <button type="button" className={btn.ghost} onClick={() => f.submit()}>
                    <RotateCcw aria-hidden="true" className="size-5" />
                    다시 해 볼게요
                  </button>
                ) : undefined
              }
            >
              {error.message}
            </Memo>
          )}

          <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-3" aria-label="작업 순서">
            {FLOW.map((s) => (
              <li key={s.head} data-note={s.role} className={cx(NOTE, 'paper-tape flex flex-col gap-1 p-5 motion-reduce:rotate-0', s.tilt)}>
                <Hand as="p" className="text-[26px]">
                  {s.head}
                </Hand>
                <p className="m-0 text-[16px] leading-[1.65]">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[280px] lg:mx-0 lg:pt-8">
          <Polaroid caption="샘플이에요" tilt="rotate-2">
            <Stage>
              <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
            </Stage>
          </Polaroid>
          <p className="m-0 mt-4 text-center text-[15px] text-muted">샘플 미리보기 · 1080×1920 세로 영상</p>
        </aside>
      </main>
    </div>
  )
}
