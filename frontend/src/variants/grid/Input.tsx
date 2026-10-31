import { ArrowRight, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Masthead, Page } from './Shell'
import { btn, field } from './styles'
import { Alert, Cap, Head, Num } from './ui'

const FLOW: [string, string, string][] = [
  ['01', '추출', '문단과 사진을 원문 순서대로 읽는다.'],
  ['02', '대본', 'Hook, 본문, CTA로 나눠 장면 4–6개를 쓴다.'],
  ['03', '편집', '장면별 문구, 사진, 카메라 움직임을 고친다.'],
  ['04', '출력', '음성과 자막을 입혀 1080×1920 MP4로 낸다.'],
]

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; n: string; label: string; id: string }[] = [
    { key: 'url', n: '01', label: '주소', id: f.ids.tabUrl },
    { key: 'text', n: '02', label: '본문', id: f.ids.tabText },
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
    <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'min-h-14 shrink-0 px-6 text-[17px]')}>
      {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
      <span>{f.pending ? '보내는 중' : '시작'}</span>
      {!f.pending && <ArrowRight aria-hidden="true" className="size-5" />}
    </button>
  )

  return (
    <div className="min-h-dvh">
      <Masthead steps={inputSteps()} />
      <Page>
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 flex items-start gap-8 md:col-span-3 md:flex-col md:gap-10">
            <Num n={1} className="text-[clamp(5.5rem,13vw,10rem)] text-accent" />
            <figure aria-label="결과 예시" className="m-0 hidden w-full max-w-[200px] flex-col gap-2 md:flex">
              <div className="border-2 border-ink">
                <Stage>
                  <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
                </Stage>
              </div>
              <figcaption className="m-0 text-[12px] font-bold leading-snug">
                Fig. 1 샘플 미리보기
                <br />
                <span className="font-medium text-muted">1080×1920, 9:16</span>
              </figcaption>
            </figure>
          </div>

          <section aria-labelledby="grid-title" className="col-span-12 flex min-w-0 flex-col gap-10 md:col-span-9 lg:col-span-8">
            {f.backendDown && (
              <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
                백엔드를 실행한 뒤 새로고침하세요.
              </Alert>
            )}

            <div className="flex flex-col gap-6">
              <Head id="grid-title">
                블로그 글을
                <br />
                영상으로 옮긴다.
              </Head>
              <p className="m-0 max-w-[30rem] text-[18px] leading-[1.7]">네이버 블로그 글의 주소나 본문을 입력한다. 30–60초 세로 영상의 초안이 장면 단위로 나온다. 문구와 사진은 이후에 직접 고친다.</p>
            </div>

            <div>
              <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="grid grid-cols-2 border-t-4 border-ink">
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
                      'flex min-h-14 items-baseline gap-3 border-b border-ink px-0 py-3 text-left text-[18px] font-black focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent',
                      f.tab === t.key ? 'text-accent' : 'text-ink hover:text-accent',
                    )}
                  >
                    <span className="text-[13px] tabular-nums">{t.n}</span>
                    {t.label}
                  </button>
                ))}
              </div>
              <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3 pt-6">
                {f.tab === 'url' ? (
                  <>
                    <label htmlFor={f.ids.url}>
                      <Cap>네이버 블로그 글 주소</Cap>
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
                        className={cx(field, 'min-h-14 flex-1')}
                      />
                      {submit}
                    </div>
                    <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[14px]', f.urlError ? 'font-bold text-accent' : 'text-muted')}>
                      {f.urlError ?? 'm.blog.naver.com 주소도 받는다. 다른 블로그의 글은 본문으로 입력한다.'}
                    </p>
                  </>
                ) : (
                  <>
                    <label htmlFor={f.ids.text}>
                      <Cap>글 본문</Cap>
                    </label>
                    <textarea
                      id={f.ids.text}
                      rows={8}
                      placeholder="본문을 붙여 넣는다."
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
                        <div className="h-[6px] bg-line" aria-hidden="true">
                          <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
                        </div>
                        <p id={f.ids.textHint} className={cx('m-0 text-[14px] tabular-nums', f.textTooShort ? 'font-bold text-accent' : 'text-muted')}>
                          {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' — 너무 짧다'}
                        </p>
                      </div>
                      {submit}
                    </div>
                  </>
                )}
              </form>
            </div>

            {error && (
              <Alert
                icon={error.kind === 'input' ? undefined : ServerOff}
                title={error.kind === 'network' ? '서버에 연결하지 못했습니다' : error.kind === 'server' ? '서버에서 오류가 났습니다' : '입력을 확인하세요'}
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

            <ol className="m-0 list-none border-t-4 border-ink p-0" aria-label="처리 순서">
              {FLOW.map(([n, name, desc]) => (
                <li key={n} className="grid grid-cols-[3rem_4.5rem_1fr] items-baseline gap-x-4 border-b border-ink py-3 text-[16px]">
                  <span className="text-[14px] font-black tabular-nums text-accent">{n}</span>
                  <b>{name}</b>
                  <span className="text-muted">{desc}</span>
                </li>
              ))}
            </ol>

            <figure aria-label="결과 예시" className="m-0 flex w-[140px] flex-col gap-2 md:hidden">
              <div className="border-2 border-ink">
                <Stage>
                  <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
                </Stage>
              </div>
              <figcaption className="m-0 text-[12px] font-bold">Fig. 1 샘플 미리보기</figcaption>
            </figure>
          </section>
        </div>
      </Page>
    </div>
  )
}
