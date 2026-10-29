/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 비우면 /api (Vite 프록시 → localhost:8000) */
  readonly VITE_API_BASE_URL?: string
  /** "true"면 api/mock 사용 */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
