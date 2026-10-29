# blog2shorts 프론트엔드

네이버 블로그 글을 9:16 쇼츠 영상 초안으로 만드는 서비스의 화면. Vite + React 19 + TypeScript + Tailwind CSS v4.
영상 합성·크롤링·AI 호출은 전부 백엔드(`../backend`)가 한다. 프론트에는 API 키가 없다.

## 필요한 것

- Node.js 24 이상, npm 11 이상

## 실행

```bash
npm install
cp .env.example .env     # PowerShell: Copy-Item .env.example .env
npm run dev              # http://localhost:5173
```

- `VITE_USE_MOCK=true`(기본)면 백엔드 없이 가짜 데이터로 모든 화면이 돈다.
- `VITE_USE_MOCK=false`면 `/api` 요청을 Vite 프록시가 `http://localhost:8000`(백엔드)으로 넘긴다. 백엔드를 먼저 켠다.

## 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사(`tsc -b`) + 프로덕션 빌드 |
| `npm run lint` | oxlint |
| `npm test` | Vitest 단위 테스트 |

## 문서

- 규칙·화면 명세: `CLAUDE.md`
- 진행 상황: `PROGRESS.md`
- API·데이터 계약 원본: `../docs/blog2shorts_통합기획.md` 6장
