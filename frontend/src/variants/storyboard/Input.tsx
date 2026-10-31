import { Loader2, RotateCcw, ServerOff } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { SceneFrame } from '../../components/SceneFrame'
import { cx } from '../../lib/ui'
import { useInputForm, type InputTab } from '../shared/useInputForm'
import { inputSteps } from '../shared/useProjectGate'
import { Paper } from './Shell'
import { btn, field } from './styles'
import { Alert, Cell, Frame, FormHead, Pencil } from './ui'

export function Input() {
  const f = useInputForm()
  const tabs: { key: InputTab; label: string; id: string }[] = [
    { key: 'url', label: '블로그 주소', id: f.ids.tabUrl },
    { key: 'text', label: '글 붙여넣기', id: f.ids.tabText },
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
      {f.pending ? '접수 중' : '콘티 의뢰하기'}
    </button>
  )

  return (
    <Paper steps={inputSteps()}>
      <FormHead title="영상 콘티 작성 의뢰서" no="B2S-01">
        <Cell label="분량">30~60초</Cell>
        <Cell label="화면 비율">세로 9:16 (1080×1920)</Cell>
        <Cell label="산출물">MP4 영상 1편</Cell>
      </FormHead>

      <div className="grid gap-x-8 gap-y-8 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <section aria-labelledby="sb-title" className="flex min-w-0 flex-col gap-6">
          {f.backendDown && (
            <Alert icon={ServerOff} title="백엔드 서버가 꺼져 있습니다">
              백엔드를 실행한 뒤 새로고침하세요.
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <h2 id="sb-title" className="m-0 text-[18px] font-extrabold">
              1. 원고 가져오기
            </h2>
            <p className="m-0 max-w-xl text-[14px] leading-[1.75] text-muted">네이버 블로그 글을 원고로 넣으면 장면별 콘티가 만들어집니다. 칸마다 대사와 카메라 움직임을 직접 고칠 수 있습니다.</p>
            <Pencil className="-rotate-1 text-[24px]">← 글 주소 하나면 시작!</Pencil>
          </div>

          <div role="tablist" aria-label="입력 방식" onKeyDown={onTabKey} className="flex flex-col gap-1">
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
                  className="flex min-h-11 items-center gap-3 text-left text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span aria-hidden="true" className="grid size-6 place-items-center border-2 border-ink bg-surface">
                    {on && <span className="sb-pencil text-[26px] leading-none">✓</span>}
                  </span>
                  {t.label}
                </button>
              )
            })}
          </div>

          <form id={f.ids.panel} role="tabpanel" aria-labelledby={f.tab === 'url' ? f.ids.tabUrl : f.ids.tabText} onSubmit={f.submit} noValidate className="flex flex-col gap-3 border-2 border-ink p-4">
            {f.tab === 'url' ? (
              <>
                <label htmlFor={f.ids.url} className="text-[13px] font-extrabold">
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
                    className={cx(field, 'min-h-12 flex-1 text-[16px]')}
                  />
                  {submit}
                </div>
                <p id={f.ids.urlHint} className={cx('m-0 min-h-5 text-[13px]', f.urlError ? 'font-bold text-danger-ink' : 'text-muted')}>
                  {f.urlError ?? '모바일 주소(m.blog.naver.com)도 쓸 수 있습니다.'}
                </p>
              </>
            ) : (
              <>
                <label htmlFor={f.ids.text} className="text-[13px] font-extrabold">
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
                  <p id={f.ids.textHint} className={cx('m-0 text-[13px] tabular-nums', f.textTooShort ? 'font-bold text-danger-ink' : 'text-muted')}>
                    {f.chars.toLocaleString()}자 / 최소 {f.minChars}자{f.textTooShort && ' · 본문이 너무 짧습니다'}
                  </p>
                  {submit}
                </div>
              </>
            )}
          </form>

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

        <aside aria-label="결과 예시" className="mx-auto w-full max-w-[14rem] lg:mx-0">
          <p className="m-0 mb-2 text-[12px] font-bold text-muted">견본 칸 (샘플 미리보기)</p>
          <Frame>
            <SceneFrame src="/mock/sample-preview.svg" subtitle="제주 해안 길 3시간 걷기" />
          </Frame>
          <Pencil className="mt-2 block rotate-1">자막은 화면 아래쪽에</Pencil>
        </aside>
      </div>
    </Paper>
  )
}
