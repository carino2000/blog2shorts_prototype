import { apiUrl, request } from '../client'
import type { Asset } from '../types'

export function uploadAsset(projectId: string, file: File): Promise<Asset> {
  const form = new FormData()
  form.append('file', file)
  return request<Asset>(`/api/projects/${encodeURIComponent(projectId)}/assets`, { method: 'POST', body: form })
}

/** img src에 넣을 주소. asset.url은 백엔드가 준 경로(/api/assets/{id})라 기본 주소만 붙인다 */
export function assetUrl(asset: Pick<Asset, 'id' | 'url'>): string {
  if (/^https?:\/\//.test(asset.url)) return asset.url
  return apiUrl(asset.url || `/api/assets/${encodeURIComponent(asset.id)}`)
}
