import type { RouteObject } from 'react-router'
import { InputPage } from './pages/InputPage'
import { ProjectPage } from './pages/ProjectPage'
import { ResultPage } from './pages/ResultPage'
import { ScenesPage } from './pages/ScenesPage'
import { ScriptPage } from './pages/ScriptPage'

// 경로는 통합기획서 7장 표와 같다
export const routes: RouteObject[] = [
  { path: '/', element: <InputPage /> },
  { path: '/projects/:id', element: <ProjectPage /> },
  { path: '/projects/:id/script', element: <ScriptPage /> },
  { path: '/projects/:id/scenes', element: <ScenesPage /> },
  { path: '/projects/:id/result', element: <ResultPage /> },
]
