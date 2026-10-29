# blog2shorts — 프론트엔드 개발 문서

> 이 파일은 `frontend/CLAUDE.md`로 둔다. 작업 전에 루트 `CLAUDE.md`와 `docs/blog2shorts_통합기획.md`를 먼저 읽는다.
> 데이터·API 계약의 원본은 통합기획서 6장이다. 이 문서의 타입은 그 복사본이며, 다르면 통합기획서가 맞다.
> 이 폴더에서 연 세션은 **프론트 세션**이다. `frontend/` 밖은 읽기만 한다(루트 `CLAUDE.md` 0장).

## 0. "작업 시작해"를 받으면

사람이 "작업 시작해"(또는 "다음 작업", "계속")라고 하면 아래 순서로 **진행표의 한 단계만** 끝내고 멈춘다. "끝까지 해"라고 하면 막히는 곳이 나올 때까지 단계를 이어서 한다.

1. **읽기**: `../CLAUDE.md`(자동으로 읽힘), `../docs/blog2shorts_통합기획.md` 3·4·6·7장, 이 파일, `PROGRESS.md`.
2. **상태 확인**: `git status`, `git log --oneline -5`. `frontend/`에 커밋 안 된 변경이 있으면 이전 세션이 중단된 것이다. 내용을 보고 이어서 할지 판단하고, 판단이 어려우면 사람에게 묻는다.
3. **단계 고르기**: `PROGRESS.md`에서 `[~]`(진행 중)이 있으면 그것, 없으면 첫 `[ ]` 단계. 고른 단계를 `[~]`로 바꾼다.
4. **전제 조건 확인**: 그 단계의 "필요" 항목을 실제로 확인한다. 백엔드 진행이 필요한 단계는 `../backend/PROGRESS.md`를 읽고, 백엔드 서버가 떠 있는지 `curl localhost:8000/api/health`로 본다. 안 되면 사람이 할 일을 정확히 보고하고 멈춘다. 다음 단계로 건너뛰지 않는다.
5. **계획 한 줄 보고**: 만들 파일, 확인 방법을 3~5줄로 쓰고 바로 진행한다(승인을 기다리지 않는다). 단, 아래 "멈추고 물을 것"에 해당하면 묻고 기다린다.
6. **구현** → 그 단계의 "완료 조건"과 9장 공통 완료 조건을 실제로 확인한다. 화면은 개발 서버를 띄워 브라우저로 본다(데스크톱 앱이면 `preview_start` 이름 `frontend`, 375px·1280px 둘 다).
7. **기록**: `PROGRESS.md`의 단계를 `[x]`로 바꾸고 작업 기록 표에 한 줄 추가.
8. **커밋**: `git add frontend/` → 루트 `CLAUDE.md` 9장 형식으로 커밋.
9. **보고**: 루트 `CLAUDE.md` 10장 형식. 다음 단계와 그 전에 사람이 할 일을 마지막 줄에 쓴다.

멈추고 물을 것:
- 2장 표에 없는 라이브러리가 필요할 때
- 통합기획서 6장과 다른 필드·엔드포인트가 필요할 때(계약 변경 — 직접 고치지 않는다)
- 🟡 항목을 확정해야 진행되는 경우, 5·6장 명세로 판단이 안 서는 화면 결정
- `frontend/` 밖의 파일을 고쳐야 할 때

## 1. 역할

사용자가 블로그 URL/본문을 넣고, 생성된 대본과 장면을 확인·수정하고, 렌더된 MP4를 미리 보고 내려받는 화면을 만든다. 영상 합성·크롤링·AI 호출은 **전부 백엔드**가 한다. 프론트는 API 키를 하나도 갖지 않는다.

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 언어 | ✅ TypeScript (strict) | |
| 프레임워크 | ✅ Vite + React 19 | ✅ 결정(10/29): 이미 설치된 19 유지(문서의 18에서 변경). 다운그레이드하지 않는다 |
| 라우팅 | 🟡 React Router (`react-router`) | |
| 스타일 | 🟡 Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) | v4는 `tailwind.config` 대신 CSS의 `@theme`에 5장 토큰을 등록한다 |
| 서버 상태 | 🟡 TanStack Query (`@tanstack/react-query`) | 폴링·재시도·캐시를 직접 짜지 않기 위해 |
| 아이콘 | `lucide-react` | |
| 폰트 | Pretendard(`pretendard` npm 패키지, 본문·UI), 숫자 표시는 `tabular-nums` | 자막 미리보기만 Noto Sans KR Bold(6-4 참고, Google Fonts `<link>`) |
| 테스트 | `vitest` | 순수 함수(`naverUrl.ts`, 길이 계산) 단위 테스트 |
| 린트 | `oxlint` (설치돼 있음) | `npm run lint` |
| 실행 | ✅ 로컬 전용 (`npm run dev`, `localhost:5173`) | 배포는 보류. 나중에 Vercel에 올리면 SPA 새로고침 404 방지용 `vercel.json` rewrites 추가 |

추가 라이브러리는 이 표에 없으면 설치하기 전에 사람에게 묻는다.

## 3. 폴더 구조

현재 상태(2026-10-29): `create-vite` **JavaScript** 템플릿 그대로다(`App.jsx`, `main.jsx`, `vite.config.js`, 데모 이미지, 템플릿 README). F1에서 이 폴더 안에서 TypeScript로 바꾸고(`tsconfig*.json`, `.tsx`, `vite.config.ts`) 데모 파일(`App.css`, `src/assets/*`, `public/icons.svg`)과 템플릿 README 내용을 지운다. 새 폴더에 다시 만들지 않는다.

```
CLAUDE.md, PROGRESS.md
.claude/launch.json   # 데스크톱 앱 preview_start용 (npm run dev, 5173)
public/mock/          # mock 이미지 3장 + 짧은 mp4 1개 (mp4가 없으면 결과 화면은 포스터 이미지로 대체)
src/
  api/
    types.ts          # 통합기획서 6-1 타입 그대로
    client.ts         # fetch 래퍼(기본 주소, JSON, 오류 → ApiError). 이 파일만 fetch를 부른다
    endpoints/        # 리소스별 분리. 6-2 엔드포인트 한 줄 = 함수 하나
      health.ts       # getHealth
      projects.ts     # createProject, getProject, regenerateProject
      scenes.ts       # updateScenes
      assets.ts       # uploadAsset, assetUrl(id)
      render.ts       # startRender(from?), videoUrl(id, download?)
    mock/             # endpoints/와 같은 파일 이름·같은 함수 시그니처
      db.ts           # 메모리 상태와 시간 기반 상태 전이
      health.ts, projects.ts, scenes.ts, assets.ts, render.ts
    index.ts          # VITE_USE_MOCK에 따라 endpoints 또는 mock을 내보냄. 화면은 여기서만 가져온다
    queries/          # TanStack Query 훅. 리소스별 파일
      keys.ts         # 쿼리 키 한곳에서 정의
      useHealth.ts, useProject.ts(폴링 포함), useCreateProject.ts, useUpdateScenes.ts(디바운스 저장),
      useUploadAsset.ts, useRender.ts, useRegenerate.ts
  pages/
    InputPage.tsx
    ProjectPage.tsx   # status에 따라 처리중/대본/장면/결과로 분기
    ScriptPage.tsx
    ScenesPage.tsx
    ResultPage.tsx
  components/         # Stepper, SceneCard, PhonePreview, SubtitleOverlay, MediaPanel, AssetPicker(모바일 시트),
                      # StageProgress, DurationMeter, ErrorBanner, BackendDownNotice ...
  lib/
    naverUrl.ts       # URL 검증 (아래 6장)
    duration.ts       # 글자 수 → 예상 초 (1초 ≈ 7자, 통합기획서 Q6. 값은 상수 하나로)
    render.ts         # 렌더 기준값 상수: 1080×1920, 자막 크기 64px·하단 360px 등 (백엔드 CLAUDE.md 5장 ⑥⑦과 같은 값)
  styles/
```

### API 계층 규칙
- 화면(`pages/`, `components/`)은 `api/queries/` 훅만 쓴다. `fetch`, URL 문자열, `endpoints/`·`mock/` 직접 import 금지.
- `/api/...` 경로 문자열은 `endpoints/` 안에만 있다. 엔드포인트가 추가되면 해당 리소스 파일에 함수 하나를 더한다.
- 응답 타입은 `types.ts`의 타입만 쓴다. 화면용으로 모양을 바꿔야 하면 훅 안의 `select`나 `lib/`의 함수로 한다.
- 오류는 `client.ts`가 `ApiError { status, code, message }`로 통일한다. 화면은 `code`로 분기하고 `message`를 그대로 보여준다.
- mock과 실제가 같은 시그니처인지는 `index.ts`의 타입으로 강제한다(한쪽만 바뀌면 빌드 실패).

## 4. 환경변수

| 이름 | 예 | 설명 |
|---|---|---|
| `VITE_API_BASE_URL` | (비워 둠) | 비우면 `/api`로 요청하고 Vite 프록시가 `localhost:8000`으로 넘긴다. 배포 시에만 백엔드 주소를 넣는다 |
| `VITE_USE_MOCK` | `true` / `false` | `true`면 `api/mock/` 사용(`api/index.ts`가 선택). 백엔드 없이 모든 화면 개발 가능 |

`vite.config.ts` 프록시 설정:
```ts
server: { proxy: { "/api": "http://localhost:8000" } }
```

## 5. 디자인 방향 (새 디자인)

컨셉: **"블로그 글이 필름 스트립이 되는 편집실"**. 왼쪽(모바일은 위)에 장면이 필름 칸처럼 이어지고, 오른쪽에 9:16 휴대폰 프레임 미리보기가 고정된다. 사용자가 지금 몇 번째 단계인지 항상 보이게 한다.

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `bg` | `#F5F6F8` | `#111317` | 페이지 바탕 |
| `surface` | `#FFFFFF` | `#1A1D23` | 카드·패널 |
| `ink` | `#16181D` | `#ECEEF2` | 본문 |
| `muted` | `#6A7080` | `#9198A6` | 보조 글 |
| `line` | `#E1E4EA` | `#2C3039` | 구분선 |
| `accent` | `#2F5BFF` | `#6E8CFF` | 주요 버튼·선택 상태 |
| `hook` | `#E8890C` | `#F2A541` | Hook 장면 표시 |
| `body` | `#5B6475` | `#9AA3B5` | 본문 장면 표시 |
| `cta` | `#15995A` | `#3CC786` | CTA 장면 표시 |
| `danger` | `#D23A2E` | `#F07267` | 오류 |

규칙:
- 다크모드는 `prefers-color-scheme` 기준으로 자동.
- 장면 역할(Hook·본문·CTA)은 색 + 글자 라벨 둘 다로 표시(색만으로 구분 금지).
- 버튼은 한 화면에 주 버튼(accent 채움) 하나. 나머지는 테두리 버튼.
- 최소 터치 영역 44px, 375px 폭에서 가로 스크롤 없음.
- 둥근 모서리는 카드 12px, 버튼·입력 8px로 통일. 그림자는 미리보기 프레임에만.
- 이모지 아이콘 금지, lucide 아이콘 사용.

### 5-1. 참고 서비스에서 가져온 원칙 (슈퍼쇼츠, 2026-10-29 공개 페이지 기준)

브랜드·로고·문구·화면을 베끼지 않는다. 아래 **원칙만** 가져온다. 무엇을 가져오지 않는지는 통합기획서 4장.

| 원칙 | 우리 화면에서 |
|---|---|
| 첫 화면은 입력창 하나가 주인공 | 입력 화면(6-1) 큰 제목 + URL 입력칸과 제출 버튼이 한 줄. 옆(모바일은 아래)에 9:16 휴대폰 프레임 예시 |
| "실제 폰에서 보는 것처럼" | 미리보기·결과 영상은 항상 같은 `PhoneFrame` 안에서. 둥근 모서리 휴대폰 테두리, 그림자는 여기만 |
| 편집은 3단: 대본·장면 / 미리보기 / 미디어 | 장면 편집(6-4)을 넓은 화면에서 3열로 |
| 미리보기 = 결과물 | 미리보기의 이미지 배치·자막 모양이 백엔드 렌더와 같아야 한다(6-4 "미리보기 일치") |
| 장면이 음성 단위 | 장면 카드에 예상 길이(초), 문구를 고친 장면에 "음성 다시 만듦" 표시 |
| 결과물 사양을 보여줌 | 결과 화면에 `1080×1920 · MP4 · 길이` 표시 |

### 5-2. 화면 폭별 배치

| 폭 | 장면 편집 | 그 외 화면 |
|---|---|---|
| 1280px 이상 | 3열: 장면 목록(380~420px) · 미리보기(가운데, 높이 기준 맞춤) · 미디어 패널(300~340px) | 본문 최대 1120px 가운데 |
| 768~1279px | 2열: 장면 목록 · 미리보기. 미디어는 `AssetPicker` 시트 | 같음 |
| 767px 이하 | 1열. 미리보기는 상단 접이식(기본 접힘, 선택 장면 썸네일만), 미디어는 하단 시트 | 1열, 휴대폰 프레임 예시는 입력칸 아래로 |

## 6. 화면 명세

### 공통
- 상단 Stepper: `입력 → 대본 → 장면 편집 → 영상` 4칸. 현재 단계 강조, 지난 단계는 클릭으로 이동(진행 중 작업이 없을 때만).
- 오류는 `ErrorBanner`로 화면 상단에. 백엔드가 준 `error.message`를 그대로 보여준다.
- 진행 중 상태(`extracting`·`scripting`·`rendering`)에서는 `GET /api/projects/{id}`를 1.5초마다 폴링, 끝나면 중지.
- `GET /api/projects/{id}`가 404면 "작업이 만료되었습니다. 처음부터 다시 시작해 주세요." + 입력 화면 버튼(백엔드가 재시작되면 작업이 사라짐).
- 첫 화면 진입 시 `/api/health`를 호출하고, 실패하면 "백엔드 서버가 꺼져 있습니다. 백엔드를 실행한 뒤 새로고침하세요." 안내를 보여준다(로컬 개발용).

### 6-1. 콘텐츠 입력 `/`
- 탭: `블로그 URL` / `본문 직접 입력`
- URL 검증(입력 즉시, `lib/naverUrl.ts`): 허용 `blog.naver.com/{id}/{logNo}`, `m.blog.naver.com/{id}/{logNo}`, `blog.naver.com/PostView.naver?blogId=&logNo=`(`.nhn` 포함), `https://` 생략 허용. 거부 `naver.me` 단축 링크, 글 번호 없는 블로그 홈, 타 도메인.
- 본문 탭: 글자 수 표시, 200자 미만이면 "본문이 너무 짧습니다" 안내 + 버튼 비활성 🟡
- 주 버튼 `대본 만들기` → `POST /api/projects` → `/projects/:id`로 이동
- 배치(5-1): 큰 제목 한 줄 + 보조 문장 한 줄 → 탭 → 입력칸과 주 버튼이 한 줄(모바일은 버튼이 아래로). Enter로 제출. 오른쪽에 `PhoneFrame` 안 예시 장면(mock 이미지 + 자막 오버레이, 정지 화면)
- 화면 하단에 처리 순서를 3단계 그림으로 보여주는 짧은 설명(구조 추출 → 대본·장면 → 영상)
- 소요 시간 문구는 실측 전까지 쓰지 않는다(근거 없는 "1분 완성" 같은 문구 금지)

### 6-2. 처리 중 `/projects/:id` (extracting · scripting)
- 단계 목록: `글 구조 읽는 중` → `대본과 장면 만드는 중`. 현재 단계에 진행 표시.
- 구조 추출이 끝나면(블록이 들어오면) 제목과 이미지 썸네일을 먼저 보여준다. 기다리는 동안 "내 글이 제대로 읽혔는지" 확인 가능.
- 오류: `EXTRACT_FAILED`·`POST_NOT_FOUND` → "본문 직접 입력으로 다시 시작" 버튼(입력 화면 본문 탭으로), `LLM_FAILED` → `다시 시도`(`/regenerate`)
- `ready`가 되면 자동으로 `/projects/:id/script`로 이동

### 6-3. 대본 확인 `/projects/:id/script`
- 맨 위 "핵심 요약" 카드: `analysis.summary`와 `keyPoints` 목록(기업 요구 FR-AI-01). `analysis`가 null이면 카드를 숨긴다.
- Hook / 본문 / CTA를 역할 색 라벨과 함께 세 블록으로. 예상 길이(초) 표시, 30초 미만·60초 초과면 경고 색.
- 각 장면이 원문 어느 문단에서 왔는지 `sourceBlockIds`로 원문 패널에 하이라이트(오른쪽 또는 접이식).
- 버튼: 주 `장면 편집으로`, 보조 `대본 다시 만들기`(확인 단계를 화면 안에 표시, 브라우저 confirm 사용 금지)
- 대본 문장 직접 수정은 장면 편집에서 한다(여기서는 읽기 전용).

### 6-4. 장면 편집 `/projects/:id/scenes`
- 배치는 5-2. 넓은 화면은 장면 목록 | 미리보기 | 미디어 패널 3열.
- 장면 목록: 장면 카드 4~6개 세로 목록(필름 스트립). 카드 = 순번 + 역할 라벨 + 썸네일 + 문구 입력칸(글자 수 + 예상 초) + 모션 선택(줌 인/줌 아웃/왼쪽/오른쪽/없음). 카드를 누르면 "선택 장면"이 된다.
- 목록 위 `DurationMeter`: 전체 예상 길이(초)와 30~60초 구간 막대. 범위를 벗어나면 경고 색 + "문구를 줄이세요/늘리세요". 렌더 후 `durationSec`가 있는 장면은 예상값 대신 실제값을 쓴다.
- "음성 다시 만듦" 표시: `video`가 한 번 만들어진 뒤 `durationSec=null`이 된 장면(=문구를 고친 장면) 카드에 작은 라벨. 렌더 버튼 옆에 "문구를 고친 장면 N개만 음성을 다시 만듭니다".
- 미리보기(가운데): 선택 장면을 `PhoneFrame`에. CSS로 모션을 반복 재생(3초 루프, `prefers-reduced-motion`이면 정지). 장면 이동 버튼(이전/다음).
- **미리보기 일치**(렌더와 같게): 이미지는 렌더처럼 흐린 배경(`cover` + blur) 위에 원본 전체(`contain`). 자막은 `SubtitleOverlay`로 Noto Sans KR Bold, 흰 글자 + 검은 외곽선, 가운데 정렬, 프레임 높이 기준 크기 64/1920·하단 여백 360/1920 비율, 최대 2줄. 수치는 `lib/render.ts` 상수 하나에서만 가져온다. 자막 내용은 렌더 전엔 장면 문구 앞부분(18자 정도), 렌더 후엔 `subtitles[0].text`.
- 미디어 패널(오른쪽, 넓은 화면): 이 프로젝트의 `assets` 격자(블로그·업로드 구분 라벨) + 업로드 칸. 이미지를 누르면 **선택 장면**의 이미지가 바뀐다. 현재 선택 장면에 쓰인 이미지는 테두리 강조, 다른 장면에 쓰인 이미지는 장면 번호 배지. 드래그 앤 드롭은 MVP에서 하지 않는다.
- 좁은 화면: 카드 썸네일 클릭 → `AssetPicker` 시트(같은 격자 + 업로드). 선택 즉시 반영.
- 저장: 입력 멈춘 뒤 800ms에 `PATCH /scenes` 자동 저장, 상단에 `저장됨`/`저장 중` 표시.
- `needsUpload=true`면 상단 안내 "이 글에는 이미지가 없습니다. 장면에 쓸 이미지를 올려주세요."
- 이미지 없는 장면이 하나라도 있으면 주 버튼 `영상 만들기` 비활성 + 해당 카드 경고 테두리.
- 업로드 제한: jpg/png/webp, 10MB. 클라이언트에서 먼저 검사.

### 6-5. 렌더·결과 `/projects/:id/result`
- `rendering`: 단계 `음성 만들기 → 자막 맞추기 → 영상 합치기` + 퍼센트 바. 예상 소요 문구는 실측 후 기입 🟡
- `done`: `PhoneFrame` 안 9:16 `<video controls playsinline>`(`/video`), 옆에 사양 `1080×1920 · MP4 · {durationSec}초`, 주 버튼 `MP4 다운로드`(`/video?download=1` 링크), 보조 `장면 다시 편집`. 그 아래 한 줄 안내: "휴대폰으로 옮길 때 메신저의 '동영상'이 아니라 '파일'로 보내야 화질이 유지됩니다."
- `error`: 실패한 단계 강조 + `○○부터 다시 시도`(`/render?from=…`).

## 7. Mock 모드 규칙
- `api/mock/`은 `api/endpoints/`와 같은 파일 구성·같은 함수 시그니처를 가진다. 화면 코드는 mock 여부를 모른다.
- 상태 전이를 시간으로 흉내 낸다: 생성 → 1.5초 `extracting` → 3초 `scripting` → `ready`. 렌더는 TTS 2초 → 자막 1초 → 합성 4초 → `done`.
- 샘플 데이터: 블록 10개(문단 7, 이미지 3), `analysis`(요약 2문장 + 포인트 3개), 장면 5개(hook 1, body 3, cta 1). 이미지는 `public/mock/` 정적 파일. 영상은 짧은 샘플 mp4 하나.
- URL에 `fail`이 들어가면 `EXTRACT_FAILED`, 본문에 `fail`이 들어가면 `LLM_FAILED`를 돌려준다(오류 화면 개발용).
- `PATCH /scenes` 흉내도 통합기획서 6-2 규칙을 따른다: `text`가 바뀐 장면은 `durationSec=null`·`subtitles=[]`, 무엇이든 바뀌면 `video=null`, `done`이면 `ready`로.
- 렌더 완료 시 각 장면에 `durationSec`(글자 수 ÷ 7 + 0.3)과 `subtitles`를 채운다.
- mock 이미지는 저작권 걱정 없는 것만: 코드로 만든 단색·그라디언트 PNG/SVG 또는 직접 찍은 사진. 인터넷에서 내려받지 않는다.

## 8. 작업 순서 (바이브코딩 요청 단위)

각 단계 끝에 브라우저에서 확인하고 커밋한다. 단계 번호는 `PROGRESS.md`의 F1~F10과 같고, 필요 조건·완료 조건은 `PROGRESS.md`에 있다.

1. 기존 JS 템플릿을 TS로 전환(3장) + Tailwind v4 + 5장 토큰 + Pretendard, 빈 `InputPage`, Vite 프록시, README에 실행 방법
2. `api/types.ts`(통합기획서 6-1 그대로), `client.ts`, `endpoints/`, `mock/`, `index.ts`, `queries/` (3장 API 계층 규칙)
3. 입력 화면 완성(탭·URL 검증·본문 글자 수·오류·`PhoneFrame` 예시) + `naverUrl.ts` 단위 테스트(Vitest)
4. `ProjectPage` 상태 분기 + 처리 중 화면 + 폴링
5. 대본 확인 화면
6. 장면 편집: 카드 목록 + 문구 수정 + 자동 저장 + `DurationMeter`
7. 장면 편집: 미리보기(미리보기 일치 규칙) + 미디어 패널·`AssetPicker` + 업로드
8. 렌더·결과 화면
9. `VITE_USE_MOCK=false`로 실제 백엔드 연결, 오류 코드별 문구 점검
10. 375px·다크모드·키보드 포커스 점검

## 9. 완료 조건 (각 화면 공통)
- 로딩·빈 데이터·오류 상태가 통합기획서 7장 표대로 모두 보인다.
- 375px, 768px, 1280px에서 깨지지 않는다.
- `npm run build`와 `npm run lint`가 통과한다. `any` 타입 금지.
- mock·실제 백엔드 양쪽에서 같은 흐름이 끝까지 돈다.

## 10. 하지 말 것
- API 키, 크롤링, LLM·TTS 호출, 영상 합성을 프론트에서 하지 않는다.
- 통합기획서 6장에 없는 필드·엔드포인트를 만들지 않는다. 필요하면 사람에게 먼저 묻는다.
- ⛔ 로그인, 결제, 스톡 이미지 검색, AI 이미지 생성 UI를 만들지 않는다.
- `alert`/`confirm`/`prompt`를 쓰지 않는다. 확인 단계는 화면 안에 만든다.
