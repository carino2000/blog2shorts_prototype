import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Desk } from './Shell'
import { btn, field } from './styles'
import { Alert, Screen, Win } from './ui'

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
  const filled = Math.round((Math.min(100, (f.chars / f.minChars) * 100) / 100) * 20)
  const submit = (
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-12 shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />}
      {f.pending ? '보내는 중' : '영상 만들기'}
    </button>
  )

  return (
    <Desk steps={inputSteps()}>
      <main className="mx-auto grid max-w-[1180px] items-start gap-5 px-3 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <Win title="새 작업.exe" bodyClassName="flex flex-col gap-5">
            <div>
              <h1 className="m-0 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.2]">블로그 글을 넣으면 짧은 영상이 나옵니다.</h1>
              <p className="m-0 mt-2 max-w-xl text-[15px] leading-[1.75] text-muted">네이버 블로그 글을 넣으면 30~60초 세로 영상 초안이 만들어집니다. 문구와 이미지는 영상으로 만들기 전에 고칠 수 있습니다.</p>
            </div>

            <div>
              <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex gap-1">
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
                    className={cx('dk-key relative min-h-11 px-4 text-[14px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', f.tab === t.key ? 'z-10 -mb-px border-b-surface bg-surface font-bold' : 'bg-panel-2 text-muted hover:text-ink')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="dk-key flex flex-col gap-3 p-4">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url} className="text-[14px] font-bold">
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
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[13px]', f.urlError ? 'font-bold text-danger-ink' : 'text-muted')}>
                      {f.urlError ?? '모바일 주소(m.blog.naver.com)도 쓸 수 있습니다.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text} className="text-[14px] font-bold">
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
                        <div className="dk-sunk flex h-5 gap-0.5 p-0.5" aria-hidden="true">
                          {Array.from({ length: 20 }, (_, i) => (
                            <i key={i} className={cx('h-full flex-1', i < filled ? 'bg-accent' : 'bg-transparent')} />
                          ))}
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 font-mono text-[12px]', f.textTooShort ? 'font-bold text-danger-ink' : 'text-muted')}>
                          {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 본문이 너무 짧습니다'}
                        </p>
                      </div>
                      {submit}
                    </div>
                  </>
                )}
              </form>
            </div>
          </Win>

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

          <Win title="진행 순서.txt">
            <ol className="m-0 grid list-none gap-3 p-0 text-[14px] leading-[1.6] sm:grid-cols-3">
              <li>
                <b className="font-mono">1.</b> 글 읽기 — 문단과 사진을 순서대로 읽습니다.
              </li>
              <li>
                <b className="font-mono">2.</b> 대본·장면 — Hook 1 · 본문 · CTA 1로 나눕니다.
              </li>
              <li>
                <b className="font-mono">3.</b> 영상 — 음성·자막을 입혀 MP4로 만듭니다.
              </li>
            </ol>
          </Win>
        </div>

        <Win title="미리보기" className="mx-auto w-full max-w-[17rem] lg:mx-0" bodyClassName="flex flex-col gap-3 !p-3">
          <Screen>
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Screen>
          <p className="m-0 font-mono text-[12px] text-muted">샘플 미리보기 · 1080×1920</p>
        </Win>
      </main>
    </Desk>
  )
}
