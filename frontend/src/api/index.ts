// VITE_USE_MOCK에 따라 실제 엔드포인트 또는 mock을 내보낸다.
// 데이터는 화면이 queries/ 훅으로 가져오고, img·video·a에 넣을 주소(assetUrl·videoUrl)만 여기서 직접 쓴다.
import * as realAssets from './endpoints/assets'
import * as realHealth from './endpoints/health'
import * as realProjects from './endpoints/projects'
import * as realRender from './endpoints/render'
import * as realScenes from './endpoints/scenes'
import * as mockAssets from './mock/assets'
import * as mockHealth from './mock/health'
import * as mockProjects from './mock/projects'
import * as mockRender from './mock/render'
import * as mockScenes from './mock/scenes'

const realApi = {
  getHealth: realHealth.getHealth,
  createProject: realProjects.createProject,
  getProject: realProjects.getProject,
  regenerateProject: realProjects.regenerateProject,
  updateScenes: realScenes.updateScenes,
  uploadAsset: realAssets.uploadAsset,
  assetUrl: realAssets.assetUrl,
  startRender: realRender.startRender,
  videoUrl: realRender.videoUrl,
}

export type Api = typeof realApi

// 타입을 Api로 고정해 mock과 실제의 시그니처가 어긋나면 빌드가 실패한다
const mockApi: Api = {
  getHealth: mockHealth.getHealth,
  createProject: mockProjects.createProject,
  getProject: mockProjects.getProject,
  regenerateProject: mockProjects.regenerateProject,
  updateScenes: mockScenes.updateScenes,
  uploadAsset: mockAssets.uploadAsset,
  assetUrl: mockAssets.assetUrl,
  startRender: mockRender.startRender,
  videoUrl: mockRender.videoUrl,
}

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const api: Api = USE_MOCK ? mockApi : realApi

export const { assetUrl, videoUrl } = api

export { ApiError, isApiError, isNotFound } from './client'
