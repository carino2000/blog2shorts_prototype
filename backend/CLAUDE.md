# blog2shorts — 백엔드 개발 문서

> 이 파일은 `backend/CLAUDE.md`로 둔다. 작업 전에 루트 `CLAUDE.md`와 `docs/blog2shorts_통합기획.md`를 먼저 읽는다.
> API·데이터 계약의 원본은 통합기획서 6장이다. Pydantic 모델은 그 필드명·타입을 그대로 따른다(camelCase JSON).
> 이 폴더에서 연 세션은 **백엔드 세션**이다. `backend/` 밖은 읽기만 한다(루트 `CLAUDE.md` 0장).

## 0. "작업 시작해"를 받으면

사람이 "작업 시작해"(또는 "다음 작업", "계속")라고 하면 아래 순서로 **진행표의 한 단계만** 끝내고 멈춘다. "끝까지 해"라고 하면 막히는 곳이 나올 때까지 단계를 이어서 한다.

1. **읽기**: `../CLAUDE.md`(자동으로 읽힘), `../docs/blog2shorts_통합기획.md` 3·4·5·6·12장, 이 파일, `PROGRESS.md`.
2. **상태 확인**: `git status`, `git log --oneline -5`. `backend/`에 커밋 안 된 변경이 있으면 이전 세션이 중단된 것이다. 내용을 보고 이어서 할지 판단하고, 판단이 어려우면 사람에게 묻는다.
3. **단계 고르기**: `PROGRESS.md`에서 `[~]`(진행 중)이 있으면 그것, 없으면 첫 `[ ]` 단계. 고른 단계를 `[~]`로 바꾼다.
4. **전제 조건 확인**: 그 단계의 "필요" 항목(설치·키·다른 쪽 진행 상황)을 실제로 확인한다(`ffmpeg -version`, `.env` 키 존재 여부 등). 없으면 **사람이 해야 할 일을 정확한 명령과 함께** 보고하고 멈춘다. 다음 단계로 건너뛰지 않는다.
5. **계획 한 줄 보고**: 만들 파일, 확인 방법을 3~5줄로 쓰고 바로 진행한다(승인을 기다리지 않는다). 단, 아래 "멈추고 물을 것"에 해당하면 묻고 기다린다.
6. **구현** → 그 단계의 "완료 조건"을 실제로 실행해서 확인한다.
7. **기록**: `PROGRESS.md`의 단계를 `[x]`로 바꾸고, 작업 기록 표에 날짜·단계·확인 결과·남은 문제를 한 줄 추가한다. 실측값(렌더 시간 등)이 나오면 이 파일 해당 위치에도 적는다.
8. **커밋**: `git add backend/` → `git diff --cached`로 비밀값 확인 → 루트 `CLAUDE.md` 9장 형식으로 커밋.
9. **보고**: 루트 `CLAUDE.md` 10장 형식. 다음 단계가 무엇이고 그 전에 사람이 할 일이 있는지 마지막 줄에 쓴다.

멈추고 물을 것:
- 2장 "허용 라이브러리"에 없는 패키지가 필요할 때
- 통합기획서 6장과 다른 필드·엔드포인트가 필요할 때(계약 변경 — 직접 고치지 않는다)
- 🟡 항목을 확정해야 진행되는 경우
- 실제 LLM·TTS API를 3회 넘게 호출해야 하는 확인 작업(비용)
- `backend/` 밖의 파일을 고쳐야 할 때

## 1. 역할

네이버 블로그 글을 가져와 구조를 뽑고, LLM으로 대본·장면을 만들고, 사용자 수정을 받은 뒤, TTS·자막·FFmpeg로 9:16 MP4를 합성해 제공한다. **API 키는 전부 백엔드 환경변수에만** 둔다.

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 언어 | ✅ Python 3.13 | 타입 힌트 필수. ✅ 결정(10/29) 3.12 → 3.13. 가상환경: `py -3.13 -m venv .venv` |
| 웹 | ✅ FastAPI + Uvicorn | `/docs`에서 자동 문서로 확인 |
| 모델 | Pydantic v2 | `alias_generator=to_camel`, `populate_by_name=True` |
| HTTP | httpx | 크롤링·외부 API |
| HTML 파싱 | BeautifulSoup4 + lxml | 🟡 헤드리스 브라우저는 쓰지 않음(정적 HTML로 충분한지 작업4에서 확인) |
| 영상 | ✅ FFmpeg·ffprobe CLI를 `subprocess`로 | MoviePy 쓰지 않음 🟡 |
| 작업 실행 | 🟡 FastAPI `BackgroundTasks` + 메모리 저장소 | 렌더는 `asyncio.Semaphore(1)`로 동시 1건 |
| 테스트 | pytest | |
| 실행 | ✅ 로컬 전용 (`uvicorn app.main:app --reload --port 8000`) | 배포 보류. 나중에 하면 Render·Docker(7장) |
| FFmpeg | 로컬에 설치 필요 | Windows는 `winget install --id Gyan.FFmpeg`(설치 후 터미널·앱 재시작해야 PATH 반영), macOS는 `brew install ffmpeg` |
| 자막 폰트 | `fonts/NotoSansKR-Bold.ttf` | 고정 굵기(static) Bold 파일을 `fonts/`에 두고 `ass` 필터의 `fontsdir`로 지정한다. 시스템 설치 폰트에 의존하지 않는다(팀원 PC마다 다름). 가변 폰트(`NotoSansKR-VF.ttf`)는 Bold 선택이 안 될 수 있어 쓰지 않는다 🟡. Noto Sans KR은 OFL 라이선스라 저장소에 커밋해도 된다 |

### 허용 라이브러리

이 목록 안에서는 묻지 않고 설치한다. 버전은 설치 시점 최신 안정판으로 `requirements.txt`에 `==`로 고정한다.

| 파일 | 패키지 | 용도 |
|---|---|---|
| `requirements.txt` | `fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings` | 웹·모델·설정 |
| | `python-multipart` | `POST /assets` 파일 업로드(없으면 FastAPI `UploadFile`이 동작하지 않음) |
| | `httpx`, `beautifulsoup4`, `lxml`, `Pillow` | 크롤링·파싱·이미지 크기 |
| | `google-genai` | Gemini (B5에서 설치) |
| | `google-cloud-texttospeech` | Google TTS (B8에서 설치) |
| `requirements-dev.txt` | `-r requirements.txt`, `pytest`, `pytest-asyncio`, `respx` | 테스트. `respx`는 httpx 가짜 응답 |

## 3. 폴더 구조

빈 파일 뼈대는 이미 만들어져 있다(2026-10-29). 아래에 없는 파일·폴더를 새로 만들어야 하면 이 표에 먼저 추가하고 진행한다.

```
CLAUDE.md, PROGRESS.md
README.md               # B1에서 작성: 설치(Python 3.13·FFmpeg·폰트)·.env·실행·테스트 방법
requirements.txt        # 실행 의존성
requirements-dev.txt    # 테스트 의존성 (-r requirements.txt 포함)
.env.example            # 4장 변수 이름만, 값은 비움
.claude/launch.json     # 데스크톱 앱 preview_start용 (uvicorn 8000)
app/
  main.py               # FastAPI 앱, CORS, 라우터 등록, GET /api/health, 시작 시 ffmpeg·폰트 확인
  config.py             # 환경변수 (pydantic-settings)
  models.py             # 통합기획서 6-1 그대로
  store.py              # 메모리 프로젝트 저장소 + 파일 경로 관리
  routers/
    projects.py         # 6-2 엔드포인트
    assets.py
  pipeline/
    naver.py            # ① URL 파싱·글 가져오기·구조 추출·이미지 다운로드
    relate.py           # ② 이미지-문단 연결
    script.py           # ③ LLM 호출·프롬프트·검증
    match.py            # ④ 이미지 매칭 보정
    tts.py              # ⑤ TTS + 캐시
    subtitle.py         # ⑥ 자막 분할·ASS 생성
    render.py           # ⑦ FFmpeg
  providers/
    llm_base.py, llm_gemini.py
    tts_base.py, tts_google.py
  errors.py             # ErrorCode, AppError
scripts/
  poc_render.py         # 작업3 PoC: 이미지·음성·자막 → MP4
  try_extract.py        # 작업4: URL 하나 넣고 blocks JSON 출력
samples/                # 커밋 대상. 팀 공유용 산출물
  extract/              # try_extract.py 결과 JSON (네이버 글 5건)
  script/               # 프롬프트 v1 입력·출력 샘플
  render_poc/           # PoC 결과 기록(시간·ffprobe 출력). mp4 자체는 커밋하지 않음
tests/
  conftest.py
  fixtures/naver_html/  # 저장한 네이버 글 HTML (파서 테스트용, 네트워크 없이)
  fixtures/images/      # 테스트용 작은 이미지
fonts/                  # NotoSansKR-Bold.ttf (사람이 넣음, 커밋)
data/                   # DATA_DIR. 실행 중 생성. 커밋 금지(.gitkeep만)
```

`Dockerfile`은 배포 보류라 만들지 않는다(7장 참고).

## 4. 환경변수

| 이름 | 예 | 설명 |
|---|---|---|
| `CORS_ORIGINS` | `http://localhost:5173` | 로컬에서는 Vite 프록시를 쓰므로 사실상 불필요. 배포 시 프론트 주소 추가 |
| `DATA_DIR` | `./data` | 프로젝트 파일 저장 위치(`.gitignore`에 추가) |
| `LLM_PROVIDER` | `gemini` | |
| `LLM_API_KEY` | (비밀) | |
| `LLM_MODEL` | (운영진 안내 또는 무료 구간 모델) | 코드에 모델명 하드코딩 금지 |
| `TTS_PROVIDER` | `google` | |
| `TTS_CREDENTIALS_JSON` | (비밀, 서비스 계정 JSON 문자열) | 파일로 커밋 금지 |
| `TTS_VOICE` | 한국어 음성 이름 | 🟡 음성 종류 선택은 도전 과제 |
| `MAX_RENDER_CONCURRENCY` | `1` | |

`.env.example`만 커밋하고 실제 `.env`는 `.gitignore`.

- `config.py`는 `.env`와 `DATA_DIR`·`fonts/` 경로를 **`backend/` 폴더 기준 절대 경로**로 푼다(`Path(__file__).resolve().parent.parent`). 서버를 어느 폴더에서 띄우든 같은 곳을 쓰게 하기 위해서다.
- 키가 비어 있어도 서버는 뜬다. 키가 필요한 단계(③ 대본, ⑤ TTS)에서만 `LLM_FAILED`·`TTS_FAILED`로 실패하고, 로그에 "LLM_API_KEY가 비어 있음"처럼 원인을 남긴다.
- `.env`는 사람이 만든다. 세션은 `.env`의 값을 읽어 출력하거나 로그에 남기지 않는다(존재 여부만 확인).

## 5. 파이프라인 상세

### ① 구조 추출 `pipeline/naver.py` — status `extracting`
1. URL에서 `blogId`, `logNo` 추출. 허용 형태는 `../frontend/CLAUDE.md` 6-1과 동일. 실패 → `NOT_NAVER_URL`.
2. 데스크톱 주소는 본문이 iframe이므로 실제 글 HTML을 직접 요청한다. 후보: `https://m.blog.naver.com/{blogId}/{logNo}` 또는 `https://blog.naver.com/PostView.naver?blogId={blogId}&logNo={logNo}` 🟡 (어느 쪽이 안정적인지 작업4에서 확인)
3. 본문 컨테이너를 찾는다. 스마트에디터 ONE은 `.se-main-container` 안의 `.se-component`(텍스트 `.se-text`, 소제목 `.se-sectionTitle`, 이미지 `.se-image`·`.se-imageStrip`), 구 에디터는 `#postViewArea`로 알려져 있다 🟡(추정, 실제 글로 확인)
4. 문서 순서대로 `Block[]` 생성: heading / paragraph(빈 줄 제거, 연속 문단 병합은 하지 않음) / image(캡션은 `text`).
5. 이미지 URL은 `data-lazy-src` 우선, 없으면 `src`. 썸네일 파라미터(`?type=w80_blur` 등)는 큰 크기로 바꾼다 🟡. 서버가 내려받아 `DATA_DIR/{projectId}/assets/`에 저장하고 `Asset`을 만든다. 요청 시 `Referer: https://blog.naver.com/` 헤더가 필요할 수 있다 🟡.
6. 이미지 다운로드 규칙: 최대 20장, 장당 10MB, 가로·세로 200px 미만(아이콘·스티커) 제외, Pillow로 열어 크기 기록.
7. 글이 없거나 비공개 → `POST_NOT_FOUND`, 파싱 결과 문단 0개 → `EXTRACT_FAILED`.
8. 본문 입력(`type: "text"`)이면 빈 줄 기준으로 paragraph 블록만 만들고 이미지 0장 → `needsUpload=true`. 200자 미만 → `TEXT_TOO_SHORT`.

### ② 이미지-문단 연결 `pipeline/relate.py` (코드, LLM 안 씀)
- 각 image 블록의 `linkedBlockIds` = 바로 앞 문단 1개 + 바로 뒤 문단 1개(있는 것만). 앞이 heading이면 heading도 포함.

### ③ 대본·장면 `pipeline/script.py` — status `scripting` (LLM 1회)
입력으로 블록을 다음 형식의 텍스트로 넘긴다(이미지는 실제 파일이 아니라 ID와 연결 문단만):
```
[b1|heading] 제목
[b2|paragraph] 문단...
[b3|image a1] 캡션: ... / 연결: b2,b4
```

시스템 프롬프트(초안 v1):
```
너는 블로그 글을 30~60초 세로 숏폼 내레이션으로 바꾸는 작가다.
규칙:
1. 원문에 있는 사실만 쓴다. 원문에 없는 숫자, 이름, 날짜, 효과, 감정을 만들지 않는다.
2. 구성은 Hook 1장면 → 본문 2~4장면 → CTA 1장면, 총 4~6장면.
3. Hook은 첫 3초 안에 시선을 끄는 한 문장. 질문이나 의외의 사실로 시작한다.
4. 홍보 문구는 CTA 장면에서만 쓴다. CTA는 원문 글을 읽으러 오게 하거나 원문이 말하는 행동을 권한다.
5. 장면 문구는 말하듯 짧게, 장면당 30~90자. 전체 210~400자.
6. 각 장면에 근거 블록 ID(sourceBlockIds)를 1개 이상 단다.
7. 각 장면에 어울리는 이미지(assetId)를 아래 목록에서 고른다. 근거 문단과 연결된 이미지를 우선한다. 없으면 null.
8. motion은 zoom_in, zoom_out, pan_left, pan_right, none 중 하나. 연속 장면에 같은 값을 피한다.
9. 반드시 지정한 JSON 형식만 출력한다.
```

출력 JSON 스키마(LLM 구조화 출력으로 강제):
```json
{
  "script": { "hook": "string", "body": "string", "cta": "string" },
  "scenes": [
    { "role": "hook|body|cta", "text": "string", "assetId": "string|null",
      "motion": "zoom_in|zoom_out|pan_left|pan_right|none", "sourceBlockIds": ["string"] }
  ]
}
```

검증(코드): 장면 수 4~6, 첫 장면 hook·마지막 cta, 전체 글자 수 210~400, `assetId`가 assets에 있음, `sourceBlockIds`가 blocks에 있음, **장면 문구의 숫자가 원문에 없으면 위반**. 위반 시 위반 목록을 붙여 1회 재요청, 그래도 실패하면 `LLM_FAILED`. `estimatedSec` = 전체 글자 수 ÷ 7 🟡(TTS 실측 후 조정). 호출마다 토큰 사용량을 로그로 남긴다.

### ④ 미디어 매칭 보정 `pipeline/match.py`
- `assetId`가 null이거나 없는 ID인 장면 → 블로그 이미지를 원문 순서대로 돌아가며 배정(이미 쓴 이미지는 뒤로).
- 블로그 이미지 0장 → 모든 장면 `assetId=null`, `needsUpload=true`.
- 끝나면 status `ready`.

### ⑤ TTS `pipeline/tts.py` — status `rendering`, stage `tts`
- 장면마다 따로 합성 → `tts/{hash}.mp3`. `hash = sha256(provider + voice + text)`.
- **같은 hash 파일이 있으면 재사용**(문구 안 바뀐 장면은 비용 0). 예산 $50 관리의 핵심.
- 길이는 `ffprobe`로 측정. `durationSec = 음성 길이 + 0.3`(장면 끝 여유).

### ⑥ 자막 `pipeline/subtitle.py` — stage `subtitle`
- 장면 문구를 문장부호(. ? ! ,) 기준으로 나누고, 한 덩어리가 18자를 넘으면 어절 단위로 다시 나눈다. 한 화면 최대 2줄.
- 각 덩어리 시간 = 장면 음성 길이 × (덩어리 글자 수 ÷ 전체 글자 수). 장면 기준 상대 시간으로 `subtitles`에 저장.
- 장면별 `.ass` 파일 생성. 스타일: 폰트 `Noto Sans KR`(ASS `Fontname`은 폰트 파일의 패밀리 이름과 같아야 함) + `Bold=-1`, 크기 64, 흰 글자 + 검은 외곽선 4, 하단에서 360px 위, 가운데 정렬 🟡

### ⑦ 렌더 `pipeline/render.py` — stage `render`
장면별 클립을 만든 뒤 이어 붙인다. 출력 1080×1920, 30fps, H.264 + AAC.

장면 클립(개념 명령, `F = round(durationSec × 30)`):
```
ffmpeg -y -i scene.jpg -i scene.mp3 -filter_complex "
  [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];
  [0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];
  [bg][fg]overlay=(W-w)/2:(H-h)/2,
  zoompan=z='<Z>':x='<X>':y='<Y>':d=F:s=1080x1920:fps=30,
  ass=scene.ass[v];
  [1:a]apad[a]" \
  -map "[v]" -map "[a]" -t <durationSec> \
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k sXX.mp4
```
- 검증(2026-10-29, 기획 작업 환경): 가로 1200×800 이미지로 zoom_in 3.0초·pan_left 3.5초 장면을 만들어 연결 → 프레임 90·105개, 1080×1920·30fps, 연결본 6.52초, 한글 자막 번인 정상. 3초 클립 렌더에 2.0~2.8초 걸림. **팀원 PC에서 다시 실측해야 한다.**
- 원본이 세로가 아니어도 잘리지 않게, 흐린 배경 위에 원본 전체를 올린다.
- 이미지 입력에 `-loop 1`을 쓰지 않는다. 프레임 수는 zoompan의 `d`로 만든다.
- 모션 식(`on` = 출력 프레임 번호):

| motion | z | x | y |
|---|---|---|---|
| zoom_in | `1+0.12*on/F` | `iw/2-(iw/zoom/2)` | `ih/2-(ih/zoom/2)` |
| zoom_out | `1.12-0.12*on/F` | 같음 | 같음 |
| pan_left | `1.12` | `(iw-iw/zoom)*on/F` | `ih/2-(ih/zoom/2)` |
| pan_right | `1.12` | `(iw-iw/zoom)*(1-on/F)` | `ih/2-(ih/zoom/2)` |
| none | `1` | `0` | `0` |

- zoompan 흔들림이 눈에 띄면 overlay 결과를 2배로 키운 뒤 zoompan을 건다(메모리 사용 증가, 서버 사양 확인 후).
- 연결: concat demuxer로 `-c copy`, 마지막에 `-movflags +faststart`. 장면 전환 효과는 MVP에서 없음(컷) 🟡
- 진행률: 장면 클립 i개 완료 = 10% + 80% × i/n, 연결 완료 100%.
- 실패 시 stderr 마지막 20줄을 로그에 남기고 `RENDER_FAILED`. 사용자 메시지에는 stderr를 넣지 않는다.

### Windows에서 주의할 것 (개발 PC가 Windows, 경로에 한글 `넥스트허브` 포함)
- FFmpeg 호출은 `subprocess.run([...])`(리스트 인자)을 `asyncio.to_thread`로 감싼다. `asyncio.create_subprocess_exec`는 Windows에서 uvicorn `--reload` 이벤트 루프와 맞지 않아 `NotImplementedError`가 날 수 있다.
- `ass=` 필터 인자에 `C:\...` 절대 경로를 넣으면 `:`와 `\` 때문에 필터 파싱이 깨진다. FFmpeg를 장면 작업 폴더에서 `cwd=`로 실행하고 `ass=scene.ass:fontsdir=fonts`처럼 **상대 경로**를 쓴다(폰트는 작업 폴더로 복사하거나 상대 경로로 계산).
- `subprocess.run`의 출력은 `encoding="utf-8", errors="replace"`로 읽는다(기본 cp949에서 깨짐).
- 파일 경로는 `pathlib.Path`로만 다룬다. 문자열 더하기 금지.

### 장면 수정 규칙 (`PATCH /scenes`, 통합기획서 6-2)
- `text`가 바뀐 장면만 `durationSec=None`, `subtitles=[]`로 되돌린다. `assetId`·`motion`만 바뀐 장면은 유지.
- 하나라도 바뀌면 `video=None`, `status`가 `done`이면 `ready`로.
- `assetId`는 이 프로젝트의 `assets`에 있는 ID만 허용. 없으면 `MISSING_IMAGE`(400).

### 재시도 규칙
- `POST /render?from=tts|subtitle|render`: 해당 단계부터 다시. 앞 단계 산출물(TTS 캐시, ass 파일)이 있으면 재사용.
- `PATCH /scenes`로 문구가 바뀐 장면만 TTS가 다시 돈다(캐시 hash가 달라지므로 자동).

## 6. 저장소·정리
- 경로: `DATA_DIR/{projectId}/{assets,tts,subs,clips}/`, 최종 `output.mp4`.
- 메모리 저장소는 `dict[str, Project]` + `asyncio.Lock`. 서버가 재시작되면 사라진다(MVP 감수, 프론트는 404를 "작업이 만료되었습니다. 처음부터 다시 시작해 주세요."로 표시).
- 로컬에서는 서버를 껐다 켜면(`--reload` 포함) 작업이 사라진다. 코드 수정 중 진행 중이던 작업이 날아가는 건 정상.
- 24시간 지난 프로젝트 폴더는 시작 시와 1시간마다 삭제.

## 7. 배포 (보류 — 나중에 할 때 참고)
```dockerfile
FROM python:3.13-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```
- 무료 플랜 CPU·메모리 사양은 확인하지 않았다. 작업3 PoC에서 45초 영상 1개 렌더 시간과 메모리를 실측하고, 부족하면 720×1280 렌더 또는 유료 플랜을 팀에 올린다.
- 데모·발표 직전에 `/api/health`를 호출해 서버를 깨운다.

## 8. 작업 순서 (바이브코딩 요청 단위)

각 단계 끝에 `/docs`나 스크립트로 직접 확인하고 커밋한다. 단계 번호는 `PROGRESS.md`의 B1~B10과 같다. 단계별 필요 조건·완료 조건은 `PROGRESS.md`에 있다.

1. FastAPI 뼈대 + `/api/health` + CORS + `.env.example` + README에 로컬 실행 방법(FFmpeg 설치 포함)
2. `models.py`(계약 그대로) + `store.py` + `POST/GET /api/projects`를 가짜 파이프라인(sleep 후 샘플 데이터)으로 → 프론트 연동 가능 상태
3. `scripts/poc_render.py`: 이미지 3장 + mp3 3개 + 자막 → MP4 (작업3 PoC, 렌더 시간 기록)
4. `naver.py` + `scripts/try_extract.py`: 실제 네이버 글 5건으로 blocks JSON 확인 (작업4)
5. `relate.py`, `script.py` + LLM 제공자 + 검증·재요청 (프롬프트 v1 출력 샘플 저장)
6. `match.py` → ①~④ 실제 연결, status 전이 확인
7. `PATCH /scenes`, `POST /assets`, `GET /assets/{id}`, `/regenerate`
8. `tts.py` + 캐시, `subtitle.py`
9. `render.py` + `/render`, `/render?from=`, `/video`
10. 정리 작업(24시간 삭제), 오류 코드별 메시지 점검, pytest 정리

## 9. 테스트 기준
- 단위: URL 파싱(허용 4종·거부 3종), 자막 분할(시간 합 = 음성 길이), LLM 출력 검증기(정상 1건·위반 5종), 매칭 보정(이미지 0·1·장면 수보다 적음).
- 통합: 샘플 네이버 글 1건으로 생성 → ready → 렌더 → MP4 길이 30~60초, 해상도 1080×1920 (`ffprobe`로 확인).
- 실제 외부 API를 부르는 테스트는 `-m external` 표시로 분리해 기본 실행에서 제외(비용 보호).

## 10. 하지 말 것
- API 키·서비스 계정 파일을 코드, 로그, 응답, 저장소에 넣지 않는다.
- 통합기획서 6장에 없는 필드·엔드포인트를 만들지 않는다. 필요하면 사람에게 먼저 묻는다.
- ⛔ 스톡 이미지·영상 API, AI 이미지 생성, 효과음, 로그인, DB를 추가하지 않는다.
- LLM에게 영상 편집 파라미터(FFmpeg 명령)를 만들게 하지 않는다. LLM은 ③의 JSON 스키마 값만 고른다.
- 사용자 입력 문자열을 셸 명령에 직접 넣지 않는다(`subprocess`는 리스트 인자로).
