import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Term } from './Shell'
import { btn, field } from './styles'
import { Alert, Block, Out, Screen } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; flag: string; id: string }[] = [
    { key: 'url', label: '블로그 주소', flag: 'url', id: f.ids.tabUrl },
    { key: 'text', label: '글 붙여넣기', flag: 'text', id: f.ids.tabText },
  ]

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const next: InputTab = f.tab === 'url' ? 'text' : 'url'
    f.setTab(next)
    document.getElementById(next === 'url' ? f.ids.tabUrl : f.ids.tabText)?.focus()
  }

  const error = f.error
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-12 shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? 'running…' : '실행 (영상 만들기)'}
    </button>
  )

  return (
    <Term steps={inputSteps()}>
      <main className="mx-auto grid max-w-[68rem] gap-x-10 gap-y-8 px-4 pb-10 pt-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section aria-labelledby="tm-title" className="flex min-w-0 flex-col gap-8">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <Block cmd="b2s --about">
            <Out>
              <h1 id="tm-title" className="m-0 text-[clamp(1.5rem,3.6vw,2.25rem)] font-bold leading-[1.3] text-ink">
                블로그 글 → 세로 영상
              </h1>
              <p className="m-0 mt-2 max-w-xl">네이버 블로그 글을 넣으면 30~60초 세로 영상 초안(1080×1920)을 만듭니다. 장면 문구와 이미지는 렌더 전에 직접 고칩니다.</p>
            </Out>
          </Block>

          <Block cmd="b2s new --source ?" label="입력 방식">
            <Out>
              <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex flex-wrap gap-2">
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
                      className={cx('inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-accent bg-accent-soft text-accent' : 'border-edge text-muted hover:text-ink')}
                    >
                      <span aria-hidden="true">{on ? '(•)' : '( )'}</span>
                      --{t.flag}
                      <span className="font-sans text-[13px] font-medium">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </Out>
          </Block>

          <Block cmd={`b2s new --${f.tab}`}>
            <Out>
              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="text-[13px] font-bold text-hi">
                      url&gt;
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
                        className={cx(field, 'min-h-12 flex-1 text-[15px]')}
                      />
                      {submit}
                    </div>
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[13px]', f.urlError ? 'font-bold text-danger-ink' : 'text-muted')}>
                      {f.urlError ?? '# 모바일 주소(m.blog.naver.com)도 쓸 수 있습니다.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="text-[13px] font-bold text-hi">
                      text&gt;
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
                      className={cx(field, 'resize-y py-2 text-[14px] leading-[1.7]')}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p id={f.ids.textHint} className={cx('m-0 text-[13px] tabular-nums', f.textTooShort ? 'font-bold text-danger-ink' : 'text-muted')}>
                        {f.chars.toLocaleString()} / {f.minChars} chars{f.textTooShort && ' · 본문이 너무 짧습니다'}
                      </p>
                      {submit}
                    </div>
                  </>
                )}
              </form>
            </Out>
          </Block>

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

          <Block cmd="b2s steps">
            <Out>
              <ol className="m-0 list-none p-0 text-[13px]">
                <li>1. read &nbsp;— 문단과 사진을 순서대로 읽는다</li>
                <li>2. script — Hook 1 · 본문 · CTA 1로 나눈다</li>
                <li>3. render — 음성·자막을 입혀 MP4로 만든다</li>
              </ol>
            </Out>
          </Block>
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[15rem] lg:mx-0">
          <p className="m-0 mb-2 text-[12px] text-muted">$ b2s sample --preview</p>
          <Screen>
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Screen>
          <p className="m-0 mt-2 text-[12px] text-muted">샘플 미리보기 · 1080×1920</p>
        </aside>
      </main>
    </Term>
  )
}
