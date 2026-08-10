export function startChatPath(mode: string, prompt: string, extras: { productId?: number; experienceId?: number } = {}) {
  const params = new URLSearchParams({ mode, prompt })
  if (extras.productId) params.set('productId', String(extras.productId))
  if (extras.experienceId) params.set('experienceId', String(extras.experienceId))
  return `/ai/new?${params.toString()}`
}
