import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Page } from './Shell'
import { btn, field } from './styles'
import { Alert, Pane } from './ui'

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
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'w-full')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '영상 만들기'}
    </button>
  )

  return (
    <Page steps={inputSteps()}>
      <main className="mx-auto flex max-w-[56rem] flex-col gap-4 px-4 pt-2">
        {f.backendDown && (
          <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
            백엔드를 실행한 뒤 새로고침하세요.
          </Alert>
        )}

        <Pane label="새 영상 시작">
          <div className="absolute inset-0 opacity-50">
            <SceneFrame src="/mock/sample-preview.svg" subtitle="" motion="zoom_in" animate />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/90" />

          <div className="absolute inset-x-0 top-0 p-5">
            <p className="m-0 text-[12px] font-bold text-accent">샘플 미리보기 · 1080×1920</p>
            <h1 className="m-0 mt-2 text-[28px] font-black leading-[1.2] text-white">
              블로그 글을
              <br />
              세로 영상으로.
            </h1>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex max-h-[78%] flex-col gap-3 overflow-y-auto p-4">
            <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex gap-1.5 self-start rounded-full bg-black/60 p-1">
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
                  className={cx('min-h-11 rounded-full px-4 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', f.tab === t.key ? 'bg-white text-black' : 'text-white/80 hover:text-white')}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-2.5">
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="sr-only">
                    글 주소
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
                    className={cx(field, 'min-h-12 text-[15px]')}
                  />
                  <p id={f.ids.urlHint} className={cx('m-0 text-[12px] leading-snug', f.urlError ? 'font-bold text-danger-ink' : 'text-white/80')}>
                    {f.urlError ?? '모바일 주소(m.blog.naver.com)도 쓸 수 있습니다.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="sr-only">
                    본문
                  </label>
                  <textarea
                    id={f.ids.text}
                    rows={5}
                    placeholder="본문을 붙여 넣으세요."
                    value={f.text}
                    onChange={(e) => f.setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                    }}
                    aria-invalid={f.textTooShort ? true : undefined}
                    aria-describedby={f.ids.textHint}
                    className={cx(field, 'resize-none py-3 text-[14px] leading-[1.6]')}
                  />
                  <p id={f.ids.textHint} className={cx('m-0 text-[12px] tabular-nums', f.textTooShort ? 'font-bold text-danger-ink' : 'text-white/80')}>
                    {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 본문이 너무 짧습니다'}
                  </p>
                </>
              )}
              {submit}
            </form>
          </div>
        </Pane>

        {error && (
          <div className="st-stage mx-auto">
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
          </div>
        )}
      </main>
    </Page>
  )
}
