import type { RouteObject } from 'react-router'
import { RootLayout } from './variants/RootLayout'
import { VariantScreen } from './variants/VariantScreen'

// 경로는 통합기획서 7장 표와 같다. 화면은 주소의 ?v=시안id에 맞는 시안이 그린다(src/variants/)
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <VariantScreen screen="input" /> },
      { path: '/projects/:id', element: <VariantScreen screen="processing" /> },
      { path: '/projects/:id/script', element: <VariantScreen screen="script" /> },
      { path: '/projects/:id/scenes', element: <VariantScreen screen="scenes" /> },
      { path: '/projects/:id/result', element: <VariantScreen screen="result" /> },
    ],
  },
]
