import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes'

const router = createBrowserRouter(routes)

const root = document.getElementById('root')
if (!root) throw new Error('#root 요소가 없습니다')

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
