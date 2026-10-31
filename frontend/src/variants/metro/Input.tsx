import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Station } from './Shell'
import { btn, field } from './styles'
import { Alert, LineBadge, Screen, Sign } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string; n: number }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl, n: 1 },
    { key: 'text', label: '글 붙여넣기', id: f.ids.tabText, n: 2 },
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
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'shrink-0')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      {f.pending ? '출발 준비 중' : '영상 만들기 출발'}
    </button>
  )

  return (
    <Station steps={inputSteps()}>
      <main className="mx-auto grid max-w-[64rem] gap-x-10 gap-y-8 px-4 pb-10 pt-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <section aria-labelledby="mt-title" className="flex min-w-0 flex-col gap-6">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <Sign className="flex flex-col gap-3">
            <p className="m-0 flex items-center gap-3 text-[14px] font-bold text-white/85">
              <LineBadge n={1} className="bg-white text-[#0d2240]" />
              승차 안내 · 1번 승강장
            </p>
            <h1 id="mt-title" className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.15]">
              블로그 글에서
              <br />
              세로 영상역까지
            </h1>
            <p className="m-0 max-w-lg text-[15px] leading-[1.75] text-white/90">네이버 블로그 글을 태우면 4개 역을 지나 30~60초 세로 영상(1080×1920)이 도착합니다. 가는 길에 장면 문구와 이미지를 직접 고칠 수 있습니다.</p>
          </Sign>

          <div>
            <div role="tablist" aria-label="승강장 선택" onKeyDown={onTabKey} className="grid grid-cols-2 gap-3">
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
                    className={cx('flex min-h-14 items-center gap-3 rounded-t-card border-[3px] border-b-0 px-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent', on ? 'border-ink bg-accent-soft' : 'border-line bg-panel text-muted hover:text-ink')}
                  >
                    <LineBadge n={t.n} className={cx(!on && 'bg-muted')} />
                    <span className="text-[15px] font-extrabold">{t.label}</span>
                  </button>
                )
              })}
            </div>
            <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3 rounded-b-card border-[3px] border-ink bg-accent-soft p-5">
              {f.tab === 'url' ? (
                <>
                  <label htmlFor={f.ids.url} className="text-[15px] font-extrabold">
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
                      className={cx(field, 'min-h-14 flex-1 text-[17px]')}
                    />
                    {submit}
                  </div>
                  <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[14px]', f.urlError ? 'font-extrabold text-danger-ink' : 'text-muted')}>
                    {f.urlError ?? '모바일 주소(m.blog.naver.com)도 탈 수 있습니다.'}
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor={f.ids.text} className="text-[15px] font-extrabold">
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
                    className={cx(field, 'resize-y py-3 text-[16px] leading-[1.7]')}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p id={f.ids.textHint} className={cx('m-0 text-[14px] tabular-nums', f.textTooShort ? 'font-extrabold text-danger-ink' : 'text-muted')}>
                      {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 본문이 너무 짧습니다'}
                    </p>
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
        </section>

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[15rem] lg:mx-0">
          <p className="m-0 mb-2 text-[13px] font-extrabold text-muted">종착역 · 샘플 미리보기</p>
          <Screen>
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Screen>
          <p className="m-0 mt-2 text-[12px] text-muted">1080×1920 · MP4</p>
        </aside>
      </main>
    </Station>
  )
}
