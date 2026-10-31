import { CornerDownLeft, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Body, Frame, Topbar } from './Shell'
import { btn, field } from './styles'
import { Alert, Kbd, Mono, Panel } from './ui'

const PIPELINE: [string, string, string][] = [
  ['01', '추출', '문단과 사진을 원문 순서대로 읽음'],
  ['02', '대본', 'Hook 1 · 본문 2~4 · CTA 1, 장면 4~6개'],
  ['03', '편집', '장면별 문구·사진·카메라 움직임 수정'],
  ['04', '렌더', '음성 → 자막 → 합성, 1080×1920 MP4'],
]

const LIMITS: [string, string][] = [
  ['주소', 'blog.naver.com · m.blog.naver.com 글 주소'],
  ['본문', '200자 이상'],
  ['영상 길이', '30~60초 권장'],
  ['업로드 사진', 'jpg · png · webp, 10MB 이하'],
]

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
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-11 shrink-0')}>
      {f.pending ? <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : null}
      {f.pending ? '실행 중…' : '작업 시작'}
      {!f.pending && <CornerDownLeft aria-hidden="true" className="size-3.5 opacity-80" />}
    </button>
  )

  return (
    <Frame steps={inputSteps()}>
      <Topbar crumbs={['작업', '새 작업']} />
      <Body className="gap-5 pt-8 sm:pt-12">
        {f.backendDown && (
          <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
            백엔드를 실행한 뒤 새로고침하세요.
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[24px] font-bold tracking-[-0.01em]">새 작업</h1>
          <p className="m-0 max-w-xl text-[14px] leading-relaxed text-muted">블로그 글을 입력하면 장면으로 나눈 세로 영상 초안을 만듭니다. 입력 후에는 장면 표에서 문구·사진·움직임을 고칩니다.</p>
        </div>

        <Panel>
          <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex items-center gap-1 border-b border-line px-2 pt-1.5">
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
                  '-mb-px min-h-11 border-b-2 px-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
                  f.tab === t.key ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-2.5 p-4">
            {f.tab === 'url' ? (
              <>
                <label htmlFor={f.ids.url} className="cmd-th">
                  네이버 블로그 글 주소
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[14px] text-accent">
                      ›
                    </span>
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
                      className={cx(field, 'min-h-11 pl-7')}
                    />
                  </div>
                  {submit}
                </div>
                <p id={f.ids.urlHint} className={cx('m-0 min-h-4 text-[12px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                  {f.urlError ?? 'Enter로 시작합니다. 다른 블로그의 글은 본문 탭에 붙여 넣으세요.'}
                </p>
              </>
            ) : (
              <>
                <label htmlFor={f.ids.text} className="cmd-th">
                  글 본문
                </label>
                <textarea
                  id={f.ids.text}
                  rows={9}
                  placeholder="본문을 붙여 넣으세요. 문단은 빈 줄로 나눕니다."
                  value={f.text}
                  onChange={(e) => f.setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                  }}
                  aria-invalid={f.textTooShort ? true : undefined}
                  aria-describedby={f.ids.textHint}
                  className={cx(field, 'resize-y py-2.5 font-mono text-[13px] leading-relaxed')}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p id={f.ids.textHint} className={cx('m-0 text-[12px]', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                    <Mono>{f.chars.toLocaleString()}</Mono>자 / 최소 <Mono>{f.minChars}</Mono>자{f.textTooShort && ' · 본문이 너무 짧습니다'}
                    <span className="max-sm:hidden">
                      {' · '}
                      <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd> 시작
                    </span>
                  </p>
                  {submit}
                </div>
              </>
            )}
          </form>
        </Panel>

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

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel title="처리 순서">
            <ol className="m-0 list-none p-0">
              {PIPELINE.map(([n, name, desc]) => (
                <li key={n} className="grid grid-cols-[2.25rem_3.25rem_1fr] items-baseline gap-x-2 border-b border-line px-3.5 py-2.5 text-[13px] last:border-b-0">
                  <Mono className="text-[11px] text-muted">{n}</Mono>
                  <b>{name}</b>
                  <span className="text-muted">{desc}</span>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="입력 기준">
            <dl className="m-0">
              {LIMITS.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-x-2 border-b border-line px-3.5 py-2.5 text-[13px] last:border-b-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="m-0">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </Body>
    </Frame>
  )
}
