import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { VIDEO_HEIGHT, VIDEO_WIDTH } from '../../lib/render'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Masthead } from './Shell'
import { btn, field } from './styles'
import { Kicker, Notice, Plate } from './ui'

const FLOW = [
  { n: '1', head: '읽기', body: '글의 문단과 사진을 원문 순서 그대로 읽어 둡니다.' },
  { n: '2', head: '나누기', body: 'Hook, 본문, CTA로 나눠 4~6장면의 대본을 씁니다.' },
  { n: '3', head: '다듬기', body: '장면마다 문구와 사진을 고친 뒤 MP4로 찍어 냅니다.' },
]

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '주소로 투고', id: f.ids.tabUrl },
    { key: 'text', label: '본문으로 투고', id: f.ids.tabText },
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
      <Masthead steps={inputSteps()} />
      <main className="mx-auto grid max-w-[1180px] gap-x-14 gap-y-12 px-5 pb-24 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="press-title" className="flex min-w-0 flex-col gap-8">
          {f.backendDown && (
            <Notice icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Notice>
          )}

          <div className="flex flex-col gap-5">
            <Kicker>새 원고</Kicker>
            <h1 id="press-title" className="m-0 font-serif text-[42px] font-black leading-[1.1] tracking-[-0.04em] sm:text-[68px]">
              한 편의 글이,
              <br />
              한 편의 영상으로.
            </h1>
            <p className="m-0 max-w-[36rem] font-serif text-[18px] leading-[1.85] text-ink">
              네이버 블로그 글의 주소나 본문을 건네 주세요. 30초에서 60초짜리 세로 영상의 초안을 조판해 드립니다. 장면의 문구와 사진은 그 뒤에 직접 고칩니다.
            </p>
          </div>

          <div className="border-t-2 border-ink pt-6">
            <div role="tablist" aria-label="투고 방식" onKeyDown={onTabKey} className="mb-6 flex items-center gap-4 font-sans">
              {tabs.map((t, i) => (
                <div key={t.key} className="flex items-center gap-4">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-muted">
                      /
                    </span>
                  )}
                  <button
                    id={t.id}
                    type="button"
                    role="tab"
                    aria-selected={f.tab === t.key}
                    aria-controls={f.ids.panel}
                    tabIndex={f.tab === t.key ? 0 : -1}
                    onClick={() => f.setTab(t.key)}
                    className={cx(
                      'min-h-11 text-[15px] underline-offset-[7px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                      f.tab === t.key ? 'font-bold underline decoration-[3px]' : 'text-muted hover:text-ink hover:underline hover:decoration-1',
                    )}
                  >
                    {t.label}
                  </button>
                </div>
              ))}
            </div>

            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3">
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="font-sans text-[13px] font-bold">
                    네이버 블로그 글 주소
                  </label>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
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
                      className={cx(field, 'min-h-12 flex-1 text-[22px] sm:text-[26px]')}
                    />
                    <Submit pending={f.pending} disabled={!f.canSubmit} />
                  </div>
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-5 font-sans text-[13px]', f.urlError ? 'font-bold' : 'text-muted')}>
                    {f.urlError ? `▲ ${f.urlError}` : 'm.blog.naver.com 주소도 받습니다. 다른 블로그의 글은 본문으로 투고해 주세요.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="font-sans text-[13px] font-bold">
                    글 본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={8}
                    placeholder="글 본문을 붙여 넣어 주세요. 문단은 빈 줄로 나누면 좋습니다."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className="w-full resize-y border-y-2 border-ink bg-transparent px-1 font-serif text-[17px] leading-8 text-ink placeholder:text-placeholder focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                    style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 31px, #c9c8c2 31px 32px)', backgroundAttachment: 'local' }}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="h-[3px] bg-line" aria-hidden="true">
                        <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${pct}%` }} />
                      </div>
                      <p id={f.ids.textHint} className={cx('m-0 font-sans text-[13px]', f.textTooShort ? 'font-bold' : 'text-muted')}>
                        <span className="tabular-nums">{f.chars.toLocaleString()}</span>자{f.textTooShort ? ` · ▲ 본문이 너무 짧습니다(최소 ${f.minChars}자)` : ` · 최소 ${f.minChars}자`}
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
            <Notice
              icon={error.kind === 'input' ? undefined : ServerOff}
              title={error.kind === 'network' ? '서버에 연결하지 못했습니다' : error.kind === 'server' ? '서버에서 오류가 났습니다' : '입력을 확인해 주세요'}
              actions={
                error.canRetry ? (
                  <button type="button" className={btn.onInk} onClick={() => f.submit()}>
                    <RotateCcw aria-hidden="true" className="size-4" />
                    다시 시도
                  </button>
                ) : undefined
              }
            >
              {error.message}
            </Notice>
          )}

          <ol className="m-0 grid list-none border-t-2 border-ink p-0 sm:grid-cols-3" aria-label="작업 순서">
            {FLOW.map((s, i) => (
              <li key={s.n} className={cx('flex flex-col gap-2 py-5 sm:px-5', i === 0 ? 'sm:pl-0' : 'border-t border-line sm:border-l sm:border-t-0', i === 2 && 'sm:pr-0')}>
                <Kicker>
                  {s.n} · {s.head}
                </Kicker>
                <p className="m-0 font-serif text-[15px] leading-[1.75]">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[300px] lg:mx-0 lg:pt-3">
          <Plate caption={`도판 1 · 샘플 미리보기. ${VIDEO_WIDTH}×${VIDEO_HEIGHT}, 9:16 세로 영상. 지면에서는 흑백이지만 실제 영상은 글 속 사진의 색 그대로 나옵니다.`}>
            <div className="grayscale">
              <Stage>
                <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
              </Stage>
            </div>
          </Plate>
        </aside>
      </main>
    </div>
  )
}

function Submit({ pending, disabled }: { pending: boolean; disabled: boolean }) {
  return (
    <button type="submit" data-act="submit" disabled={disabled} className={cx(btn.primary, 'min-h-12 shrink-0 px-7 text-base')}>
      {pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {pending ? '보내는 중…' : '조판 시작'}
      {!pending && <ArrowRight aria-hidden="true" className="size-4" />}
    </button>
  )
}
