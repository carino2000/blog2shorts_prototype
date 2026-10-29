export const queryKeys = {
  health: ['health'] as const,
  project: (id: string) => ['projects', id] as const,
}
