# 백엔드 진행표

> 백엔드 세션이 "작업 시작해"를 받으면 이 파일을 읽고 첫 `[~]` 또는 `[ ]` 단계 하나를 한다(`CLAUDE.md` 0장).
> 표시: `[ ]` 안 함 · `[~]` 진행 중 · `[x]` 완료 · `[!]` 막힘(이유를 작업 기록에)
> 단계 내용의 상세는 `CLAUDE.md` 5·8장. 이 파일은 **상태·필요 조건·완료 조건**만 적는다.

## 사람이 미리 해 둘 일

| # | 할 일 | 명령·방법 | 필요한 단계 |
|---|---|---|---|
| H1 | 가상환경 만들 Python 3.13 | 이미 설치됨(`py -3.13`) | B1 |
| H2 | FFmpeg 설치 | `winget install --id Gyan.FFmpeg` → 앱·터미널 재시작 → `ffmpeg -version` | B3 |
| H3 | 자막 폰트 | Google Fonts에서 Noto Sans KR 내려받아 `static/NotoSansKR-Bold.ttf`를 `backend/fonts/`에 복사 | B3 |
| H4 | 네이버 글 5건 | 성격이 다른 실제 글 URL 5개(사진 많은 글, 사진 없는 글, 구 에디터 글 포함 권장)를 `samples/extract/urls.txt`에 한 줄씩 | B4 |
| H5 | OpenAI 키 | `.env.example`을 `.env`로 복사, `LLM_API_KEY`·`LLM_MODEL` 입력 ✅ 입력됨(10/31) | B5 |
| H6 | TTS 설정 | 키는 H5와 공용. `TTS_MODEL`·`TTS_VOICE` 입력 | B8 |

## 단계

- [x] **B1. 뼈대·health**
  - 필요: H1
  - 할 일: `.venv` 생성, `requirements*.txt`, `main.py`·`config.py`, `GET /api/health`, CORS, `.env.example`(4장 변수 이름만), `README.md`, pytest 설정(`external` 마커 등록, 기본 실행에서 제외), `tests/test_health.py`
  - 완료: `pytest` 통과, 서버 실행 후 `curl localhost:8000/api/health` → `{"ok":true}`, `/docs` 열림

- [x] **B2. 모델·저장소·가짜 파이프라인**
  - 필요: B1
  - 할 일: `models.py`(통합기획서 6-1 그대로, camelCase), `errors.py`(공통 오류 형식), `store.py`, `routers/health.py`·`routers/projects.py`·`pipeline/runner.py`(3장 레이어 규칙)로 `POST /api/projects`·`GET /api/projects/{id}`를 sleep + 샘플 데이터로 `extracting → scripting → ready` 전이. `GET /api/assets/{id}`는 샘플 이미지 서빙
  - 완료: pytest로 전이·404·오류 형식 확인, `/openapi.json`의 `Project` 필드명이 6-1과 일치(목록 비교 결과를 보고에 첨부)
  - 이 단계가 끝나면 프론트가 `VITE_USE_MOCK=false`로 붙어 볼 수 있다

- [x] **B3. 렌더 PoC** (`scripts/poc_render.py`)
  - 필요: B1, H2, H3
  - 할 일: 이미지 3장(가로·세로·정사각, `tests/fixtures/images`에 코드로 생성) + 음성 3개(FFmpeg `sine`/무음으로 생성, TTS 안 씀) + 한글 자막 → 1080×1920 MP4. 모션 5종 확인
  - 완료: `ffprobe`로 해상도·fps·길이 확인, 한글 자막이 깨지지 않음(프레임 하나를 png로 뽑아 눈으로 확인), 장면당 렌더 시간을 `samples/render_poc/RESULT.md`와 `CLAUDE.md` 5장 ⑦에 기록

- [x] **B4. 네이버 구조 추출** (`pipeline/naver.py`, `scripts/try_extract.py`)
  - 필요: B2, H4
  - 할 일: URL 파싱(허용 4종·거부 3종), 글 HTML 요청, 블록 추출, 이미지 다운로드 규칙. 5건 결과 JSON을 `samples/extract/`에 저장, HTML은 `tests/fixtures/naver_html/`에 저장해 오프라인 테스트
  - 완료: 단위 테스트 통과, 5건 중 몇 건이 맞게 추출됐는지·틀린 건 무엇인지 표로 보고. 🟡 항목(모바일 주소 vs PostView, 셀렉터, Referer)의 결론을 `CLAUDE.md`에 반영

- [x] **B5. 관계·대본** (`relate.py`, `script.py`, `providers/llm_*`)
  - 필요: B4, H5
  - 할 일: ② 연결, ③ 프롬프트·JSON 출력(`analysis` 포함)·검증기·1회 재요청, 토큰 사용량 로그
  - 완료: 검증기 단위 테스트(정상 1·위반 5) 통과, 실제 LLM 호출은 `samples/extract`의 5건에 대해서만(`-m external`), 결과를 `samples/script/`에 저장하고 원문에 없는 숫자 여부(요약 포함)를 보고

- [x] **B6. 매칭·실제 파이프라인 연결** (`match.py`, `pipeline` ①~④)
  - 필요: B5
  - 할 일: 가짜 파이프라인을 실제로 교체, 본문 입력(`type: "text"`) 경로, `needsUpload`
  - 완료: 매칭 단위 테스트(이미지 0·1·장면보다 적음), 실제 URL 1건으로 `ready`까지 도달

- [ ] **B7. 편집 API** (`PATCH /scenes`, `POST /assets`, `/regenerate`)
  - 필요: B6
  - 할 일: `CLAUDE.md` 5장 "장면 수정 규칙", 업로드 검사(jpg/png/webp, 10MB, Pillow로 열림)
  - 완료: 규칙별 pytest, 잘못된 파일 → `UPLOAD_INVALID`

- [ ] **B8. TTS·자막** (`tts.py`, `subtitle.py`, `providers/tts_*`)
  - 필요: B7, H6
  - 할 일: 장면별 TTS + hash 캐시, ffprobe 길이, 자막 분할·ASS 생성
  - 완료: 자막 분할 단위 테스트(시간 합 = 음성 길이), 같은 문구 2회 실행 시 두 번째는 TTS 호출 0회(로그로 확인). 실제 TTS 실측 속도로 "1초 ≈ 7자" 기준값 갱신 제안

- [ ] **B9. 렌더·영상 API** (`render.py`, `/render`, `/render?from=`, `/video`)
  - 필요: B3, B8
  - 할 일: PoC를 파이프라인으로 옮김, 진행률, 동시 1건, 실패 단계 재시도, `?download=1`, 단계별(①~⑦) 소요 시간을 로그로 남김(통합기획서 13-2 처리 시간 3분 목표 확인용)
  - 완료: 실제 URL 1건으로 생성 → 렌더 → MP4 1080×1920·30~60초(`ffprobe`), `from=subtitle` 재시도 시 TTS 재호출 없음

- [ ] **B10. 정리**
  - 필요: B9
  - 할 일: 24시간 지난 폴더 삭제, 오류 코드별 한국어 메시지 점검, pytest 정리, README 갱신
  - 완료: 루트 `CLAUDE.md` 2장 시나리오 중 백엔드 몫(1~3, 5~9)을 `/docs`·curl로 통과, 통합기획서 13-1 추적표의 백엔드 칸이 전부 동작함을 표로 보고. 최종 테스트(13-3)와 `docs/test_report.md` 작성은 지휘 세션 몫이라 여기서 하지 않는다

## 작업 기록

| 날짜 | 단계 | 확인 결과 | 남은 문제·사람이 할 일 |
|---|---|---|---|
| 2026-10-29 | 준비 | 빈 파일 뼈대 생성(코드 없음) | H1~H6 |
| 2026-10-29 | B1 | pytest 3 passed. uvicorn 실행 후 `/api/health` → `{"ok":true}`, `/docs` 200. 시작 시 ffmpeg·ffprobe·폰트 없음 경고 출력 확인 | H2(FFmpeg)·H3(폰트) 없음 → B3 전에 필요. pytest-asyncio loop scope 경고·starlette httpx2 경고는 미처리 |
| 2026-10-29 | B2 | pytest 16 passed(전이·404·422·없는 경로 오류 형식, openapi 필드 11개 스키마가 6-1과 일치, 샘플 대본 규칙). 실서버 폴링으로 extracting→scripting→ready, 이미지 200 확인 | ErrorCode에 NOT_FOUND·INVALID_REQUEST·INVALID_STATE 추가(사람 승인 10/29) → 통합기획서 6-1·프론트 types.ts 반영 필요(백엔드 세션 밖). asset ID는 `/api/assets/{assetId}`에 프로젝트 ID가 없어 전역 유일값(`a`+hex10) 사용 |
| 2026-10-29 | B4 | pytest 35 passed·1 skipped(external, `-m external`로 따로 1 passed). 실제 글 19건(copper567, 사람이 준 20건 중 중복 1건 제외) 모두 추출 성공: 제목·문단·소제목·이미지 원문 순서 일치, 이미지 6~9장/글(966px), 외부 추적 이미지·200px 미만 제외. 🟡 결론을 CLAUDE.md ①에 반영 | 19건 모두 같은 블로그·스마트에디터 ONE·이미지 있는 글 → 구 에디터·사진 없는 글·다른 작성자 글은 확인 못 함. 테스트용 HTML은 2건만 저장 |
| 2026-10-29 | B3 | FFmpeg 9.0.2(winget)·NotoSansKR-Bold.ttf(Google Fonts 정적 Bold, 6.2MB) 설치. PoC: 모션 5종 장면 5개 → 1080×1920·30fps·yuv420p, 17.02초, 프레임 수 정확, 한글 자막 프레임 5장 눈으로 확인, 장면 렌더 0.58~1.06초. RESULT.md·CLAUDE.md ⑦ 기록 | 문서 명령대로면 yuvj420p가 됨 → 색 범위 변환 줄 추가(B9에 반영 필요). zoompan 흔들림·실제 플레이어 재생은 눈으로 확인 못 함. 이 세션은 앱 재시작 전이라 PATH에 FFmpeg 없음(사용자 PATH에는 등록됨) |
| 2026-10-31 | B5 | OpenAI 전환(사람 직접 승인). pytest 검증기 14 passed. 실제 호출 5회(재요청 0, gpt-6.1-sol, 입력 10,089·출력 4,666 토큰): 5건 모두 장면 5개, 238~307자, 원문에 없는 숫자 0개(요약 포함). samples/script 저장 | gpt-6.1-sol 단가는 공식 문서에서 못 찾음 → 비용 실측 불가, 대시보드 확인 필요. 공식 모델 페이지에 gpt-4o-mini-tts가 deprecated로 표시됨. 대본에 '원문에 소개된' 같은 어색한 표현이 보임 |
| 2026-10-31 | B6 | pytest 61 passed·1 skipped(매칭 0·1·적음·유효 유지·업로드, 추출 실패, LLM 실패 후 재생성, 입력 400). 실서버 실제 URL 1건(LLM 호출 1회, 누적 6회): extracting 5.7초→scripting 10초→ready 15.7초, 블록 35·이미지 7·장면 5 | 잘못된 URL·짧은 본문은 POST에서 바로 400(프론트 mock과 동일). 업로드만 있는 글도 needsUpload는 true 유지(계약 6-1 "블로그 이미지 0장") |
