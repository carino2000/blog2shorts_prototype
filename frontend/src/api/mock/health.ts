import type { HealthResponse } from '../types'
import { latency } from './latency'

export async function getHealth(): Promise<HealthResponse> {
  await latency(50)
  return { ok: true }
}
