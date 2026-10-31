import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { inputSteps } from '../shared/useProjectGate'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { Header } from './Shell'
import { btn, field, monitorClass } from './styles'
import { Alert, Eyebrow, Mono } from './ui'

const FLOW = [
  { n: '01', title: '글 읽기', body: '문단과 사진을 원문 순서대로 가져옵니다.' },
  { n: '02', title: '장면 나누기', body: 'Hook·본문·CTA로 4~6장면의 대본을 짭니다.' },
  { n: '03', title: '다듬고 내보내기', body: '문구와 이미지를 고친 뒤 MP4로 만듭니다.' },
]

const SAMPLE_BLOCKS = [
  { role: 'bg-hook', w: 14 },
  { role: 'bg-body', w: 24 },
  { role: 'bg-body', w: 24 },
  { role: 'bg-body', w: 22 },
  { role: 'bg-cta', w: 16 },
]

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl },
    { key: 'text', label: '본문 붙여넣기', id: f.ids.tabText },
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

  return (
    <div className="min-h-dvh">
      <Header steps={inputSteps()} />
      <main className="mx-auto grid max-w-[1200px] gap-12 px-5 pb-28 pt-9 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <section aria-labelledby="night-title" className="flex min-w-0 flex-col gap-9">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <Eyebrow step={1}>소스</Eyebrow>
            <h1 id="night-title" className="m-0 text-[34px] font-bold leading-[1.18] tracking-[-0.02em] sm:text-[46px]">
              글 한 편을 올려 주세요.
              <br />
              <span className="text-muted">장면으로 나눠 편집실에 펼쳐 드립니다.</span>
            </h1>
            <p className="m-0 max-w-[34rem] text-[15px] leading-relaxed text-muted">
              네이버 블로그 글 주소나 본문을 넣으면 30~60초 세로 영상의 초안이 나옵니다. 장면별 문구와 이미지는 편집실에서 직접 고칩니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-card border border-edge bg-panel">
            <div
              role="tablist"
              aria-label="소스 형식"
              onKeyDown={onTabKey}
              className="flex border-b border-edge bg-panel-2"
            >
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
                    '-mb-px min-h-12 flex-1 border-b-2 px-5 text-sm font-semibold transition-colors sm:flex-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                    f.tab === t.key ? 'border-accent bg-panel text-ink' : 'border-transparent text-muted hover:text-ink',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form
              id={f.ids.panel}
              role="tabpanel"
              aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText}
              onSubmit={f.submit}
              noValidate
              className="flex flex-col gap-3 p-5"
            >
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="text-[13px] font-medium text-muted">
                    네이버 블로그 글 주소
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
                      className={cx(field, 'min-h-12 flex-1')}
                    />
                    <Submit pending={f.pending} disabled={!f.canSubmit} />
                  </div>
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[13px]', f.urlError ? 'text-danger-ink' : 'text-muted')}>
                    {f.urlError ?? 'm.blog.naver.com 주소도 됩니다. 다른 블로그의 글은 본문 붙여넣기로 가져오세요.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="text-[13px] font-medium text-muted">
                    글 본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={8}
                    placeholder="글 본문을 붙여 넣어 주세요. 문단은 빈 줄로 나누면 읽기 쉽습니다."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className={cx(field, 'resize-y py-3 leading-relaxed')}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="h-1 overflow-hidden rounded-full bg-edge" aria-hidden="true">
                        <div className={cx('h-full rounded-full transition-[width] duration-200', f.textTooShort ? 'bg-danger' : 'bg-accent')} style={{ width: `${pct}%` }} />
                      </div>
                      <p id={f.ids.textHint} className={cx('m-0 text-[13px]', f.textTooShort ? 'text-danger-ink' : 'text-muted')}>
                        <Mono>{f.chars.toLocaleString()}</Mono>자
                        {f.textTooShort ? ` · 본문이 너무 짧습니다(최소 ${f.minChars}자)` : ` · 최소 ${f.minChars}자`}
                        <span className="max-sm:hidden"> · Ctrl+Enter로 시작</span>
                      </p>
                    </div>
                    <Submit pending={f.pending} disabled={!f.canSubmit} />
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

          <ol className="m-0 grid list-none gap-0 p-0 sm:grid-cols-3" aria-label="작업 순서">
            {FLOW.map((s, i) => (
              <li key={s.n} className={cx('relative flex flex-col gap-1.5 border-l border-edge pb-1 pl-4', i > 0 && 'max-sm:mt-5')}>
                <span aria-hidden="true" className="absolute -left-[3px] top-1 size-[5px] rounded-full bg-accent" />
                <Mono className="text-[11px] text-muted">{s.n}</Mono>
                <p className="m-0 text-[15px] font-semibold">{s.title}</p>
                <p className="m-0 text-[13px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="결과 예시" className="mx-auto flex w-full max-w-[300px] flex-col gap-4 lg:mx-0 lg:max-w-none">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>샘플 미리보기</span>
            <span className="font-mono tabular-nums">
              {VIDEO_WIDTH}×{VIDEO_HEIGHT} · 9:16
            </span>
          </div>
          <div className={cx('overflow-hidden bg-black p-1.5', monitorClass())}>
            <Stage className="rounded-[3px]">
              <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
            </Stage>
          </div>
          <div aria-hidden="true" className="flex h-9 gap-1">
            {SAMPLE_BLOCKS.map((b, i) => (
              <div key={i} className="flex flex-col justify-end overflow-hidden rounded-[3px] border border-edge bg-panel-2" style={{ width: `${b.w}%` }}>
                <div className={cx('h-1.5', b.role)} />
              </div>
            ))}
          </div>
          <p className="m-0 text-[13px] leading-relaxed text-muted">대본이 나오면 이렇게 장면이 타임라인으로 이어집니다. 위 화면은 예시입니다.</p>
        </aside>
      </main>
    </div>
  )
}

function Submit({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <button type="submit" data-act="submit" disabled={disabled} className={cx(btn.primary, 'min-h-12 shrink-0 px-6')}>
      {pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {pending ? '여는 중…' : '편집실 열기'}
      {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )
}
