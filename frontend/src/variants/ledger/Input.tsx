import { ArrowRight, FileText, Link2, Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { Stage } from '../shared/Stage'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Header } from './Shell'
import { btn, field } from './styles'
import { Note, Question } from './ui'

const AHEAD = ['글을 읽어요', '장면으로 나눠요', '함께 다듬어요', '영상으로 만들어요']

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; sub: string; id: string; icon: typeof Link2 }[] = [
    { key: 'url', label: '블로그 주소로 시작해요', sub: '네이버 블로그 글 주소만 있으면 돼요', id: f.ids.tabUrl, icon: Link2 },
    { key: 'text', label: '글을 붙여 넣어서 시작해요', sub: '다른 곳에 쓴 글도 괜찮아요', id: f.ids.tabText, icon: FileText },
  ]

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const next: InputTab = f.tab === 'url' ? 'text' : 'url'
    f.setTab(next)
    document.getElementById(next === 'url' ? f.ids.tabUrl : f.ids.tabText)?.focus()
  }

  const error = f.error
  const pct = Math.min(100, Math.round((f.chars / f.minChars) * 100))

  return (
    <div className="min-h-dvh pb-24">
      <Header steps={inputSteps()} />
      <main className="mx-auto flex max-w-[760px] flex-col gap-12 px-6 pb-16 pt-12 sm:pt-16">
        {f.backendDown && (
          <Note icon={ServerOff} title="백엔드 서버가 꺼져 있어요">
            백엔드를 실행한 뒤 새로고침해 주세요.
          </Note>
        )}

        <Question hint="글 한 편이면 충분해요. 30~60초 길이의 세로 영상 초안을 만들어 드릴게요.">어떤 글로 영상을 만들어 볼까요?</Question>

        <div role="tablist" aria-label="글을 가져오는 방법" onKeyDown={onTabKey} className="grid gap-3 sm:grid-cols-2">
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
                'flex min-h-[5.5rem] items-start gap-4 rounded-[18px] border-2 p-5 text-left transition-colors duration-150',
                'focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                f.tab === t.key ? 'border-accent bg-accent-soft' : 'border-edge bg-surface hover:border-ink',
              )}
            >
              <t.icon aria-hidden="true" className={cx('mt-1 size-6 shrink-0', f.tab === t.key ? 'text-accent' : 'text-muted')} />
              <span>
                <span className="block text-[19px] font-bold leading-snug">{t.label}</span>
                <span className="block text-[15px] leading-snug text-muted">{t.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-4">
          {f.tab === 'url' ? (
            <>
              <label htmlFor={f.ids.url} className="text-[22px] font-bold leading-snug">
                글 주소를 알려 주세요
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
                className={cx(field, 'min-h-16')}
              />
              <p id={f.ids.urlHint} className={cx('m-0 min-h-7 text-[16px]', f.urlError ? 'font-semibold text-danger-ink' : 'text-muted')}>
                {f.urlError ?? '모바일 주소(m.blog.naver.com)도 괜찮아요.'}
              </p>
            </>
          ) : (
            <>
              <label htmlFor={f.ids.text} className="text-[22px] font-bold leading-snug">
                글을 붙여 넣어 주세요
              </label>
              <textarea
                id={f.ids.text}
                rows={8}
                placeholder="여기에 글 본문을 붙여 넣어 주세요. 문단은 빈 줄로 나누면 더 잘 읽혀요."
                value={f.text}
                onChange={(e) => f.setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) f.submit()
                }}
                aria-invalid={f.textTooShort ? true : undefined}
                aria-describedby={f.ids.textHint}
                className={cx(field, 'resize-y py-4 text-[18px] leading-[1.8]')}
              />
              <div className="flex flex-col gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className={cx('h-full rounded-full transition-[width] duration-200', f.textTooShort ? 'bg-danger' : 'bg-accent')} style={{ width: `${pct}%` }} />
                </div>
                <p id={f.ids.textHint} className={cx('m-0 text-[16px]', f.textTooShort ? 'font-semibold text-danger-ink' : 'text-muted')}>
                  {f.chars.toLocaleString()}자 {f.textTooShort ? `· 조금만 더 써 주세요. 최소 ${f.minChars}자가 필요해요.` : `· 최소 ${f.minChars}자가 필요해요.`}
                </p>
              </div>
            </>
          )}

          <div className="pt-2">
            <button type="submit" data-act="submit" disabled={!f.canSubmit} className={cx(btn.primary, 'w-full sm:w-auto')}>
              {f.pending && <Loader2 aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
              {f.pending ? '보내고 있어요…' : '이 글로 시작하기'}
              {!f.pending && <ArrowRight aria-hidden="true" className="size-5" />}
            </button>
          </div>
        </form>

        {error && (
          <Note
            icon={error.kind === 'input' ? undefined : ServerOff}
            title={error.kind === 'network' ? '서버에 연결하지 못했어요' : error.kind === 'server' ? '서버에서 문제가 생겼어요' : '입력한 내용을 확인해 주세요'}
            actions={
              error.canRetry ? (
                <button type="button" className={btn.secondary} onClick={() => f.submit()}>
                  <RotateCcw aria-hidden="true" className="size-5" />
                  다시 시도하기
                </button>
              ) : undefined
            }
          >
            {error.message}
          </Note>
        )}

        <section aria-label="앞으로의 순서" className="grid items-center gap-8 border-t-2 border-line pt-10 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <p className="m-0 text-[20px] font-bold">시작하면 이렇게 진행돼요</p>
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0 text-[18px] text-muted">
              {AHEAD.map((t, i) => (
                <li key={t} className="flex items-center gap-3.5">
                  <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-panel-2 text-[15px] font-bold text-ink">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <figure className="m-0 flex flex-col items-start gap-2 sm:items-center">
            <div className="w-[132px] overflow-hidden rounded-[14px] border-2 border-edge">
              <Stage>
                <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
              </Stage>
            </div>
            <figcaption className="text-[14px] text-muted">샘플 미리보기</figcaption>
          </figure>
        </section>
      </main>
    </div>
  )
}
