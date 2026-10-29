import { ApiError } from '../client'
import type { Asset } from '../types'
import { ERROR_MESSAGES, getRecord, persist } from './db'
import { latency } from './latency'
import { checkUpload } from '../../lib/limits'

export async function uploadAsset(projectId: string, file: File): Promise<Asset> {
  await latency(400)
  const rec = getRecord(projectId)
  if (checkUpload(file)) {
    throw new ApiError(400, 'UPLOAD_INVALID', ERROR_MESSAGES.UPLOAD_INVALID)
  }
  const url = await readDataUrl(file)
  const { width, height } = await imageSize(url)
  // assetId는 전역 유일한 임의 문자열(통합기획서 6-1). 형식에 기대지 않는다
  const asset: Asset = { id: `a${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`, origin: 'upload', url, width, height }
  rec.project.assets.push(asset)
  persist()
  return structuredClone(asset)
}

/** mock은 asset.url에 정적 파일 경로(/mock/a1.svg)나 data URL을 그대로 둔다 */
export function assetUrl(asset: Pick<Asset, 'id' | 'url'>): string {
  return asset.url
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new ApiError(400, 'UPLOAD_INVALID', ERROR_MESSAGES.UPLOAD_INVALID))
    reader.readAsDataURL(file)
  })
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new ApiError(400, 'UPLOAD_INVALID', ERROR_MESSAGES.UPLOAD_INVALID))
    img.src = url
  })
}
