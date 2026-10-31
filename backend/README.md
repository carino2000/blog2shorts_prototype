# blog2shorts 백엔드

Python 3.13 + FastAPI. 네이버 블로그 글을 9:16 숏폼 MP4로 만드는 API 서버다. 규칙·설계는 `CLAUDE.md`, 진행 상황은 `PROGRESS.md`.

## 설치

### 1. Python 3.13

```bash
py -3.13 --version
```

Windows에서는 `python` 명령이 Microsoft Store 별칭으로 잡혀 동작하지 않을 수 있다. 가상환경 밖에서는 `py -3.13`, 안에서는 `.venv/Scripts/python`을 쓴다.

### 2. 가상환경과 패키지 (`backend/`에서)

```bash
py -3.13 -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt
```

macOS·Linux는 `python3.13 -m venv .venv` 후 `.venv/bin/python`.

### 3. FFmpeg (렌더 단계에 필요)

- Windows: `winget install --id Gyan.FFmpeg` → **터미널과 Claude 앱을 다시 시작**해야 PATH에 잡힌다
- macOS: `brew install ffmpeg`
- 확인: `ffmpeg -version`, `ffprobe -version`

### 4. 자막 폰트 (렌더 단계에 필요)

[Google Fonts의 Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR)을 내려받아 `static/NotoSansKR-Bold.ttf`를 `backend/fonts/`에 복사한다. 가변 폰트(`NotoSansKR-VF.ttf`)는 쓰지 않는다.

FFmpeg나 폰트가 없어도 서버는 뜬다. 대신 시작 로그에 `렌더 준비 안 됨 — 없음: ...` 경고가 나오고 렌더 단계가 실패한다.

### 5. 환경변수

```bash
cp .env.example .env
```

`.env`에 키를 채운다. 빈 칸은 기본값을 쓴다. 키가 없어도 서버는 뜨고, 키가 필요한 단계(대본·TTS)에서만 실패한다. `.env`는 커밋하지 않는다.

| 이름 | 필요한 때 |
|---|---|
| `LLM_API_KEY`, `LLM_MODEL` | OpenAI 키(TTS와 공용)·대본 모델 |
| `TTS_MODEL`, `TTS_VOICE` | 음성 합성 |
| `CORS_ORIGINS` | 기본 `http://localhost:5173`. 쉼표로 여러 개 |
| `DATA_DIR` | 기본 `backend/data` |

## 실행

```bash
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

- 상태 확인: `curl localhost:8000/api/health` → `{"ok":true}`
- API 문서: http://localhost:8000/docs

서버가 재시작되면(`--reload`로 코드를 고칠 때 포함) 메모리에 있던 작업이 사라진다. 정상 동작이다.

- 24시간 지난 프로젝트 폴더는 시작 시와 1시간마다 삭제된다.
- `LLM_MODEL`·`TTS_MODEL`·`TTS_VOICE`는 `.env`에서 정한다. 현재 `gpt-6.1-sol`, `gpt-4o-mini-tts`, `cedar`. `gpt-4o-mini-tts`는 2027-01-06 종료 예정이다.
- 서버 로그에서 토큰 사용량(`LLM 호출`), TTS 캐시(`TTS 캐시 사용`), 단계별 소요 시간(`렌더 소요`)을 볼 수 있다.

## 테스트

```bash
.venv/Scripts/python -m pytest
```

실제 LLM·TTS를 부르는 테스트는 `external` 마커가 붙어 있고, 기본 실행에서는 건너뛴다. 비용이 드니 필요할 때만 실행한다.

```bash
.venv/Scripts/python -m pytest -m external
```
