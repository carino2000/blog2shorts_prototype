import { useMutation } from '@tanstack/react-query'
import { api } from '..'

export function useCreateProject() {
  return useMutation({ mutationFn: api.createProject })
}
