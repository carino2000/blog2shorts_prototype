import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '..'
import type { Project } from '../types'
import { queryKeys } from './keys'

export function useUploadAsset(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.uploadAsset(projectId, file),
    onSuccess: (asset) => {
      qc.setQueryData<Project>(queryKeys.project(projectId), (old) =>
        old && !old.assets.some((a) => a.id === asset.id) ? { ...old, assets: [...old.assets, asset] } : old,
      )
    },
  })
}
